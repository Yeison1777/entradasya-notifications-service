export class NotificationDependencyError extends Error {
  constructor(dependency: string) {
    super(`No se pudo obtener información desde ${dependency}.`);
  }
}

export class NotificationDataError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class MailDeliveryError extends Error {
  constructor() {
    super('No se pudo entregar el correo de confirmación al servidor SMTP.');
  }
}
