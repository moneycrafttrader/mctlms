import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BulkUploadService } from './bulk-upload.service';
import { UploadStudentsDto } from './dto/upload-students.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@lms/shared-types';

@Controller('bulk-upload')
export class BulkUploadController {
  constructor(private readonly bulkUploadService: BulkUploadService) {}

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
