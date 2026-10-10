import { describe, it, expect, mock } from 'bun:test';
import { chunk, chunkedAction, chunkedLookup } from './chunk';

const ids = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `id-${i}`);

describe('chunk', () => {
  it('splits into slices of at most the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns no slices for an empty list', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('rejects a non-positive size', () => {
    expect(() => chunk([1], 0)).toThrow(RangeError);
  });
});

describe('chunkedLookup', () => {
  it('calls once per chunk, in order, and concatenates results', async () => {
    const fetchChunk = mock(async (idChunk: string[]) =>
      idChunk.map((id) => id.toUpperCase()),
    );

    const result = await chunkedLookup(ids(250), fetchChunk);

    expect(fetchChunk).toHaveBeenCalledTimes(3);
    expect(fetchChunk.mock.calls.map(([c]) => c.length)).toEqual([
      100, 100, 50,
    ]);
    expect(result).toHaveLength(250);
    expect(result[0]).toBe('ID-0');
    expect(result[249]).toBe('ID-249');
  });

  it('makes no request for an empty id list', async () => {
    const fetchChunk = mock(async () => ['x']);
    expect(await chunkedLookup([], fetchChunk)).toEqual([]);
    expect(fetchChunk).not.toHaveBeenCalled();
  });

  it('honors a custom chunk size', async () => {
    const fetchChunk = mock(async (idChunk: string[]) => idChunk);
    await chunkedLookup(ids(5), fetchChunk, 2);
    expect(fetchChunk).toHaveBeenCalledTimes(3);
  });
});

describe('chunkedAction', () => {
  it('merges resources and errors from every chunk', async () => {
    const run = mock(async (idChunk: string[]) => ({
      resources: idChunk,
      errors: [{ code: 1, message: `first of ${idChunk[0]}` }],
    }));

    const result = await chunkedAction(ids(150), run);

    expect(run).toHaveBeenCalledTimes(2);
    expect(result.resources).toHaveLength(150);
    expect(result.errors.map((e) => e.message)).toEqual([
      'first of id-0',
      'first of id-100',
    ]);
  });
});
