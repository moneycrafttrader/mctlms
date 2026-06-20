import { Injectable, Logger } from '@nestjs/common';
import { BulkUploadJobType, UserRole } from '@lms/shared-types';
import { SupabaseService } from '../../common/services/supabase.service';
import { EmailService } from '../email/email.service';
import { BatchesService } from '../batches/batches.service';
import { TABLES } from '../../common/constants/tables.constant';
import { parseUsersFile } from '../../common/utils/file-parser.util';
import { UploadStudentsDto } from './dto/upload-students.dto';

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
      let successCount = 0;
      const failures: { email: string; error: string }[] = [];

      // 3. Update total_rows
      await this.supabaseService.client
        .from(TABLES.BULK_UPLOAD_JOBS)
        .update({ total_rows: totalRows })
        .eq('id', jobId);

      // 4. Process each row
      for (const user of parsedUsers) {
        try {
          const password = crypto.randomUUID().replace(/-/g, '').slice(0, 8);

          // 4a. Create auth user
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
                failures.push({
                  email: user.email,
                  error: 'User exists in auth but could not be retrieved',
                });
                continue;
              }
              userId = existing.id;
            } else {
              failures.push({ email: user.email, error: authError.message });
              continue;
            }
          } else {
            userId = authData.user.id;
          }

          // 4b. Upsert profile
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
            failures.push({ email: user.email, error: `Profile insert failed: ${profileError.message}` });
            continue;
          }

          // 4c. Enroll in batch if requested
          if (dto.batchId) {
            try {
              await this.batchesService.assignStudentToBatch(dto.batchId, userId);
            } catch (batchErr: any) {
              failures.push({
                email: user.email,
                error: `Batch enrollment failed: ${batchErr.message}`,
              });
              continue;
            }
          }

          // 4d. Send credentials email
          const emailSubject = 'Your LMS Account Has Been Created';
          const emailHtml = `<p>Hello ${user.name},</p>
<p>An account has been created for you on the LMS platform.</p>
<p><strong>Email:</strong> ${user.email}</p>
<p><strong>Password:</strong> ${password}</p>
<p>Please log in and change your password.</p>`;

          await this.emailService.sendEmail(user.email, emailSubject, emailHtml);

          successCount++;
        } catch (rowErr: any) {
          failures.push({ email: user.email, error: rowErr.message ?? 'Unknown error' });
        }
      }

      // 5. Update job as completed
      await this.supabaseService.client
        .from(TABLES.BULK_UPLOAD_JOBS)
        .update({
          status: 'completed',
          success_count: successCount,
          failure_count: failures.length,
          failures: failures.length > 0 ? JSON.parse(JSON.stringify(failures)) : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      return {
        jobId,
        fileName: file.originalname,
        totalRows,
        successCount,
        failureCount: failures.length,
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

    return (data ?? []).map((job: any) => ({
      ...job,
      failures: job.failures ?? [],
    }));
  }
}
