export type PaginationResult<T> = {
  items: T[];
  total: number;
  page: number;
  per_page: number;
};

export function parsePagination(searchParams: URLSearchParams): { page: number; perPage: number } {
  const rawPage = searchParams.get("page");
  const rawPerPage = searchParams.get("per_page");

  const page = parseInt(rawPage ?? "1", 10);
  const parsedPerPage = parseInt(rawPerPage ?? "20", 10);

  // per_page は省略時 20、50 を超えると 20 になる
  let perPage = 20;
  if (rawPerPage !== null) {
    perPage = Number.isNaN(parsedPerPage) || parsedPerPage <= 0 ? 20 : parsedPerPage;
    if (perPage > 50) {
      perPage = 20;
    }
  }

  return {
    page: Number.isNaN(page) || page <= 0 ? 1 : page,
    perPage,
  };
}

export function paginate<T>(items: T[], page: number, perPage: number): PaginationResult<T> {
  const total = items.length;
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    total,
    page,
    per_page: perPage,
  };
}
