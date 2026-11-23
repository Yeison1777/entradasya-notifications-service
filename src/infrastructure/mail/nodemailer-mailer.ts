import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

import { MailDeliveryError } from '../../application/errors/notifications.errors';
import { Mailer, MailMessage } from '../../application/ports/mailer';

@Injectable()
export class NodemailerMailer implements Mailer {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.from = config.getOrThrow<string>('MAIL_FROM');
    this.transporter = nodemailer.createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT', 1025),
      secure: false,
    });
  }

  async send(message: MailMessage): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, ...message });
    } catch {
      throw new MailDeliveryError();
    }
  }

  async verify(): Promise<void> {
    try {
      await this.transporter.verify();
    } catch {
      throw new MailDeliveryError();
    }
  }
}
