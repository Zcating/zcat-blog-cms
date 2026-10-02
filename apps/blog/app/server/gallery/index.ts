import { createServerFn } from '@tanstack/react-start';

import { fetchGalleryDetail, fetchGalleryList } from './gallery-helpers';
import {
  GetGalleryDetailInputSchema,
  GetGalleryListInputSchema,
  type GetGalleryDetailInput,
  type GetGalleryListInput,
} from './schemas';

export const getGalleryList = createServerFn({ method: 'GET' })
  .validator(
    (data: unknown): GetGalleryListInput =>
      GetGalleryListInputSchema.parse(data ?? {}),
  )
  .handler(async ({ data }) => fetchGalleryList(data));

export const getGalleryDetail = createServerFn({ method: 'GET' })
  .validator(
    (data: unknown): GetGalleryDetailInput =>
      GetGalleryDetailInputSchema.parse(data),
  )
  .handler(async ({ data }) => fetchGalleryDetail(data));
