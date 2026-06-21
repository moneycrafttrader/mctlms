import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { BulkUploadService } from './bulk-upload.service';
import { UploadStudentsDto } from './dto/upload-students.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@lms/shared-types';

@Controller('bulk-upload')
export class BulkUploadController {
  constructor(private readonly bulkUploadService: BulkUploadService) {}

  @Public()
  @Get('template')
  downloadTemplate(@Res() res: Response) {
    // courseName and batchName are optional — leave blank if assigning batch later via UI
    const csvContent = 'name,email,phone,courseName,batchName\nJohn Doe,john@example.com,9876543210,Dhanlabh With Shubh,12 PM - 2 PM';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="student_upload_template.csv"');
    res.status(200).send(csvContent);
  }

  @Get('jobs')
  @Roles(UserRole.ADMIN)
  async getJobs() {
    return this.bulkUploadService.getJobs();
  }

  @Get('jobs/:jobId')
  @Roles(UserRole.ADMIN)
  async getJobStatus(@Param('jobId') jobId: string) {
    const status = await this.bulkUploadService.getJobStatus(jobId);
    if (!status) {
      throw new NotFoundException('Job not found');
    }
    return status;
  }

  @Post('students')
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadStudents(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadStudentsDto,
    @CurrentUser() user: any,
  ) {
    return this.bulkUploadService.processStudentUpload(user.id, file, dto);
  }
}
