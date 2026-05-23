import { describe, expect, it } from 'vitest';

import { PaginateQuerySchema } from './paginate-query.schema';

describe('PaginateQuerySchema', () => {
  it('uses defaults for empty input', () => {
    const result = PaginateQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.order).toBe('latest');
  });

  it('accepts explicit values', () => {
    const result = PaginateQuerySchema.parse({
      page: 3,
      pageSize: 20,
      order: 'oldest',
    });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(20);
    expect(result.order).toBe('oldest');
  });

  it('coerces string values to numbers', () => {
    const result = PaginateQuerySchema.parse({
      page: '2',
      pageSize: '15',
    });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(15);
  });

  it('uses default for invalid string page', () => {
    const result = PaginateQuerySchema.parse({
      page: 'invalid',
    });
    expect(result.page).toBe(1);
  });

  it('rejects invalid order value', () => {
    const result = PaginateQuerySchema.safeParse({ order: 'asc' });
    expect(result.success).toBe(false);
  });
});
