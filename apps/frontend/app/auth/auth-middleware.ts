import { redirect } from 'react-router';

import { UserApi } from '../api/interfaces/user-api';

const PUBLIC_PATHS = new Set(['/', '/login']);
const API_PREFIX = '/api/';

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith(API_PREFIX);
}

export async function authMiddleware(
  { request }: { request: Request },
  next: () => Promise<unknown>,
) {
  const { pathname } = new URL(request.url);

  if (isPublicPath(pathname)) {
    return next();
  }

  const isValid = await UserApi.isValid();
  if (!isValid) {
    throw redirect('/login');
  }

  return next();
}
