import { Injectable } from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Injectable()
export class TestsService {
  findAll() {
    return [];
  }

  findOne(id: string) {
    return { id };
  }

  create(dto: CreateTestDto) {
    return dto;
  }

  submitAttempt(id: string, dto: SubmitAttemptDto) {
    return { testId: id, ...dto };
  }
}
