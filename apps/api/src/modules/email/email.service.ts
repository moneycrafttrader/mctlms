/**
 * EmailService — sends transactional emails via Resend API (HTTPS, not SMTP).
 *
 * Why Resend instead of Gmail SMTP?
 * Render blocks outbound TCP on ports 465/587 (SMTP ports).
 * Resend sends over HTTPS (port 443) which Render never blocks.
 *
 * Setup:
 * 1. Sign up at resend.com (free — 3000 emails/month)
 * 2. Create an API key → add as RESEND_API_KEY in Render env vars
 * 3. For production: verify mctlearn.com domain in Resend → add DNS records
 * 4. For testing: set EMAIL_FROM=onboarding@resend.dev (works immediately)
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromAddress: string;
  private isStub: boolean;
  private frontendUrl: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.fromAddress =
      this.config.get<string>('EMAIL_FROM') ?? 'onboarding@resend.dev';
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    // Stub mode: if no API key set, log emails instead of sending.
    // Useful in local dev without a Resend account.
    if (!apiKey || apiKey === 're_xxxxxxxxxxxx') {
      this.isStub = true;
      this.logger.warn(
        'EmailService running in STUB MODE — emails will be logged, not sent.',
      );
      this.logger.warn('Set RESEND_API_KEY in .env to enable real email sending.');
    } else {
      this.isStub = false;
      this.resend = new Resend(apiKey);
      this.logger.log(`EmailService ready — sending from: ${this.fromAddress}`);
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.isStub || !this.resend) return;

    try {
      // Simple API call to verify the key is valid
      await this.resend.emails.send({
        from: this.fromAddress,
        to: this.fromAddress,
        subject: 'MCT Learn — SMTP migration test',
        html: '<p>Resend API key is working.</p>',
      });
      this.logger.log('Resend API key verified — email sending is operational.');
    } catch (err: any) {
      this.logger.error(`Resend API key verification FAILED: ${err.message}`);
      this.logger.error(
        'Check RESEND_API_KEY in environment variables. It must be a valid Resend API key (starts with re_).',
      );
    }
  }

  /**
   * Generic send method — used by invoice service for PDF attachments
   * and by the admin test endpoint. Kept for backwards compatibility.
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: EmailAttachment[],
  ): Promise<boolean> {
    if (this.isStub || !this.resend) {
      this.logger.warn(
        `[STUB] Would send email to=${to} subject="${subject}" body(length)=${html.length}`,
      );
      return true;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
        attachments: attachments?.map((a) => ({
          filename: a.filename,
          content: a.content instanceof Buffer ? a.content.toString('base64') : a.content,
        })),
      });

      if (error) {
        this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        console.error(`[EMAIL FAILED] ${to}:`, error);
        return false;
      }

      this.logger.log(
        `Email sent to ${to} — subject="${subject}" (id=${data?.id})`,
      );
      return true;
    } catch (err: any) {
      this.logger.error(`Exception sending email to ${to}: ${err.message}`);
      console.error(`[EMAIL EXCEPTION] ${to}:`, err.message);
      return false;
    }
  }

  /**
   * Welcome email for newly created students with login credentials.
   * Called after createUser() in both single-add and bulk-upload flows.
   * This method is always fire-and-forget — never await it.
   */
  async sendWelcomeEmail(
    toEmail: string,
    studentName: string,
    tempPassword: string,
  ): Promise<void> {
    const loginUrl = this.frontendUrl;

    if (this.isStub || !this.resend) {
      this.logger.log(
        `[STUB EMAIL] To: ${toEmail} | Name: ${studentName} | Password: ${tempPassword}`,
      );
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: toEmail,
        subject: 'Your MCT Learn account is ready',
        html: this.buildWelcomeEmailHtml(
          studentName,
          toEmail,
          tempPassword,
          loginUrl,
        ),
      });

      if (error) {
        this.logger.error(
          `Failed to send welcome email to ${toEmail}: ${error.message}`,
        );
        console.error(`[EMAIL FAILED] ${toEmail}:`, error);
        return;
      }

      this.logger.log(`Welcome email sent to ${toEmail} (id: ${data?.id})`);
    } catch (err: any) {
      this.logger.error(
        `Exception sending welcome email to ${toEmail}: ${err.message}`,
      );
      console.error(`[EMAIL EXCEPTION] ${toEmail}:`, err.message);
    }
  }

  /**
   * Login alert email — sent when a new/unknown device logs in.
   * Fire-and-forget — never await this from the login path.
   */
  async sendLoginAlert(
    toEmail: string,
    userName: string,
    browser: string,
    os: string,
    ipAddress: string,
    frontendUrl: string,
  ): Promise<void> {
    if (this.isStub || !this.resend) {
      this.logger.log(
        `[STUB LOGIN ALERT] To: ${toEmail} | User: ${userName} | Device: ${browser} on ${os} | IP: ${ipAddress}`,
      );
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: toEmail,
        subject: 'New login to your MCT Learn account',
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">MCT Learn</h1>
  </div>
  <div style="background: #f9f9f9; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
    <h2 style="color: #1e3a5f; margin-top: 0;">New sign-in detected</h2>
    <p>Hi ${userName},</p>
    <p>A new device just signed in to your MCT Learn account:</p>
    <div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 100px;"><strong>Browser</strong></td>
          <td style="padding: 8px 0;">${browser}</td>
        </tr>
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 8px 0; color: #666;"><strong>OS</strong></td>
          <td style="padding: 8px 0;">${os}</td>
        </tr>
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 8px 0; color: #666;"><strong>IP Address</strong></td>
          <td style="padding: 8px 0; font-family: monospace;">${ipAddress}</td>
        </tr>
      </table>
    </div>
    <p>If this was you, you can ignore this email. To manage trusted devices, visit your profile.</p>
    <p style="margin-top: 24px;">
      <a href="${frontendUrl}/login"
         style="background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
        Review Account &rarr;
      </a>
    </p>
    <p style="color: #888; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
      If you did not sign in, please change your password immediately and contact support.<br>
      MCT Learn &mdash; Money Craft Trader
    </p>
  </div>
</body>
</html>`.trim(),
      });

      if (error) {
        this.logger.error(`Failed to send login alert to ${toEmail}: ${error.message}`);
        return;
      }

      this.logger.log(`Login alert sent to ${toEmail} (id: ${data?.id})`);
    } catch (err: any) {
      this.logger.error(`Exception sending login alert to ${toEmail}: ${err.message}`);
    }
  }

  /**
   * Builds the HTML body for the welcome email.
   * Keep it simple — plain HTML, no external CSS frameworks.
   * Gmail clips emails over 102kb, so keep this minimal.
   */
  private buildWelcomeEmailHtml(
    name: string,
    email: string,
    password: string,
    loginUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">MCT Learn</h1>
  </div>
  <div style="background: #f9f9f9; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
    <h2 style="color: #1e3a5f; margin-top: 0;">Welcome, ${name}!</h2>
    <p>Your student account has been created. Here are your login details:</p>

    <div style="background: white; border: 1px solid #ddd; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 140px;"><strong>Login URL</strong></td>
          <td style="padding: 8px 0;">
            <a href="${loginUrl}/login" style="color: #1e3a5f;">${loginUrl}/login</a>
          </td>
        </tr>
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 8px 0; color: #666;"><strong>Email (User ID)</strong></td>
          <td style="padding: 8px 0; font-family: monospace;">${email}</td>
        </tr>
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 8px 0; color: #666;"><strong>Temporary Password</strong></td>
          <td style="padding: 8px 0; font-family: monospace; font-size: 16px; letter-spacing: 1px;">
            <strong>${password}</strong>
          </td>
        </tr>
      </table>
    </div>

    <div style="background: #fff8e1; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 16px 0;">
      <strong>&#9888;&#65039; Please change your password after first login</strong>
    </div>

    <p style="margin-top: 24px;">
      <a href="${loginUrl}/login"
         style="background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
        Login to MCT Learn &rarr;
      </a>
    </p>

    <p style="color: #888; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
      If you did not expect this email, please ignore it or contact your administrator.<br>
      MCT Learn &mdash; Money Craft Trader
    </p>
  </div>
</body>
</html>
    `.trim();
  }
}
