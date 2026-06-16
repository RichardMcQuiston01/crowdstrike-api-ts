import {describe, it, expect, mock} from 'bun:test';
import {IntelClient} from './intel.client';
import type {HttpClient} from '../../core/http-client';
import searchFixture from './__fixtures__/search-indicators-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return {request} as unknown as HttpClient;
}

describe('IntelClient', () => {
  describe('searchIds', () => {
    it('sends a GET to the indicator query endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['indicator_1'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const intel = new IntelClient(http);

      const result = await intel.searchIds({filter: "type:'domain'"});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/intel/queries/indicators/v1',
        query: {
          offset: undefined,
          limit: undefined,
          sort: undefined,
          filter: "type:'domain'",
          q: undefined,
          include_deleted: undefined,
          include_relations: undefined,
        },
      });
      expect(result.ids).toEqual(['indicator_1']);
    });
  });

  describe('search', () => {
    it('sends a GET to the combined indicators endpoint and maps results', async () => {
      const http = fakeHttpClient(searchFixture);
      const intel = new IntelClient(http);

      const result = await intel.search({filter: "type:'domain'"});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/intel/combined/indicators/v1',
        query: {
          offset: undefined,
          limit: undefined,
          sort: undefined,
          filter: "type:'domain'",
          q: undefined,
          include_deleted: undefined,
          include_relations: undefined,
        },
      });
      expect(result.indicators[0].indicatorValue).toBe('evil.example.com');
      expect(result.indicators[0].maliciousConfidence).toBe('high');
      expect(result.pagination).toEqual(searchFixture.meta.pagination);
    });
  });

  describe('searchAll', () => {
    it('pages through all results via the offset cursor', async () => {
      const http = fakeHttpClient(
        {
          resources: [searchFixture.resources[0]],
          errors: [],
          meta: {pagination: {offset: 0, limit: 1, total: 2}},
        },
        {
          resources: [
            {
              ...searchFixture.resources[0],
              id: 'indicator_2',
              indicator: 'evil2.example.com',
            },
          ],
          errors: [],
          meta: {pagination: {offset: 1, limit: 1, total: 2}},
        },
      );
      const intel = new IntelClient(http);

      const values: string[] = [];
      for await (const indicator of intel.searchAll({limit: 1})) {
        values.push(indicator.indicatorValue ?? '');
      }

      expect(values).toEqual(['evil.example.com', 'evil2.example.com']);
    });
  });

  describe('getDetails', () => {
    it('sends a POST with ids in the body', async () => {
      const http = fakeHttpClient(searchFixture);
      const intel = new IntelClient(http);

      const result = await intel.getDetails(['indicator_1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/intel/entities/indicators/GET/v1',
        body: {ids: ['indicator_1']},
      });
      expect(result[0].id).toBe(
        'indicator_15000_8d3f1e2c9b7a4d6e8f0a1b2c3d4e5f60',
      );
    });
  });
});
