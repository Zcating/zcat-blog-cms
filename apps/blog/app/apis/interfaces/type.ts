interface Pagination<T = any> {
  page: number;
  pageSize: number;
  totalPages: number;
  data: T[];
}
