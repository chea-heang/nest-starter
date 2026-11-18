import { Attachment } from 'nodemailer/lib/mailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Attachment[];
}

export interface MailDeliveryResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}
