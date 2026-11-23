import { ConfigService } from '@nestjs/config';

import { Mailer } from './ports/mailer';
import { NotificationMetadataGateway } from './ports/notification-metadata.gateway';
import { NotificationsService } from './notifications.service';

const orderId = '40000000-0000-4000-8000-000000000001';
const customerId = '40000000-0000-4000-8000-000000000002';

describe('NotificationsService', () => {
  let metadata: jest.Mocked<NotificationMetadataGateway>;
  let mailer: jest.Mocked<Mailer>;
  let service: NotificationsService;

  beforeEach(() => {
    metadata = {
      get: jest.fn().mockResolvedValue({
        customerName: 'Cliente Prueba',
        customerEmail: 'cliente@example.com',
        ticketIds: [
          '40000000-0000-4000-8000-000000000010',
          '40000000-0000-4000-8000-000000000011',
        ],
        attachments: [
          {
            filename: 'entrada-40000000-0000-4000-8000-000000000010.pdf',
            content: Buffer.from('%PDF-1'),
            contentType: 'application/pdf',
          },
        ],
      }),
    };
    mailer = {
      send: jest.fn().mockResolvedValue(undefined),
      verify: jest.fn().mockResolvedValue(undefined),
    };
    const config = {
      getOrThrow: jest.fn().mockReturnValue('http://localhost:5173'),
    } as unknown as ConfigService;
    service = new NotificationsService(metadata, mailer, config);
  });

  it('envía una confirmación con un enlace por entrada', async () => {
    const result = await service.sendPurchaseConfirmation(orderId, customerId);

    expect(result).toEqual({ sent: true, orderId });
    expect(mailer.send).toHaveBeenCalledTimes(1);
    const message = mailer.send.mock.calls[0][0];
    expect(message.to).toBe('cliente@example.com');
    expect(message.text).toContain(
      '/mis-entradas/40000000-0000-4000-8000-000000000010',
    );
    expect(message.text).toContain(
      '/mis-entradas/40000000-0000-4000-8000-000000000011',
    );
  });

  it('adjunta los PDFs de las entradas al correo', async () => {
    await service.sendPurchaseConfirmation(orderId, customerId);
    const message = mailer.send.mock.calls[0][0];

    expect(message.attachments).toHaveLength(1);
    expect(message.attachments?.[0]).toMatchObject({
      filename: 'entrada-40000000-0000-4000-8000-000000000010.pdf',
      contentType: 'application/pdf',
    });
    expect(message.attachments?.[0]?.content).toEqual(Buffer.from('%PDF-1'));
  });

  it('escapa el nombre del cliente dentro del HTML', async () => {
    metadata.get.mockResolvedValue({
      customerName: '<script>alert(1)</script>',
      customerEmail: 'cliente@example.com',
      ticketIds: ['40000000-0000-4000-8000-000000000010'],
      attachments: [],
    });

    await service.sendPurchaseConfirmation(orderId, customerId);
    const message = mailer.send.mock.calls[0][0];
    expect(message.html).not.toContain('<script>');
    expect(message.html).toContain('&lt;script&gt;');
  });

  it('no incorpora información de tarjeta en el mensaje', async () => {
    await service.sendPurchaseConfirmation(orderId, customerId);
    const serialized = JSON.stringify(mailer.send.mock.calls[0][0]);
    expect(serialized).not.toContain('cardNumber');
    expect(serialized).not.toContain('cvv');
  });
});
