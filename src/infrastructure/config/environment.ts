export interface EnvironmentVariables {
  PORT: number;
  INTERNAL_API_KEY: string;
  AUTH_SERVICE_URL: string;
  TICKETS_SERVICE_URL: string;
  HTTP_TIMEOUT_MS: number;
  SMTP_HOST: string;
  SMTP_PORT: number;
  MAIL_FROM: string;
  WEB_URL: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const result = {
    PORT: readNumber(config.PORT, 3006),
    INTERNAL_API_KEY: readString(config.INTERNAL_API_KEY),
    AUTH_SERVICE_URL: readString(
      config.AUTH_SERVICE_URL,
      'http://localhost:3001',
    ),
    TICKETS_SERVICE_URL: readString(
      config.TICKETS_SERVICE_URL,
      'http://localhost:3005',
    ),
    HTTP_TIMEOUT_MS: readNumber(config.HTTP_TIMEOUT_MS, 3000),
    SMTP_HOST: readString(config.SMTP_HOST, 'localhost'),
    SMTP_PORT: readNumber(config.SMTP_PORT, 1025),
    MAIL_FROM: readString(config.MAIL_FROM, 'no-reply@entradasya.local'),
    WEB_URL: readString(config.WEB_URL, 'http://localhost:5173'),
  };
  if (result.INTERNAL_API_KEY.length < 24) {
    throw new Error('INTERNAL_API_KEY debe tener al menos 24 caracteres.');
  }
  if (
    !URL.canParse(result.AUTH_SERVICE_URL) ||
    !URL.canParse(result.TICKETS_SERVICE_URL) ||
    !URL.canParse(result.WEB_URL)
  ) {
    throw new Error('Las URL configuradas deben ser válidas.');
  }
  if (!/^\S+@\S+\.\S+$/.test(result.MAIL_FROM)) {
    throw new Error('MAIL_FROM debe ser un correo válido.');
  }
  return result;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  const parsed =
    typeof value === 'string' || typeof value === 'number'
      ? Number(value)
      : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}
