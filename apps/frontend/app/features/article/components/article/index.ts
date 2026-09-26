/**
 * Public barrel for the article components folder.
 *
 * The thin TanStack Router wrappers in `app/routes/_cms/articles*.tsx`
 * import the feature components via this barrel so the route files
 * stay short and the components can be unit-tested in isolation.
 */

export { ArticleListPage } from './article-list';
export { ArticleDetailPage } from './article-detail';
export { ArticleEditorPage } from './article-editor';
