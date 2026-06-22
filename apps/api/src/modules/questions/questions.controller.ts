import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto, BulkImportQuestionDto } from './dto/create-question.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  create(@Body() dto: CreateQuestionDto, @CurrentUser() user: { id: string }) {
    return this.questionsService.create(dto, user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post('bulk-import')
  bulkImport(@Body() dto: BulkImportQuestionDto, @CurrentUser() user: { id: string }) {
    return this.questionsService.bulkImport(dto, user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  findAll(
    @Query('topicId') topicId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('questionType') questionType?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.questionsService.findAll({
      topicId,
      difficulty,
      questionType,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get('topics')
  getTopics() {
    return this.questionsService.getTopics();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.questionsService.archive(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(':id/unarchive')
  unarchive(@Param('id') id: string) {
    return this.questionsService.unarchive(id);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}
