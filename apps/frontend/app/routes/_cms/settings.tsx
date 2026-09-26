import { createFileRoute } from '@tanstack/react-router';

import Settings from '@cms/features/settings/routes/settings';

export const Route = createFileRoute('/_cms/settings')({
  component: Settings,
});
