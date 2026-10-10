import { describe, it, expect, mock } from 'bun:test';
import {
  firstResource,
  requestAction,
  requestFirst,
  type ActionResult,
} from './resources';
import { CrowdStrikeApiError } from './errors';
import type { HttpClient } from './http-client';

function fakeHttp(response: unknown): HttpClient {
  return { request: mock(async () => response) } as unknown as HttpClient;
}

describe('firstResource', () => {
  it('returns the first entry', () => {
    expect(firstResource({ resources: ['a', 'b'] }, '/x')).toBe('a');
  });

  it('throws CrowdStrikeApiError carrying the response errors when resources is empty', () => {
    const errors = [{ code: 409, message: 'tag already exists' }];
    try {
      firstResource({ resources: [], errors }, '/cases/tags');
      throw new Error('expected firstResource to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(CrowdStrikeApiError);
      expect((e as CrowdStrikeApiError).errors).toEqual(errors);
      expect((e as CrowdStrikeApiError).message).toContain(
        'tag already exists',
      );
      expect((e as CrowdStrikeApiError).requestPath).toBe('/cases/tags');
    }
  });

  it('throws CrowdStrikeApiError, not TypeError, when the body is missing', () => {
    expect(() => firstResource(undefined, '/x')).toThrow(CrowdStrikeApiError);
  });
});

describe('requestFirst', () => {
  it('sends the request and unwraps the first resource', async () => {
    const http = fakeHttp({ resources: [{ id: 1 }] });
    expect(
      await requestFirst<{ id: number }>(http, { method: 'GET', path: '/x' }),
    ).toEqual({ id: 1 });
  });
});

describe('requestAction', () => {
  it('returns resources and errors from the response', async () => {
    const http = fakeHttp({
      resources: ['a'],
      errors: [{ code: 1, message: 'm' }],
    });
    const result: ActionResult = await requestAction(http, {
      method: 'POST',
      path: '/x',
    });
    expect(result).toEqual({
      resources: ['a'],
      errors: [{ code: 1, message: 'm' }],
    });
  });

  it('returns an empty result for an empty (204) response', async () => {
    const http = fakeHttp(undefined);
    expect(await requestAction(http, { method: 'DELETE', path: '/x' })).toEqual(
      { resources: [], errors: [] },
    );
  });
});
