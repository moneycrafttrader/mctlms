import { Injectable, Logger } from '@nestjs/common';
import { BulkUploadJobType, UserRole } from '@lms/shared-types';
import { SupabaseService } from '../../common/services/supabase.service';
import { EmailService } from '../email/email.service';
import { BatchesService } from '../batches/batches.service';
import { TABLES } from '../../common/constants/tables.constant';
import { parseUsersFile } from '../../common/utils/file-parser.util';
import { UploadStudentsDto } from './dto/upload-students.dto';

export interface RowResult {
  rowNumber: number;
  email: string;
  status: 'success' | 'failure';
  error?: string;
  warning?: string;
  batchAssigned?: boolean;
}

@Injectable()
export class BulkUploadService {
  private readonly logger = new Logger(BulkUploadService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly emailService: EmailService,
    private readonly batchesService: BatchesService,
  ) {}

  async processStudentUpload(
    adminId: string,
    file: Express.Multer.File,
    dto: UploadStudentsDto,
  ): Promise<{
    jobId: string;
    fileName: string;
    totalRows: number;
    successCount: number;
    failureCount: number;
    warningCount: number;
    results: RowResult[];
    failures: { email: string; error: string }[];
  }> {
    // 1. Create the job record
    const { data: job, error: jobError } = await this.supabaseService.client
      .from(TABLES.BULK_UPLOAD_JOBS)
      .insert({
        job_type: BulkUploadJobType.STUDENTS,
        uploaded_by: adminId,
        file_name: file.originalname,
        total_rows: 0,
        success_count: 0,
        failure_count: 0,
        status: 'processing',
        failures: null,
      })
      .select()
      .single();

    if (jobError) {
      this.logger.error(`Failed to create bulk upload job: ${jobError.message}`);
      throw new Error('Could not initialize bulk upload job');
    }

    const jobId = (job as any).id;

    try {
      // 2. Parse the file
      const parsedUsers = parseUsersFile(file.buffer, file.mimetype);

      const totalRows = parsedUsers.length;
      const results: RowResult[] = [];

      // 3. Update total_rows
      await this.supabaseService.client
        .from(TABLES.BULK_UPLOAD_JOBS)
        .update({ total_rows: totalRows })
        .eq('id', jobId);

      // 4. Process each row
      for (const user of parsedUsers) {
        try {
          const password = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

          // 4a. Validate email format before calling Supabase
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(user.email)) {
            results.push({
              rowNumber: user.rowNumber,
              email: user.email,
              status: 'failure',
              error: 'Invalid email format',
            });
            continue;
          }

          // 4b. Create auth user
          const { data: authData, error: authError } =
            await this.supabaseService.client.auth.admin.createUser({
              email: user.email,
              password,
              email_confirm: true,
            });

          let userId: string;

          if (authError) {
            const msg = authError.message.toLowerCase();
            if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
              const { data: listData } =
                await this.supabaseService.client.auth.admin.listUsers();
              const existing = listData?.users.find((u: any) => u.email === user.email);
              if (!existing) {
                results.push({
                  rowNumber: user.rowNumber,
                  email: user.email,
                  status: 'failure',
                  error: 'User exists in auth but could not be retrieved',
                });
                continue;
              }
              userId = existing.id;
            } else {
              results.push({
                rowNumber: user.rowNumber,
                email: user.email,
                status: 'failure',
                error: authError.message,
              });
              continue;
            }
          } else {
            userId = authData.user.id;
          }

          // 4c. Upsert profile
          const { error: profileError } = await this.supabaseService.client
            .from(TABLES.PROFILES)
            .upsert(
              {
                id: userId,
                name: user.name,
                email: user.email,
                phone: user.phone ?? null,
                role: UserRole.STUDENT,
                is_active: true,
              },
              { onConflict: 'id' },
            );

          if (profileError) {
            results.push({
              rowNumber: user.rowNumber,
              email: user.email,
              status: 'failure',
              error: `Profile insert failed: ${profileError.message}`,
            });
            continue;
          }

          // 4d. Batch enrollment — warn on not found, never fail
          let batchAssigned = false;
          let warning: string | undefined;

          if (user.batchName) {
            const lookup = await this.lookupBatchByName(
              user.batchName,
              user.courseName,
            );

            if (!lookup) {
              warning = `Student created but batch "${user.batchName}" not found${user.courseName ? ` in course "${user.courseName}"` : ''} — assign manually`;
            } else if (lookup.multipleMatch) {
              try {
                await this.batchesService.assignStudentToBatch(lookup.batchId, userId);
                batchAssigned = true;
              } catch {
                // batch enrollment failure is non-fatal
              }
              warning = `Multiple batches matched — enrolled in first match`;
            } else {
              try {
                await this.batchesService.assignStudentToBatch(lookup.batchId, userId);
                batchAssigned = true;
              } catch {
                // batch enrollment failure is non-fatal
              }
            }
          } else if (dto.batchId) {
            // Fallback to UI-selected batch
            try {
              await this.batchesService.assignStudentToBatch(dto.batchId, userId);
              batchAssigned = true;
            } catch {
              // batch enrollment failure is non-fatal
            }
          }

          // 4e. Send welcome email
          await this.emailService.sendWelcomeEmail(user.email, user.name);

          results.push({
            rowNumber: user.rowNumber,
            email: user.email,
            status: 'success',
            warning,
            batchAssigned,
          });
        } catch (rowErr: any) {
          results.push({
            rowNumber: user.rowNumber,
            email: user.email,
            status: 'failure',
            error: rowErr.message ?? 'Unknown error',
          });
        }
      }

      const successCount = results.filter((r) => r.status === 'success').length;
      const failureCount = results.filter((r) => r.status === 'failure').length;
      const warningCount = results.filter((r) => r.warning).length;
      const failures = results
        .filter((r) => r.status === 'failure')
        .map((r) => ({ email: r.email, error: r.error! }));

      // 5. Update job as completed
      await this.supabaseService.client
        .from(TABLES.BULK_UPLOAD_JOBS)
        .update({
          status: 'completed',
          success_count: successCount,
          failure_count: failureCount,
          failures:
            results.length > 0
              ? JSON.parse(JSON.stringify(results))
              : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return {
        jobId,
        fileName: file.originalname,
        totalRows,
        successCount,
        failureCount,
        warningCount,
        results,
        failures,
      };
    } catch (err: any) {
      // Mark job as failed on unexpected error
      await this.supabaseService.client
        .from(TABLES.BULK_UPLOAD_JOBS)
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', jobId);

      throw err;
    }
  }

  private async lookupBatchByName(
    batchName: string,
    courseName?: string,
  ): Promise<{ batchId: string; multipleMatch?: boolean } | null> {
    let query = this.supabaseService.client
      .from(TABLES.BATCHES)
      .select('id, courses!inner(name)')
      .ilike('batches.name', batchName.trim());

    if (courseName) {
      query = query.ilike('courses.name', courseName.trim());
    }

    const { data, error } = await query.limit(2);

    if (error || !data || data.length === 0) {
      return null;
    }

    return {
      batchId: data[0].id,
      multipleMatch: data.length > 1,
    };
  }

  async getJobs(): Promise<any[]> {
    const { data, error } = await this.supabaseService.client
      .from(TABLES.BULK_UPLOAD_JOBS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.logger.error(`Failed to fetch bulk upload jobs: ${error.message}`);
      throw new Error('Could not fetch bulk upload jobs');
    }

    return (data ?? []).map((job: any) => {
      const stored = job.failures ?? [];
      const isNewFormat = stored.length > 0 && 'rowNumber' in stored[0];

      return {
        ...job,
        failures: isNewFormat
          ? stored.filter((r: any) => r.status === 'failure').map((r: any) => ({ email: r.email, error: r.error }))
          : stored,
        results: isNewFormat ? stored : [],
      };
    });
  }
}
