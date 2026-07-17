export class PaginationDto {
  page?: number = 1;
  pageSize?: number = 20;
  sortBy?: string = 'created_at';
  sortOrder?: 'asc' | 'desc' = 'desc';
}
