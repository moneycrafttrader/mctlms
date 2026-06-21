import {
  Controller,
  Get,
  Post,
  Res,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { BulkUploadService } from './bulk-upload.service';
import { UploadStudentsDto } from './dto/upload-students.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@lms/shared-types';

@Controller('bulk-upload')
export class BulkUploadController {
  constructor(private readonly bulkUploadService: BulkUploadService) {}

  @Get('template')
  @Roles(UserRole.ADMIN)
  downloadTemplate(@Res() res: Response) {
    const csvContent = 'name,email,phone,courseName,batchName\nJohn,Doe,john@example.com,1234567890,Morning Batch';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="student_upload_template.csv"');
    res.status(200).send(csvContent);
  }

  @Get('jobs')
  @Roles(UserRole.ADMIN)
  async getJobs() {
    return this.bulkUploadService.getJobs();
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
