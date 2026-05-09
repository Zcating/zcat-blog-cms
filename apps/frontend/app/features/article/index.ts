export const articleRoutes = {
  list: {
    path: 'articles',
    module: 'features/article/routes/articles.tsx',
  },
  detail: {
    path: 'articles/:id',
    module: 'features/article/routes/articles.id.tsx',
  },
};
