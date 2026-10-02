import {
  PaginateQuerySchema,
  ResultCode,
  createPaginateResult,
  createResult,
} from '.';

describe('model schema', () => {
  describe('PaginateQuerySchema', () => {
    it('uses default values when query is empty', () => {
      const parsed = PaginateQuerySchema.parse({});

      expect(parsed).toEqual({
        page: 1,
        pageSize: 10,
        order: 'latest',
      });
    });

    it('coerces page/pageSize string values to numbers', () => {
      const parsed = PaginateQuerySchema.parse({
        page: '2',
        pageSize: '5',
        order: 'oldest',
      });

      expect(parsed).toEqual({
        page: 2,
        pageSize: 5,
        order: 'oldest',
      });
    });
  });

  describe('createResult', () => {
    it('creates success response data', () => {
      const result = createResult({
        code: ResultCode.Success,
        message: 'ok',
        data: { id: 1 },
      });

      expect(result).toEqual({
        code: ResultCode.Success,
        message: 'ok',
        data: { id: 1 },
      });
    });

    it('throws error when code is invalid', () => {
      expect(() =>
        createResult({
          code: 'INVALID_CODE' as ResultCode,
          message: 'bad',
        }),
      ).toThrowError('Invalid code');
    });

    it('accepts ERR0007 as the resource-does-not-exist code', () => {
      const result = createResult({
        code: ResultCode.ResourceNotFound,
        message: '资源不存在',
      });

      expect(result).toEqual({
        code: 'ERR0007',
        message: '资源不存在',
        data: undefined,
      });
    });
  });

  describe('createPaginateResult', () => {
    it('reports the grand total alongside the derived total page count', () => {
      const result = createPaginateResult(['a'], 23, 2, 10);

      expect(result).toEqual({
        data: ['a'],
        total: 23,
        totalPages: 3,
        page: 2,
        pageSize: 10,
      });
    });

    it('rounds a partial last page up to a whole number of pages', () => {
      const result = createPaginateResult([], 21, 1, 10);

      expect(result.totalPages).toBe(3);
    });

    it('reports zero pages when nothing matches', () => {
      const result = createPaginateResult([], 0, 1, 10);

      expect(result).toEqual({
        data: [],
        total: 0,
        totalPages: 0,
        page: 1,
        pageSize: 10,
      });
    });

    it('reports zero pages instead of Infinity when the page size is zero', () => {
      const result = createPaginateResult([], 5, 1, 0);

      expect(result.totalPages).toBe(0);
      expect(Number.isFinite(result.totalPages)).toBe(true);
    });

    it('reports zero pages instead of a negative count when the page size is negative', () => {
      const result = createPaginateResult([], 5, 1, -5);

      expect(result.totalPages).toBe(0);
      expect(Number.isFinite(result.totalPages)).toBe(true);
    });
  });
});
