import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  SendMailOptions,
  MailDeliveryResult,
} from './interfaces/mail-options.interface';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: Transporter;
  private defaultFrom!: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host =
      process.env.SMTP_HOST ||
      this.configService.get<string>('SMTP_HOST') ||
      'mailpit';
    const port = Number(
      process.env.SMTP_PORT ||
      this.configService.get<number>('SMTP_PORT') ||
      1025,
    );
    const secure =
      (process.env.SMTP_SECURE || this.configService.get<string>('SMTP_SECURE')) === 'true' ||
      port === 465;
    const user = process.env.SMTP_USER || this.configService.get<string>('SMTP_USER');
    const pass = process.env.SMTP_PASS || this.configService.get<string>('SMTP_PASS');

    this.defaultFrom = this.configService.get<string>(
      'SMTP_FROM',
      'Movie Platform <no-reply@movie-platform.local>',
    );

    // Initialize transporter. If user/pass are empty (like Mailpit), omit auth.
    this.transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    // Verify SMTP connection on bootstrap
    try {
      await this.transporter.verify();
      this.logger.log(
        `SMTP connection established successfully -> ${host}:${port}`,
      );
    } catch (error: any) {
      this.logger.warn(
        `SMTP connection verification failed (${host}:${port}): ${error.message}. Emails may not be delivered.`,
      );
    }
  }

  /**
   * Send generic email with support for HTML and attachments
   */
  async sendMail(options: SendMailOptions): Promise<MailDeliveryResult> {
    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        attachments: options.attachments,
      });

      this.logger.log(
        `Email delivered to [${options.to}] (Message-ID: ${info.messageId})`,
      );

      return {
        messageId: info.messageId,
        accepted: (info.accepted as string[]) ?? [],
        rejected: (info.rejected as string[]) ?? [],
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to deliver email to [${options.to}]: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Helper method for Welcome Email
   */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Welcome to Movie Website! 🎬',
      text: `Hello ${name}, welcome to Movie Website! Your account is now active.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #e50914; margin-bottom: 8px;">Welcome, ${name}! 🍿</h1>
          <p style="font-size: 16px; color: #444;">
            Thank you for joining <strong>Movie Website</strong>. Your account has been registered successfully.
          </p>
          <div style="margin: 32px 0;">
            <a href="http://localhost:3000" style="background-color: #e50914; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Start Exploring
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0;" />
          <p style="font-size: 13px; color: #888;">
            If you did not sign up for this account, please disregard this email.
          </p>
        </div>
      `,
    });
  }
}
