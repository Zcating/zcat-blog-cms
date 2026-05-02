import { Hono } from 'hono';

import blogRoutes from './blog/blog.route';

const publicRoutes = new Hono();
publicRoutes.route('/', blogRoutes);

export { publicRoutes };
