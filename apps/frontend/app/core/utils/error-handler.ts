import { redirect } from 'react-router';

export function errorHandler(e: unknown) {
  if (e instanceof Error) {
    if (e.message === 'Unauthorized') {
      return redirect('/login');
    }
  }

  throw e;
}
