/*
 * SMTP email service using nodemailer with Gmail
 *
 * Why this file exists:
 *   - Provides sendEmail() for generic transactional emails and
 *     sendWelcomeEmail() for the student-onboarding flow.
 *   - Uses Gmail SMTP (port 587, STARTTLS) with a Google App Password.
 *   - Falls back to stub logging when SMTP_USER is missing or set to "stub",
 *     so the app never crashes because email is unreachable.
 *
 * A junior should know:
 *   - SMTP_USER = full Gmail address (e.g. "you@gmail.com").
 *   - SMTP_PASS = a Google App Password (16 chars, no spaces).
 *   - FRONTEND_URL is used in email templates for the login link.
 *   - All send methods return false on failure and only log errors —
 *     they never throw, so callers don't need try/catch for the email itself.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null = null;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;
  private readonly isStub: boolean;
  private readonly brandName = 'MCT LMS';

  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.isStub = !user || user === 'stub';
    this.fromEmail = user ?? 'noreply@example.com';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    if (this.isStub) {
      this.logger.warn(
        'SMTP_USER is missing or set to "stub" — emails will be logged instead of sent.',
      );
    } else {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user, pass },
      });
      this.logger.log(
        `Email transporter configured for ${user} via smtp.gmail.com:587`,
      );
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: EmailAttachment[],
  ): Promise<boolean> {
    if (this.isStub || !this.transporter) {
      this.logger.warn(
        `[STUB] Would send email to=${to} subject="${subject}" body(length)=${html.length}`,
      );
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.brandName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        attachments: attachments as nodemailer.SendMailOptions['attachments'],
      });

      this.logger.log(
        `Email sent to ${to} — subject="${subject}" (messageId=${info.messageId})`,
      );
      return true;
    } catch (err: any) {
      this.logger.error(
        `Failed to send email to ${to}: ${err.message}`,
        err.stack,
      );
      return false;
    }
  }

  async sendWelcomeEmail(
    studentEmail: string,
    studentName: string,
    batchName: string,
  ): Promise<boolean> {
    const subject = `Welcome to ${this.brandName}!`;
    const loginUrl = `${this.frontendUrl}/login`;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 32px 32px 16px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #111827;">Welcome to ${this.brandName}!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 16px;">
              <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
                Hi <strong>${studentName}</strong>,
              </p>
              <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
                You have been enrolled in <strong>${batchName}</strong> on the ${this.brandName} platform.
                Your account has been created and you can log in right away.
              </p>
              <p style="margin: 0 0 12px; font-size: 15px; color: #374151; line-height: 1.6;">
                Use the email address <strong>${studentEmail}</strong> to sign in. If this is a
                new account, use the <strong>"Forgot Password"</strong> link on the login page
                to set your password.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <a href="${loginUrl}"
                 style="display: inline-block; padding: 12px 32px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">
                Log In to ${this.brandName}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                ${this.brandName} &mdash; Learn anytime, anywhere.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return this.sendEmail(studentEmail, subject, html);
  }
}
