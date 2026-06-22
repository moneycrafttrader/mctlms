import { Controller, Post, Body, Get, Patch, Delete, Param, Headers } from '@nestjs/common';
import { UserRole } from '@lms/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmailService } from './email.service';
import { EmailWebhookService } from './email-webhook.service';
import { EmailTemplatesService } from './email-templates.service';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { UpsertTemplateDto } from './dto/upsert-template.dto';

@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailWebhookService: EmailWebhookService,
    private readonly emailTemplatesService: EmailTemplatesService,
  ) {}

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

  @Post('webhooks/resend')
  async handleResendWebhook(
    @Body() payload: any,
    @Headers('svix-id') svixId?: string,
    @Headers('svix-timestamp') svixTimestamp?: string,
    @Headers('svix-signature') svixSignature?: string,
  ) {
    await this.emailWebhookService.handleResendWebhook(payload);
    return { received: true };
  }

  // Template Registry
  @Roles(UserRole.ADMIN)
  @Get('templates')
  async listTemplates() {
    return this.emailTemplatesService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post('templates')
  async upsertTemplate(@Body() dto: UpsertTemplateDto) {
    return this.emailTemplatesService.upsertTemplate(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('templates/:name/toggle')
  async toggleTemplate(
    @Param('name') name: string,
    @Body('isActive') isActive: boolean,
  ) {
    await this.emailTemplatesService.toggleActive(name, isActive);
    return { success: true };
  }
}
