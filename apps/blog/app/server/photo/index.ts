import { createServerFn } from '@tanstack/react-start';

import { fetchPhotoList } from './photo-helpers';
import { GetPhotoListInputSchema, type GetPhotoListInput } from './schemas';

export const getPhotoList = createServerFn({ method: 'GET' })
  .validator(
    (data: unknown): GetPhotoListInput =>
      GetPhotoListInputSchema.parse(data ?? {}),
  )
  .handler(async ({ data }) => fetchPhotoList(data));
