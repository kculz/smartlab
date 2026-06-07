import { NextFunction, Request, Response } from 'express';
import { logInfo, logWarn, sanitizeRequestBody } from '../utils/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  logInfo('Request received', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: sanitizeRequestBody(req.body as Record<string, unknown> | undefined),
    query: req.query,
  });

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const statusCode = res.statusCode;

    if (statusCode >= 500) {
      logWarn('Request failed', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode,
        durationMs,
      });
      return;
    }

    logInfo('Request completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      durationMs,
    });
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      logWarn('Request closed before completion', {
        requestId,
        method: req.method,
        path: req.originalUrl,
      });
    }
  });

  next();
};
