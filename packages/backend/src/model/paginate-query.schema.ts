import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ORDER_OPTIONS = ['latest', 'oldest'] as const;

export type OrderEnum = (typeof ORDER_OPTIONS)[number];

export const PaginateQuerySchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(10),
  order: z.enum(ORDER_OPTIONS).default('latest'),
});

export class PaginateQueryDto extends createZodDto(PaginateQuerySchema) {}

export interface PaginateResult<T> {
  data: T[];
  totalPages: number;
  page: number;
  pageSize: number;
}
