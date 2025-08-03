/**
 * 分页参数接口
 */
export interface PaginationParams {
  /** 页码，从1开始 */
  page?: number;
  /** 每页数量 */
  limit?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 分页结果接口
 */
export interface PaginationResult<T> {
  /** 数据列表 */
  data: T[];
  /** 分页信息 */
  pagination: {
    /** 当前页码 */
    page: number;
    /** 每页数量 */
    limit: number;
    /** 总数量 */
    total: number;
    /** 总页数 */
    totalPages: number;
    /** 是否有上一页 */
    hasPrevious: boolean;
    /** 是否有下一页 */
    hasNext: boolean;
  };
}

/**
 * 分页配置选项
 */
export interface PaginationOptions {
  /** 默认页码 */
  defaultPage?: number;
  /** 默认每页数量 */
  defaultLimit?: number;
  /** 最大每页数量 */
  maxLimit?: number;
  /** 最小每页数量 */
  minLimit?: number;
}

/**
 * 创建分页参数
 * @param params 原始分页参数
 * @param options 分页配置选项
 * @returns 处理后的分页参数
 */
export function createPaginationParams(
  params: PaginationParams = {},
  options: PaginationOptions = {},
): Required<Pick<PaginationParams, 'page' | 'limit'>> &
  Pick<PaginationParams, 'sortBy' | 'sortOrder'> {
  const {
    defaultPage = 1,
    defaultLimit = 10,
    maxLimit = 100,
    minLimit = 1,
  } = options;

  const page = Math.max(1, params.page || defaultPage);
  const limit = Math.min(
    maxLimit,
    Math.max(minLimit, params.limit || defaultLimit),
  );

  return {
    page,
    limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder || 'DESC',
  };
}

/**
 * 创建分页结果
 * @param data 数据列表
 * @param total 总数量
 * @param page 当前页码
 * @param limit 每页数量
 * @returns 分页结果
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPrevious,
      hasNext,
    },
  };
}

/**
 * 计算跳过的数量（用于数据库查询的 offset）
 * @param page 页码
 * @param limit 每页数量
 * @returns 跳过的数量
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * 分页工具类
 */
export class Paginator {
  private options: Required<PaginationOptions>;

  constructor(options: PaginationOptions = {}) {
    this.options = {
      defaultPage: 1,
      defaultLimit: 10,
      maxLimit: 100,
      minLimit: 1,
      ...options,
    };
  }

  /**
   * 处理分页参数
   */
  processParams(params: PaginationParams) {
    return createPaginationParams(params, this.options);
  }

  /**
   * 创建分页结果
   */
  createResult<T>(data: T[], total: number, page: number, limit: number) {
    return createPaginationResult(data, total, page, limit);
  }

  /**
   * 计算偏移量
   */
  calculateOffset(page: number, limit: number) {
    return calculateOffset(page, limit);
  }

  /**
   * 完整的分页处理流程
   * @param params 分页参数
   * @param dataFetcher 数据获取函数，接收 (offset, limit, sortBy, sortOrder) 参数，返回 { data, total }
   * @returns 分页结果
   */
  async paginate<T>(
    params: PaginationParams,
    dataFetcher: (
      offset: number,
      limit: number,
      sortBy?: string,
      sortOrder?: 'ASC' | 'DESC',
    ) => Promise<{ data: T[]; total: number }>,
  ): Promise<PaginationResult<T>> {
    const processedParams = this.processParams(params);
    const { page, limit, sortBy, sortOrder } = processedParams;
    const offset = this.calculateOffset(page, limit);

    const { data, total } = await dataFetcher(offset, limit, sortBy, sortOrder);

    return this.createResult(data, total, page, limit);
  }
}

/**
 * 默认分页器实例
 */
export const defaultPaginator = new Paginator();

/**
 * 快速分页函数
 * @param params 分页参数
 * @param dataFetcher 数据获取函数
 * @returns 分页结果
 */
export function paginate<T>(
  params: PaginationParams,
  dataFetcher: (
    offset: number,
    limit: number,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ) => Promise<{ data: T[]; total: number }>,
): Promise<PaginationResult<T>> {
  return defaultPaginator.paginate(params, dataFetcher);
}
