import { notFound } from '@tanstack/react-router';

import { isNotFoundError } from '@cms/server/errors';

export async function withNotFound<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (isNotFoundError(error)) {
      throw notFound();
    }
    throw error;
  }
}
