import { z } from 'zod';

import { safeNumber } from '@backend/utils';

const ORDER_OPTIONS = ['latest', 'oldest'] as const;

export type OrderEnum = (typeof ORDER_OPTIONS)[number];

export const PaginateQuerySchema = z.object({
  page: z
    .union([z.number(), z.string().transform((val) => safeNumber(val, 1))])
    .default(1),
  pageSize: z
    .union([z.number(), z.string().transform((val) => safeNumber(val, 10))])
    .default(10),
  order: z.enum(ORDER_OPTIONS).default('latest'),
});

export type PaginateQueryDto = z.infer<typeof PaginateQuerySchema>;

export interface PaginateResult<T> {
  data: T[];
  totalPages: number;
  page: number;
  pageSize: number;
  total: number;
}

export function createPaginateResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginateResult<T> {
  return {
    data,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    page,
    pageSize,
  };
}
