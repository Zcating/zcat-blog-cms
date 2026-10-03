import { createFileRoute } from '@tanstack/react-router';

import { forwardVisitRequest } from '@blog/server/visitor';

export const Route = createFileRoute('/api/blog/visitor')({
  server: {
    handlers: {
      GET: ({ request }) => forwardVisitRequest(request),
      POST: ({ request }) => forwardVisitRequest(request),
    },
  },
});
