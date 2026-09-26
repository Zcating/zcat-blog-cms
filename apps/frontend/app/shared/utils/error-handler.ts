import { redirect } from '@tanstack/react-router';

export function errorHandler(e: unknown) {
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') {
      return redirect({ to: '/login' });
    }
  }

  throw e;
}
