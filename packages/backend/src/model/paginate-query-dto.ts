import { safeNumber } from '@backend/utils';

import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

const SORT_OPTIONS = ['desc', 'asc'] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

function safeSortOption(value: unknown): SortOption {
  return SORT_OPTIONS.includes(value as SortOption)
    ? (value as SortOption)
    : 'desc';
}

export class PaginateQueryDto {
  @IsOptional()
  @Transform(({ value }) => safeNumber(value, 1))
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => safeNumber(value, 10))
  pageSize: number = 10;

  @IsOptional()
  @Transform(({ value }) => safeSortOption(value))
  sort: SortOption = 'desc';
}

export interface PaginateResult<T> {
  data: T[];
  totalPages: number;
  page: number;
  pageSize: number;
}
