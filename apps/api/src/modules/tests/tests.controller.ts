import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TestsService } from './tests.service';
import { CreateTestDto } from './dto/create-test.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  findAll() {
    return this.testsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTestDto) {
    return this.testsService.create(dto);
  }

  @Post(':id/attempt')
  submitAttempt(@Param('id') id: string, @Body() dto: SubmitAttemptDto) {
    return this.testsService.submitAttempt(id, dto);
  }
}
