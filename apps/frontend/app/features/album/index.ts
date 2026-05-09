export const albumRoutes = {
  list: {
    path: 'albums',
    module: 'features/album/routes/albums.tsx',
  },
  detail: {
    path: 'albums/:id',
    module: 'features/album/routes/albums.id.tsx',
  },
};
