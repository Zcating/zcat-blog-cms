import { describe, expect, it } from 'vitest';

import { PaginateResult } from './types';

describe('types', () => {
  it('PaginateResult interface is properly shaped', () => {
    const data: PaginateResult<string> = {
      data: ['a', 'b'],
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };
    expect(data.data).toHaveLength(2);
    expect(data.page).toBe(1);
  });
});
