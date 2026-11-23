import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BatchCurriculumService } from './batch-curriculum.service';
import { AddCurriculumItemDto } from './dto/add-curriculum-item.dto';
import { UpdateCurriculumItemDto } from './dto/update-curriculum-item.dto';
import { ReorderCurriculumDto } from './dto/reorder-curriculum.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { BatchAccessCaller } from '../../common/services/batch-access.service';

@Controller()
export class BatchCurriculumController {
  constructor(private readonly service: BatchCurriculumService) {}

  @Get('admin/batch-curriculum/:batchId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAll(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @CurrentUser() user: BatchAccessCaller,
  ) {
    return this.service.findAll(batchId, user);
  }

  @Get('batches/:batchId/curriculum')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  findPublished(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @CurrentUser() user: BatchAccessCaller,
  ) {
    return this.service.findPublished(batchId, user);
  }

  @Post('admin/batch-curriculum/:batchId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  add(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Body() dto: AddCurriculumItemDto,
    @CurrentUser() user: BatchAccessCaller,
  ) {
    return this.service.add(batchId, dto, user);
  }

  @Patch('admin/batch-curriculum/:id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCurriculumItemDto,
    @CurrentUser() user: BatchAccessCaller,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete('admin/batch-curriculum/:id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: BatchAccessCaller,
  ) {
    return this.service.remove(id, user);
  }

  @Patch('admin/batch-curriculum/:batchId/reorder')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  reorder(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Body() dto: ReorderCurriculumDto,
    @CurrentUser() user: BatchAccessCaller,
  ) {
    return this.service.reorder(batchId, dto, user);
  }

  @Patch('admin/batch-curriculum/:batchId/reorder-categories')
  @Roles(UserRole.ADMIN)
  reorderCategories(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Body() dto: ReorderCategoriesDto,
  ) {
    return this.service.reorderCategories(batchId, dto);
  }

  @Get('admin/batch-curriculum/:batchId/integrity')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  integrity(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @CurrentUser() user: BatchAccessCaller,
  ) {
    return this.service.integrityCheck(batchId, user);
  }
}