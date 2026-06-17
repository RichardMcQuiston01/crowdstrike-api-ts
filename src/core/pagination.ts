/** Fetches one page of an offset/limit based list endpoint. */
export type OffsetPageFetcher<T> = (
  offset: number,
  limit: number,
) => Promise<{
  resources: T[];
  pagination: { offset: number; limit: number; total: number };
}>;

/** Fetches one page of a cursor/after-token based list endpoint. */
export type CursorPageFetcher<T> = (
  after: string | undefined,
  limit: number,
) => Promise<{
  resources: T[];
  pagination: { after?: string; limit: number };
}>;

const DEFAULT_PAGE_SIZE = 100;

/** Async-iterates every item of an offset/limit based list endpoint, page by page. */
export async function* paginateOffset<T>(
  fetchPage: OffsetPageFetcher<T>,
  opts: { pageSize?: number; startOffset?: number } = {},
): AsyncGenerator<T> {
  const limit = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  let offset = opts.startOffset ?? 0;

  for (;;) {
    const page = await fetchPage(offset, limit);
    for (const item of page.resources) {
      yield item;
    }

    const nextOffset = offset + page.resources.length;
    if (page.resources.length === 0 || nextOffset >= page.pagination.total) {
      return;
    }
    offset = nextOffset;
  }
}

/** Async-iterates every item of a cursor/after-token based list endpoint, page by page. */
export async function* paginateCursor<T>(
  fetchPage: CursorPageFetcher<T>,
  opts: { pageSize?: number } = {},
): AsyncGenerator<T> {
  const limit = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  let after: string | undefined;

  for (;;) {
    const page = await fetchPage(after, limit);
    for (const item of page.resources) {
      yield item;
    }

    if (page.resources.length === 0 || !page.pagination.after) {
      return;
    }
    after = page.pagination.after;
  }
}

/** Drains an async iterable into an array. Use cautiously for very large result sets. */
export async function collectAll<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iter) {
    results.push(item);
  }
  return results;
}
