import { describe, it, expect, mock } from 'bun:test';
import { CasesClient } from './cases.client';
import type { HttpClient } from '../../core/http-client';
import { CrowdStrikeApiError } from '../../core/errors';
import queryCasesFixture from './__fixtures__/query-cases-response.json';
import caseDetailsFixture from './__fixtures__/case-details-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return { request } as unknown as HttpClient;
}

describe('CasesClient', () => {
  describe('search', () => {
    it('sends a GET to the query-cases endpoint', async () => {
      const http = fakeHttpClient(queryCasesFixture);
      const cases = new CasesClient(http);

      const result = await cases.search({ filter: "status:'open'" });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/cases/queries/cases/v1',
        query: {
          filter: "status:'open'",
          q: undefined,
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.caseIds).toEqual(queryCasesFixture.resources);
      expect(result.pagination).toEqual(queryCasesFixture.meta.pagination);
    });

    it('propagates CrowdStrikeApiError from the underlying request', async () => {
      const http = {
        request: mock(async () => {
          throw new CrowdStrikeApiError({
            status: 403,
            errors: [{ code: 403, message: 'denied' }],
            requestPath: '/cases/queries/cases/v1',
          });
        }),
      } as unknown as HttpClient;
      const cases = new CasesClient(http);

      await expect(cases.search()).rejects.toBeInstanceOf(CrowdStrikeApiError);
    });
  });

  describe('searchAll', () => {
    it('pages through all results via the offset cursor', async () => {
      const http = fakeHttpClient(
        {
          resources: ['a', 'b'],
          errors: [],
          meta: { pagination: { offset: 0, limit: 2, total: 3 } },
        },
        {
          resources: ['c'],
          errors: [],
          meta: { pagination: { offset: 2, limit: 2, total: 3 } },
        },
      );
      const cases = new CasesClient(http);

      const ids: string[] = [];
      for await (const id of cases.searchAll({ limit: 2 })) {
        ids.push(id);
      }

      expect(ids).toEqual(['a', 'b', 'c']);
    });
  });

  describe('getDetails', () => {
    it('posts ids and maps raw case payloads to CaseDetails', async () => {
      const http = fakeHttpClient(caseDetailsFixture);
      const cases = new CasesClient(http);

      const [caseDetails] = await cases.getDetails(['case-1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/cases/entities/cases/v2',
        body: { ids: ['case-1'] },
      });
      expect(caseDetails.id).toBe('case-1');
      expect(caseDetails.referenceId).toBe('CS-1001');
      expect(caseDetails.severity).toBe(80);
      expect(caseDetails.raw).toEqual(caseDetailsFixture.resources[0]);
    });
  });

  describe('searchWithDetails', () => {
    it('returns an empty array without hydrating when search finds no cases', async () => {
      const http = fakeHttpClient({ resources: [], errors: [], meta: {} });
      const cases = new CasesClient(http);

      const result = await cases.searchWithDetails();

      expect(result).toEqual([]);
      expect(http.request).toHaveBeenCalledTimes(1);
    });
  });

  describe('addTags', () => {
    it('posts the case id and tags', async () => {
      const http = fakeHttpClient(caseDetailsFixture);
      const cases = new CasesClient(http);

      const result = await cases.addTags({
        id: 'case-1',
        tags: ['priority/high'],
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/cases/entities/case-tags/v1',
        body: { id: 'case-1', tags: ['priority/high'] },
      });
      expect(result.id).toBe('case-1');
    });
  });

  describe('removeTags', () => {
    it('sends a DELETE with id and tag as query params', async () => {
      const http = fakeHttpClient(caseDetailsFixture);
      const cases = new CasesClient(http);

      await cases.removeTags({ id: 'case-1', tags: ['priority/high'] });

      expect(http.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/cases/entities/case-tags/v1',
        query: { id: 'case-1', tag: ['priority/high'] },
      });
    });
  });
});
