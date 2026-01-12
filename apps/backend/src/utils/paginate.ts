/**
 * 创建分页查询参数
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 分页查询参数
 */
export function createPaginate(page: number, pageSize: number) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}
