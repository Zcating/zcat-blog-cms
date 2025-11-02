import { safeNumber } from '@backend/utils';

import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class PaginateQueryDto {
  @IsOptional()
  @Transform(({ value }) => safeNumber(value, 1))
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => safeNumber(value, 10))
  pageSize: number = 10;
}

export interface PaginateResult<T> {
  data: T[];
  totalPages: number;
  page: number;
  pageSize: number;
}
