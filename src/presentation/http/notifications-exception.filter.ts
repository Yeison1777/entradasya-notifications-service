import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  MailDeliveryError,
  NotificationDataError,
  NotificationDependencyError,
} from '../../application/errors/notifications.errors';

type NotificationsError =
  MailDeliveryError | NotificationDataError | NotificationDependencyError;

@Catch(MailDeliveryError, NotificationDataError, NotificationDependencyError)
export class NotificationsExceptionFilter implements ExceptionFilter<NotificationsError> {
  catch(exception: NotificationsError, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const result = this.describe(exception);
    response.status(result.statusCode).json({
      ...result,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private describe(error: NotificationsError): {
    statusCode: number;
    code: string;
  } {
    if (error instanceof NotificationDataError) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        code: 'INVALID_NOTIFICATION_DATA',
      };
    }
    if (error instanceof MailDeliveryError) {
      return { statusCode: HttpStatus.BAD_GATEWAY, code: 'MAIL_UNAVAILABLE' };
    }
    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'DEPENDENCY_UNAVAILABLE',
    };
  }
}
