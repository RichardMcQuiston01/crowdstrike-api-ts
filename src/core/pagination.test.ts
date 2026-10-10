import { describe, it, expect, mock } from 'bun:test';
import {
  paginateOffset,
  paginateCursor,
  collectAll,
  type OffsetPageFetcher,
  type CursorPageFetcher,
  readOffsetPagination,
} from './pagination';
import { CrowdStrikeApiError } from './errors';

describe('paginateOffset', () => {
  it('walks every page until the running offset reaches the total', async () => {
    const pages: Record<number, string[]> = {
      0: ['a', 'b'],
      2: ['c', 'd'],
      4: ['e'],
    };
    const fetchPage: OffsetPageFetcher<string> = async (offset, limit) => ({
      resources: pages[offset] ?? [],
      pagination: { offset, limit, total: 5 },
    });

    const results = await collectAll(
      paginateOffset(fetchPage, { pageSize: 2 }),
    );
    expect(results).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('stops immediately when the first page is empty', async () => {
    const fetchPage: OffsetPageFetcher<string> = async (offset, limit) => ({
      resources: [],
      pagination: { offset, limit, total: 0 },
    });

    const results = await collectAll(paginateOffset(fetchPage));
    expect(results).toEqual([]);
  });

  it('defaults to a page size of 100 and starts at offset 0', async () => {
    const calls: Array<{ offset: number; limit: number }> = [];
    const fetchPage: OffsetPageFetcher<string> = async (offset, limit) => {
      calls.push({ offset, limit });
      return { resources: [], pagination: { offset, limit, total: 0 } };
    };

    await collectAll(paginateOffset(fetchPage));
    expect(calls).toEqual([{ offset: 0, limit: 100 }]);
  });
});

describe('paginateCursor', () => {
  it('walks every page following the after token until it is undefined', async () => {
    const pages: Record<string, { resources: string[]; after?: string }> = {
      start: { resources: ['a', 'b'], after: 'page2' },
      page2: { resources: ['c'], after: undefined },
    };
    const fetchPage: CursorPageFetcher<string> = async (after) => {
      const page = pages[after ?? 'start'];
      return {
        resources: page.resources,
        pagination: { after: page.after, limit: 2 },
      };
    };

    const results = await collectAll(
      paginateCursor(fetchPage, { pageSize: 2 }),
    );
    expect(results).toEqual(['a', 'b', 'c']);
  });

  it('stops immediately when the first page is empty', async () => {
    const fetchPage: CursorPageFetcher<string> = async (_after, limit) => ({
      resources: [],
      pagination: { after: undefined, limit },
    });

    const results = await collectAll(paginateCursor(fetchPage));
    expect(results).toEqual([]);
  });
});

describe('collectAll', () => {
  it('drains an async generator into a plain array', async () => {
    async function* gen() {
      yield 1;
      yield 2;
      yield 3;
    }
    expect(await collectAll(gen())).toEqual([1, 2, 3]);
  });
});

describe('paginateCursor repeated token', () => {
  it('stops when the after token does not advance', async () => {
    const fetchPage = mock(async () => ({
      resources: ['a', 'b'],
      pagination: { after: 'same-token', limit: 2 },
    }));

    const items = await collectAll(paginateCursor(fetchPage));

    // First page (no token yet) yields 2; second page repeats the token and stops.
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(items).toEqual(['a', 'b', 'a', 'b']);
  });
});

describe('paginateOffset non-numeric total', () => {
  it('stops instead of looping forever when total is not a finite number', async () => {
    const fetchPage = mock(async () => ({
      resources: ['a'],
      pagination: { offset: 0, limit: 1, total: Number.NaN },
    }));

    const items = await collectAll(paginateOffset(fetchPage));

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(items).toEqual(['a']);
  });
});

describe('readOffsetPagination', () => {
  it('returns a well-formed pagination block as-is', () => {
    expect(
      readOffsetPagination({
        resources: ['a'],
        meta: { pagination: { offset: 5, limit: 10, total: 40 } },
      }),
    ).toEqual({ offset: 5, limit: 10, total: 40 });
  });

  it('falls back to a single page when the block is missing or empty', () => {
    const expected = { offset: 0, limit: 0, total: 2 };
    expect(readOffsetPagination({ resources: ['a', 'b'] })).toEqual(expected);
    expect(
      readOffsetPagination({
        resources: ['a', 'b'],
        meta: { pagination: {} as never },
      }),
    ).toEqual(expected);
  });

  it('rejects a cursor-shaped block instead of casting it', () => {
    expect(() =>
      readOffsetPagination(
        { resources: ['a'], meta: { pagination: { after: 'tok', limit: 1 } } },
        '/alerts/queries/alerts/v2',
      ),
    ).toThrow(CrowdStrikeApiError);
  });

  it('rejects a non-numeric total', () => {
    expect(() =>
      readOffsetPagination({
        resources: [],
        meta: { pagination: { offset: 0, limit: 1, total: '5' as never } },
      }),
    ).toThrow(/numeric "total"/);
  });
});
