import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { cmsRoutes } from './features/cms';
import { publicRoutes } from './features/public';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

// CORS
const app = new Hono();
app.use(
  '*',
  cors({
    origin: [process.env.FRONTEND_URL ?? '', process.env.BLOG_URL ?? ''].filter(
      Boolean,
    ),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Data-Hash'],
    credentials: true,
  }),
);

// Request logging
app.use('*', requestLogger);

// Global error handler
app.onError(errorHandler);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Route registrations
app.route('/', cmsRoutes);
app.route('/', publicRoutes);

export { app };
