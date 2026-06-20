import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly fromEmail: string;
  private readonly isStub: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.isStub = !apiKey || apiKey === 'stub';

    if (this.isStub) {
      this.logger.warn(
        'RESEND_API_KEY is missing or set to "stub" — emails will be logged instead of sent.',
      );
    } else {
      this.resend = new Resend(apiKey);
    }

    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ??
      'noreply@example.com';

    if (this.fromEmail === 'noreply@example.com') {
      this.logger.warn(
        'RESEND_FROM_EMAIL is not set — using noreply@example.com as fallback.',
      );
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: EmailAttachment[],
  ): Promise<boolean> {
    if (this.isStub) {
      this.logger.warn(
        `[STUB] Would send email to=${to} subject="${subject}" body(length)=${html.length} attachments=${attachments?.length ?? 0}`,
      );
      return true;
    }

    try {
      const { error } = await this.resend!.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
        attachments,
      });

      if (error) {
        this.logger.error(`Resend send failed: ${error.message}`);
        return false;
      }

      this.logger.log(`Email sent successfully to ${to} — subject="${subject}"`);
      return true;
    } catch (err: any) {
      this.logger.error(`Email send threw an exception: ${err.message}`);
      return false;
    }
  }
}
