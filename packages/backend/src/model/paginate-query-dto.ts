import { Injectable } from '@nestjs/common';

import { isNumber } from '@backend/utils';

import { IsNumber, IsOptional } from 'class-validator';

export class PaginateQueryDto {
  @IsNumber()
  @IsOptional()
  page = 1;

  @IsNumber()
  @IsOptional()
  pageSize = 10;
}

@Injectable()
export class PaginateValidationPipe {
  transform(value: PaginateQueryDto) {
    value.page = isNumber(value.page) ? value.page : 1;
    value.pageSize = isNumber(value.pageSize) ? value.pageSize : 10;
    return value;
  }
}
