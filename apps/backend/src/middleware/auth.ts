import { createMiddleware } from 'hono/factory';
import jwt from 'jsonwebtoken';

import { appRuntime } from '../common/effect/runtime';
import { config } from '../common/config.service';
import { tokenWhitelistService } from '../features/cms/auth/whitelist.service';

// Extend Hono context variables type
declare module 'hono' {
  interface ContextVariableMap {
    user: {
      userId: number;
      username: string;
    };
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ code: 'ERR0002', message: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      sub: string;
      username: string;
    };

    const isValid = await appRuntime.runPromise(
      tokenWhitelistService.validate(token),
    );
    if (!isValid) {
      return c.json({ code: 'ERR0002', message: 'Unauthorized' }, 401);
    }

    c.set('user', {
      userId: Number(payload.sub),
      username: payload.username,
    });
    await next();
  } catch {
    return c.json({ code: 'ERR0002', message: 'Unauthorized' }, 401);
  }
});