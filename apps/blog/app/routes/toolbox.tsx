import { createFileRoute } from '@tanstack/react-router';

import { ToolboxLayoutRoute } from '@blog/features';

export const Route = createFileRoute('/toolbox')({
  component: ToolboxLayoutRoute,
});
