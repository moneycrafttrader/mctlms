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
  private readonly brandName = 'Money Craft Trader';

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
  ): Promise<boolean> {
    const subject = `Welcome to Dhanlabh with Shubh!`;
    const loginUrl = 'https://mctlms-web.vercel.app/login';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Brand header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f,#2d5a87);padding:32px 32px 24px;text-align:center;">
              <h1 style="margin:0 0 4px;font-size:22px;color:#ffffff;font-weight:700;letter-spacing:0.5px;">MONEY CRAFT TRADER</h1>
              <p style="margin:0;font-size:13px;color:#a3c2e0;font-weight:400;">Dhanlabh with Shubh</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px 20px;">
              <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">
                Dear <strong>${studentName}</strong>,
              </p>
              <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">
                Welcome to <strong>Dhanlabh with Shubh</strong> &mdash; your journey towards financial
                wisdom and market mastery begins today.
              </p>
              <p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.7;">
                Your account has been created on the <strong>Money Craft Trader</strong> learning
                platform. Use the email address <strong>${studentEmail}</strong> to sign in.
                If this is your first time, click <strong>"Forgot Password"</strong> on the login
                page to set your password.
              </p>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <a href="${loginUrl}"
                 style="display:inline-block;padding:13px 40px;background:linear-gradient(135deg,#1e3a5f,#2d5a87);color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                Log In to Your Account
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
                Money Craft Trader &mdash; Dhanlabh with Shubh
              </p>
              <p style="margin:0;font-size:11px;color:#b0b7c3;">
                Learn. Trade. Grow.
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
