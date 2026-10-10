import type { ActionResult } from './resources';

/**
 * Number of ids sent per request for lookups that carry ids as repeated query
 * parameters on a GET/DELETE. 100 matches the documented per-call limit of the
 * Falcon entity endpoints and keeps the URL well under common proxy limits.
 */
export const ID_LOOKUP_CHUNK_SIZE = 100;

/** Splits `items` into consecutive slices of at most `size` entries. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(
      `chunk size must be a positive integer, received ${size}`,
    );
  }
  const slices: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    slices.push(items.slice(i, i + size));
  }
  return slices;
}

/**
 * Runs `fetchChunk` once per slice of `ids` (sequentially, to stay friendly to
 * rate limits) and concatenates the results in order. Makes no request for an
 * empty id list.
 */
export async function chunkedLookup<TOut>(
  ids: string[],
  fetchChunk: (idChunk: string[]) => Promise<TOut[]>,
  chunkSize: number = ID_LOOKUP_CHUNK_SIZE,
): Promise<TOut[]> {
  const results: TOut[] = [];
  for (const idChunk of chunk(ids, chunkSize)) {
    results.push(...(await fetchChunk(idChunk)));
  }
  return results;
}

/** Like chunkedLookup, for mutating calls: merges every chunk's resources and errors. */
export async function chunkedAction(
  ids: string[],
  run: (idChunk: string[]) => Promise<ActionResult>,
  chunkSize: number = ID_LOOKUP_CHUNK_SIZE,
): Promise<ActionResult> {
  const merged: ActionResult = { resources: [], errors: [] };
  for (const idChunk of chunk(ids, chunkSize)) {
    const result = await run(idChunk);
    merged.resources.push(...result.resources);
    merged.errors.push(...result.errors);
  }
  return merged;
}
