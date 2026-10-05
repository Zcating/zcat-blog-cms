import { createFileRoute } from '@tanstack/react-router';

import { proxyOssImage } from '@blog/server/oss';

export const Route = createFileRoute('/api/oss/image')({
  server: {
    handlers: {
      GET: ({ request }) => proxyOssImage(request),
    },
  },
});
