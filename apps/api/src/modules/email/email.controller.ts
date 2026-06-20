import { Controller, Post, Body } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmailService } from './email.service';
import { SendTestEmailDto } from './dto/send-test-email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @Roles(UserRole.ADMIN)
  async sendTest(@Body() dto: SendTestEmailDto) {
    const sent = await this.emailService.sendEmail(
      dto.email,
      'Test Email from LMS Platform',
      '<h1>Test Email</h1><p>If you received this, the email service is configured correctly.</p>',
    );

    return {
      success: sent,
      message: sent
        ? `Test email sent to ${dto.email}.`
        : 'Failed to send test email. Check server logs.',
    };
  }
}
