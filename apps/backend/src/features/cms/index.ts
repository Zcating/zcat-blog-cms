import { Hono } from 'hono';

import { authMiddleware } from '../../middleware/auth';

import articleRoutes from './article/article.route';
import articleTagRoutes from './article-tag/article-tag.route';
import authRoutes from './auth/auth.route';
import photoRoutes from './photo/photo.route';
import photoAlbumRoutes from './photo-album/photo-album.route';
import statisticsRoutes from './statistics/statistics.route';
import systemSettingRoutes from './system-setting/system-setting.route';
import userInfoRoutes from './user-info/user-info.route';

const cmsRoutes = new Hono();

// Auth routes (no auth required)
cmsRoutes.route('/', authRoutes);

// Protected CMS routes
const cmsProtected = new Hono();
cmsProtected.use('*', authMiddleware);
cmsProtected.route('/', articleRoutes);
cmsProtected.route('/', articleTagRoutes);
cmsProtected.route('/', photoRoutes);
cmsProtected.route('/', photoAlbumRoutes);
cmsProtected.route('/', statisticsRoutes);
cmsProtected.route('/', systemSettingRoutes);
cmsProtected.route('/', userInfoRoutes);
cmsRoutes.route('/', cmsProtected);

export { cmsRoutes };
