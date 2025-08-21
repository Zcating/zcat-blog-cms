interface Pagination<T = any> {
  page: number;
  pageSize: number;
  total: number;
  data: T[];
}
