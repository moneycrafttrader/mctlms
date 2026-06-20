import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { AssignStudentsDto } from './dto/assign-students.dto';
import { AssignTeachersDto } from './dto/assign-teachers.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.batchesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      isActive !== undefined ? isActive === 'true' : undefined,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.batchesService.findById(id);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateBatchDto, @CurrentUser() user: { id: string }) {
    return this.batchesService.create(dto, user.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateBatchDto>) {
    return this.batchesService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/reassign-course')
  reassignCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.batchesService.reassignCourse(id, courseId);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/students')
  assignStudents(@Param('id') id: string, @Body() dto: AssignStudentsDto) {
    return this.batchesService.assignStudents(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id/students')
  removeStudents(@Param('id') id: string, @Body('studentIds') studentIds: string[]) {
    return this.batchesService.removeStudents(id, studentIds);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/teachers')
  assignTeachers(@Param('id') id: string, @Body() dto: AssignTeachersDto) {
    return this.batchesService.assignTeachers(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id/students')
  getStudents(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.batchesService.getStudents(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id/teachers')
  getTeachers(@Param('id') id: string) {
    return this.batchesService.getTeachers(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id/sessions')
  getSessions(@Param('id') id: string) {
    return this.batchesService.getSessionsForBatch(id);
  }
}
