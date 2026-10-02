import { Hono } from 'hono';

import { authMiddleware } from '../../middleware/auth';

import articleRoutes from './article/article.route';
import articleTagRoutes from './article-tag/article-tag.route';
import photoRoutes from './photo/photo.route';
import photoAlbumRoutes from './photo-album/photo-album.route';
import statisticsRoutes from './statistics/statistics.route';
import systemSettingRoutes from './system-setting/system-setting.route';
import userInfoRoutes from './user-info/user-info.route';

const cmsRoutes = new Hono();

cmsRoutes.use('*', authMiddleware);

cmsRoutes.route('/', articleRoutes);
cmsRoutes.route('/', articleTagRoutes);
cmsRoutes.route('/', photoRoutes);
cmsRoutes.route('/', photoAlbumRoutes);
cmsRoutes.route('/', statisticsRoutes);
cmsRoutes.route('/', systemSettingRoutes);
cmsRoutes.route('/', userInfoRoutes);

export { cmsRoutes };
