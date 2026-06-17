import { describe, it, expect } from 'bun:test';
import {
  paginateOffset,
  paginateCursor,
  collectAll,
  type OffsetPageFetcher,
  type CursorPageFetcher,
} from './pagination';

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
