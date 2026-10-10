import { CrowdStrikeApiError } from './errors';
import type { CrowdStrikeEnvelope, OffsetPaginationMeta } from './types';

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
    // A non-finite total would make `nextOffset >= total` false forever.
    if (
      page.resources.length === 0 ||
      !Number.isFinite(page.pagination.total) ||
      nextOffset >= page.pagination.total
    ) {
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

    // Stop on a missing token, and on one that did not advance (a repeated
    // token with a non-empty page would otherwise loop forever).
    if (
      page.resources.length === 0 ||
      !page.pagination.after ||
      page.pagination.after === after
    ) {
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

/**
 * Reads the `{offset, limit, total}` block of an offset-paginated response.
 * A response with no pagination block (or an empty one) falls back to a single
 * page spanning `resources`. A block that is present but has no numeric
 * `total` (e.g. a cursor-shaped `{after, limit}` object) is rejected rather
 * than cast, since it would otherwise break offset pagination silently.
 */
export function readOffsetPagination(
  raw: CrowdStrikeEnvelope<unknown>,
  requestPath = 'the request',
): OffsetPaginationMeta {
  const resourceCount = raw.resources?.length ?? 0;
  const pagination: unknown = raw.meta?.pagination;
  if (
    pagination === undefined ||
    pagination === null ||
    (typeof pagination === 'object' && Object.keys(pagination).length === 0)
  ) {
    return { offset: 0, limit: 0, total: resourceCount };
  }

  const candidate = pagination as Partial<
    Record<keyof OffsetPaginationMeta, unknown>
  >;
  if (
    typeof candidate.total !== 'number' ||
    !Number.isFinite(candidate.total)
  ) {
    throw new CrowdStrikeApiError({
      status: 200,
      errors: [],
      requestPath,
      message:
        `Expected offset pagination with a numeric "total" in the response to ${requestPath}, ` +
        `but meta.pagination was ${JSON.stringify(pagination)}.`,
    });
  }
  return {
    offset: typeof candidate.offset === 'number' ? candidate.offset : 0,
    limit: typeof candidate.limit === 'number' ? candidate.limit : 0,
    total: candidate.total,
  };
}
