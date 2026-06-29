import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { AdminTestsController } from './admin-tests.controller';
import { TestsService } from './tests.service';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [ObservabilityModule],
  controllers: [TestsController, AdminTestsController],
  providers: [TestsService],
  exports: [TestsService],
})
export class TestsModule {}
