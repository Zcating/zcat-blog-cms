import { createMiddleware } from 'hono/factory';

import { logger } from '@backend/utils';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'secret',
  'authorization',
  'hmac',
]);

function maskSensitiveFields(value: unknown): unknown {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(maskSensitiveFields);
    }
    const masked: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      masked[key] = SENSITIVE_KEYS.has(key) ? '***' : maskSensitiveFields(val);
    }
    return masked;
  }
  return value;
}

async function tryGetJsonBody(req: Request): Promise<unknown> {
  try {
    const cloned = req.clone();
    const contentType = cloned.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return undefined;
    }
    const text = await cloned.text();
    if (!text) return undefined;
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

async function tryGetJsonResponse(res: Response): Promise<unknown> {
  try {
    const cloned = res.clone();
    const contentType = cloned.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return undefined;
    }
    return (await cloned.json()) as unknown;
  } catch {
    return undefined;
  }
}

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  const rawBody = await tryGetJsonBody(c.req.raw);

  const maskedBody = rawBody ? maskSensitiveFields(rawBody) : undefined;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  const params = c.req.param();
  const query = c.req.query();
  const maskedResponse = maskSensitiveFields(
    (await tryGetJsonResponse(c.res)) ?? {},
  );

  const logData: Record<string, unknown> = {
    method,
    path,
    status,
    duration,
  };

  if (params && Object.keys(params).length > 0) {
    logData.params = params;
  }
  if (query && Object.keys(query).length > 0) {
    logData.query = query;
  }
  if (maskedBody !== undefined) {
    logData.body = maskedBody;
  }
  if (Object.keys(maskedResponse as Record<string, unknown>).length > 0) {
    logData.response = maskedResponse;
  }

  const user = c.get('user');
  if (user) {
    logData.userId = user.userId;
    logData.username = user.username;
  }

  if (status >= 500) {
    logger.error(`${method} ${path}`, logData);
  } else if (status >= 400) {
    logger.warn(`${method} ${path}`, logData);
  } else {
    logger.info(`${method} ${path}`, logData);
  }
});
