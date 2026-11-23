import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MAILER } from './ports/mailer';
import type { Mailer } from './ports/mailer';
import { NOTIFICATION_METADATA_GATEWAY } from './ports/notification-metadata.gateway';
import type { NotificationMetadataGateway } from './ports/notification-metadata.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly webUrl: string;

  constructor(
    @Inject(NOTIFICATION_METADATA_GATEWAY)
    private readonly metadata: NotificationMetadataGateway,
    @Inject(MAILER) private readonly mailer: Mailer,
    config: ConfigService,
  ) {
    this.webUrl = config.getOrThrow<string>('WEB_URL').replace(/\/$/, '');
  }

  async sendPurchaseConfirmation(
    orderId: string,
    customerId: string,
  ): Promise<{ sent: true; orderId: string }> {
    const data = await this.metadata.get(orderId, customerId);
    const links = data.ticketIds.map(
      (ticketId) => `${this.webUrl}/mis-entradas/${ticketId}`,
    );
    const safeName = escapeHtml(data.customerName);
    const linkItems = links
      .map(
        (link, index) =>
          `<li><a href="${escapeHtml(link)}">Descargar entrada ${index + 1}</a></li>`,
      )
      .join('');

    await this.mailer.send({
      to: data.customerEmail,
      subject: 'Tus entradas de EntradasYa',
      attachments: data.attachments,
      text: [
        `Hola ${data.customerName},`,
        'Tu compra fue confirmada. Adjuntamos los PDFs de tus entradas y puedes consultarlas en:',
        ...links,
        'Cada código permite un solo ingreso. No compartas tus entradas.',
      ].join('\n'),
      html: [
        '<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111827">',
        `<h1 style="color:#ef4444">Compra confirmada</h1><p>Hola ${safeName},</p>`,
        '<p>Tu compra fue procesada correctamente. Adjuntamos los PDFs de tus entradas:</p>',
        `<ul>${linkItems}</ul>`,
        '<p><strong>Cada código permite un solo ingreso.</strong> No compartas tus entradas.</p>',
        '</body></html>',
      ].join(''),
    });
    this.logger.log(`Confirmación enviada para orderId=${orderId}`);
    return { sent: true, orderId };
  }
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  );
}
