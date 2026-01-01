import { safeNumber } from '@backend/utils';

import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

const ORDER_OPTIONS = ['latest', 'oldest'] as const;

export type OrderEnum = (typeof ORDER_OPTIONS)[number];

function safeOrderEnum(value: unknown): OrderEnum {
  if (ORDER_OPTIONS.includes(value as OrderEnum)) {
    return value as OrderEnum;
  }

  return 'latest';
}

export class PaginateQueryDto {
  @IsOptional()
  @Transform(({ value }) => safeNumber(value, 1))
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => safeNumber(value, 10))
  pageSize: number = 10;

  @IsOptional()
  @Transform(({ value }) => safeOrderEnum(value))
  order: OrderEnum = 'latest';
}

export interface PaginateResult<T> {
  data: T[];
  totalPages: number;
  page: number;
  pageSize: number;
}
