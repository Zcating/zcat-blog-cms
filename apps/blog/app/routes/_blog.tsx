import { createFileRoute } from '@tanstack/react-router';

import { BlogLayoutRoute } from '@blog/features/layouts/pages/blog-layout';

export const Route = createFileRoute('/_blog')({
  component: BlogLayoutRoute,
});
