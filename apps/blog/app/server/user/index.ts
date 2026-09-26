import { createServerFn } from '@tanstack/react-start';

import { fetchUserInfo } from './user-helpers';

export const getUserInfo = createServerFn({ method: 'GET' }).handler(async () =>
  fetchUserInfo(),
);
