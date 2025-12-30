import { safeNumber } from '@backend/utils';

import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

const SORT_OPTIONS = ['latest', 'oldest'] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

function safeSortOption(value: unknown): SortOption {
  if (SORT_OPTIONS.includes(value as SortOption)) {
    return value as SortOption;
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
  @Transform(({ value }) => safeSortOption(value))
  sort: SortOption = 'latest';
}

export interface PaginateResult<T> {
  data: T[];
  totalPages: number;
  page: number;
  pageSize: number;
}
