import { createFileRoute } from '@tanstack/react-router';

import UserInfo from '@cms/features/user-info/routes/user-info';
import { withNotFound } from '@cms/shared/routing/not-found';
import { userInfoQueryOptions } from '@cms/server/users';

export const Route = createFileRoute('/_cms/user-info')({
  loader: ({ context }) =>
    withNotFound(() =>
      context.queryClient.query({
        ...userInfoQueryOptions(),
        staleTime: 'static',
      }),
    ),
  component: UserInfo,
});
