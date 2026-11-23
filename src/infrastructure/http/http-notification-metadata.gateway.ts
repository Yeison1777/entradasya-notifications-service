import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  NotificationDataError,
  NotificationDependencyError,
} from '../../application/errors/notifications.errors';
import {
  NotificationMetadata,
  NotificationMetadataGateway,
} from '../../application/ports/notification-metadata.gateway';

interface UserResponse {
  id: string;
  name: string;
  email: string;
}

interface TicketResponse {
  id: string;
  customerId: string;
}

@Injectable()
export class HttpNotificationMetadataGateway implements NotificationMetadataGateway {
  private readonly authUrl: string;
  private readonly ticketsUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(config: ConfigService) {
    this.authUrl = config.getOrThrow<string>('AUTH_SERVICE_URL');
    this.ticketsUrl = config.getOrThrow<string>('TICKETS_SERVICE_URL');
    this.apiKey = config.getOrThrow<string>('INTERNAL_API_KEY');
    this.timeout = config.get<number>('HTTP_TIMEOUT_MS', 3000);
  }

  async get(
    orderId: string,
    customerId: string,
  ): Promise<NotificationMetadata> {
    const [customer, tickets] = await Promise.all([
      this.request<UserResponse>(
        `${this.authUrl}/internal/users/${customerId}`,
        'auth-service',
      ),
      this.request<TicketResponse[]>(
        `${this.ticketsUrl}/internal/tickets/orders/${orderId}`,
        'tickets-service',
      ),
    ]);
    if (customer.id !== customerId) {
      throw new NotificationDataError('El cliente de la orden no coincide.');
    }
    if (
      tickets.length === 0 ||
      tickets.some((ticket) => ticket.customerId !== customerId)
    ) {
      throw new NotificationDataError(
        'La orden no tiene entradas válidas para el cliente.',
      );
    }
    const attachments = await Promise.all(
      tickets.map(async (ticket) => ({
        filename: `entrada-${ticket.id}.pdf`,
        content: await this.requestBuffer(
          `${this.ticketsUrl}/internal/tickets/${ticket.id}/pdf`,
          'tickets-service',
        ),
        contentType: 'application/pdf',
      })),
    );
    return {
      customerName: customer.name,
      customerEmail: customer.email,
      ticketIds: tickets.map((ticket) => ticket.id),
      attachments,
    };
  }

  private async request<T>(url: string, dependency: string): Promise<T> {
    const response = await this.fetch(url, dependency);
    try {
      return (await response.json()) as T;
    } catch {
      throw new NotificationDependencyError(dependency);
    }
  }

  private async requestBuffer(
    url: string,
    dependency: string,
  ): Promise<Buffer> {
    const response = await this.fetch(url, dependency);
    try {
      return Buffer.from(await response.arrayBuffer());
    } catch {
      throw new NotificationDependencyError(dependency);
    }
  }

  private async fetch(url: string, dependency: string): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { 'x-internal-api-key': this.apiKey },
        signal: AbortSignal.timeout(this.timeout),
      });
    } catch {
      throw new NotificationDependencyError(dependency);
    }
    if (!response.ok) throw new NotificationDependencyError(dependency);
    return response;
  }
}
