export interface PaginateResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
}
