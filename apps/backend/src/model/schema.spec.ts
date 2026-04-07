import { PaginateQuerySchema, ResultCode, createResult } from '.';

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
  });
});
