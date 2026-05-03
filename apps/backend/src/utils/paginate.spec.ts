import { describe, it, expect } from 'vitest';

import { createPaginate } from './paginate';

describe('createPaginate', () => {
  it('returns skip=0 and take=pageSize for page 1', () => {
    const result = createPaginate(1, 10);

    expect(result).toEqual({ skip: 0, take: 10 });
  });

  it('calculates skip correctly for page 2', () => {
    const result = createPaginate(2, 10);

    expect(result).toEqual({ skip: 10, take: 10 });
  });

  it('handles page 3 with pageSize 20', () => {
    const result = createPaginate(3, 20);

    expect(result).toEqual({ skip: 40, take: 20 });
  });
});
