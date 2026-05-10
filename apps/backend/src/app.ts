import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { cmsRoutes } from './features/cms';
import authRoutes from './features/cms/auth/auth.route';
import { publicRoutes } from './features/public';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

// CORS
const app = new Hono();

// Request logging
app.use('*', requestLogger);

// Global error handler
app.onError(errorHandler);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Route registrations
app.route('/api/auth', authRoutes);
app.route('/api/cms', cmsRoutes);
app.route('/api/blog', publicRoutes);

export { app };
