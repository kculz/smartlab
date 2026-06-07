type LogContext = Record<string, unknown>;

const timestamp = (): string => new Date().toISOString();

export const logInfo = (message: string, context: LogContext = {}): void => {
  console.log(`[${timestamp()}] INFO  ${message}`, context);
};

export const logWarn = (message: string, context: LogContext = {}): void => {
  console.warn(`[${timestamp()}] WARN  ${message}`, context);
};

export const logError = (message: string, context: LogContext = {}): void => {
  console.error(`[${timestamp()}] ERROR ${message}`, context);
};

export const sanitizeRequestBody = (body: Record<string, unknown> | undefined): Record<string, unknown> => {
  if (!body) {
    return {};
  }

  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken'];

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[redacted]';
    }
  }

  return sanitized;
};
