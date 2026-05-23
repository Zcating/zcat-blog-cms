import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

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

function buildLogData(opts: {
  method: string;
  path: string;
  status: number;
  duration: number;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  response?: unknown;
  user?: { userId: number; username: string };
}): Record<string, unknown> {
  const logData: Record<string, unknown> = {
    method: opts.method,
    path: opts.path,
    status: opts.status,
    duration: opts.duration,
  };
  if (opts.params && Object.keys(opts.params).length > 0) {
    logData.params = opts.params;
  }
  if (opts.query && Object.keys(opts.query).length > 0) {
    logData.query = opts.query;
  }
  if (opts.body !== undefined) {
    logData.body = opts.body;
  }
  if (
    opts.response &&
    Object.keys(opts.response as Record<string, unknown>).length > 0
  ) {
    logData.response = opts.response;
  }
  if (opts.user) {
    logData.userId = opts.user.userId;
    logData.username = opts.user.username;
  }
  return logData;
}

export const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  const rawBody = await tryGetJsonBody(c.req.raw);
  const maskedBody = rawBody ? maskSensitiveFields(rawBody) : undefined;

  try {
    await next();
  } catch (err) {
    const duration = Date.now() - start;
    const status = err instanceof HTTPException ? err.status : 500;
    const params = c.req.param();
    const query = c.req.query();
    const user = c.get('user') ?? undefined;
    const logData = buildLogData({
      method,
      path,
      status,
      duration,
      params: params && Object.keys(params).length > 0 ? params : undefined,
      query: query && Object.keys(query).length > 0 ? query : undefined,
      body: maskedBody,
      user,
    });
    if (status >= 500) {
      logger.error(`${method} ${path}`, logData);
    } else {
      logger.warn(`${method} ${path}`, logData);
    }
    throw err;
  }

  const duration = Date.now() - start;
  const status = c.res.status;
  const params = c.req.param();
  const query = c.req.query();
  const user = c.get('user') ?? undefined;

  const maskedResponse = maskSensitiveFields(
    (await tryGetJsonResponse(c.res)) ?? {},
  );

  const logData = buildLogData({
    method,
    path,
    status,
    duration,
    params: params && Object.keys(params).length > 0 ? params : undefined,
    query: query && Object.keys(query).length > 0 ? query : undefined,
    body: maskedBody,
    response: maskedResponse,
    user,
  });

  if (status >= 500) {
    logger.error(`${method} ${path}`, logData);
  } else if (status >= 400) {
    logger.warn(`${method} ${path}`, logData);
  } else {
    logger.info(`${method} ${path}`, logData);
  }
});
