import { createFileRoute } from '@tanstack/react-router';

import ArticleCategories from '@cms/features/article-categories/routes/article-categories';

export const Route = createFileRoute('/_cms/article-categories')({
  component: ArticleCategories,
});
