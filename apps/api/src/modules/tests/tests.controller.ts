import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BatchAccessCaller } from '../../common/services/batch-access.service';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post()
  create(@Body() dto: CreateTestDto, @CurrentUser() user: BatchAccessCaller) {
    return this.testsService.create(dto, user.id, user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @CurrentUser() user: BatchAccessCaller) {
    return this.testsService.duplicate(id, user.id, user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('batchId') batchId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: BatchAccessCaller,
  ) {
    return this.testsService.findAll(
      {
        status,
        batchId,
        search,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
      user,
    );
  }



  @Roles(UserRole.STUDENT)
  @Get('my/dashboard')
  getDashboardTests(@CurrentUser() user: { id: string }) {
    return this.testsService.getDashboardTests(user.id);
  }

  @Roles(UserRole.STUDENT)
  @Get('my')
  getMyTests(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.testsService.getMyTests(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user?: BatchAccessCaller) {
    return this.testsService.findOne(id, user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestDto, @CurrentUser() user?: BatchAccessCaller) {
    return this.testsService.update(id, dto, user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @CurrentUser() user?: BatchAccessCaller) {
    return this.testsService.updateStatus(id, status, user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user?: BatchAccessCaller) {
    return this.testsService.archive(id, user);
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user?: BatchAccessCaller) {
    return this.testsService.remove(id, user);
  }
}
