import { createZodDto } from 'nestjs-zod';
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

export class PaginateQueryDto extends createZodDto(PaginateQuerySchema) {}

export interface PaginateResult<T> {
  data: T[];
  totalPages: number;
  page: number;
  pageSize: number;
}
