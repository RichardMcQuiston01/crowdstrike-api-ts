import { describe, it, expect, mock } from 'bun:test';
import { IocClient } from './ioc.client';
import type { HttpClient } from '../../core/http-client';
import searchFixture from './__fixtures__/search-combined-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return { request } as unknown as HttpClient;
}

describe('IocClient', () => {
  describe('search', () => {
    it('sends a GET to the indicator query endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['ioc_1'],
        errors: [],
        meta: { pagination: { offset: 0, limit: 100, total: 1 } },
      });
      const ioc = new IocClient(http);

      const result = await ioc.search({ filter: "type:'domain'" });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/iocs/queries/indicators/v1',
        query: {
          filter: "type:'domain'",
          offset: undefined,
          limit: undefined,
          sort: undefined,
          after: undefined,
          from_parent: undefined,
        },
      });
      expect(result.ids).toEqual(['ioc_1']);
    });
  });

  describe('searchCombined', () => {
    it('sends a GET to the combined indicator endpoint and maps results', async () => {
      const http = fakeHttpClient(searchFixture);
      const ioc = new IocClient(http);

      const result = await ioc.searchCombined({ filter: "type:'domain'" });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/iocs/combined/indicator/v1',
        query: {
          filter: "type:'domain'",
          offset: undefined,
          limit: undefined,
          sort: undefined,
          after: undefined,
          from_parent: undefined,
        },
      });
      expect(result.iocs[0].value).toBe('malicious.example.org');
      expect(result.iocs[0].appliedGlobally).toBe(true);
      expect(result.pagination).toEqual(searchFixture.meta.pagination);
    });
  });

  describe('searchAll', () => {
    it('pages through all results via the offset cursor', async () => {
      const http = fakeHttpClient(
        {
          resources: [searchFixture.resources[0]],
          errors: [],
          meta: { pagination: { offset: 0, limit: 1, total: 2 } },
        },
        {
          resources: [
            {
              ...searchFixture.resources[0],
              id: 'ioc_2',
              value: 'evil2.example.org',
            },
          ],
          errors: [],
          meta: { pagination: { offset: 1, limit: 1, total: 2 } },
        },
      );
      const ioc = new IocClient(http);

      const values: string[] = [];
      for await (const item of ioc.searchAll({ limit: 1 })) {
        values.push(item.value ?? '');
      }

      expect(values).toEqual(['malicious.example.org', 'evil2.example.org']);
    });
  });

  describe('getDetails', () => {
    it('sends a GET with ids as a query param', async () => {
      const http = fakeHttpClient(searchFixture);
      const ioc = new IocClient(http);

      const result = await ioc.getDetails(['ioc_1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/iocs/entities/indicators/v1',
        query: { ids: ['ioc_1'] },
      });
      expect(result[0].id).toBe('4f8c1e2a9b7d4d6e8f0a1b2c3d4e5f60');
    });
  });

  describe('create', () => {
    it('sends a POST with mapped indicator fields', async () => {
      const http = fakeHttpClient(searchFixture);
      const ioc = new IocClient(http);

      const result = await ioc.create({
        comment: 'adding a new IOC',
        retrodetects: true,
        indicators: [
          {
            type: 'domain',
            value: 'malicious.example.org',
            appliedGlobally: true,
            action: 'prevent',
            severity: 'high',
            tags: ['c2'],
          },
        ],
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/iocs/entities/indicators/v1',
        query: { retrodetects: true, ignore_warnings: undefined },
        body: {
          comment: 'adding a new IOC',
          indicators: [
            {
              type: 'domain',
              value: 'malicious.example.org',
              applied_globally: true,
              action: 'prevent',
              description: undefined,
              expiration: undefined,
              host_groups: undefined,
              mobile_action: undefined,
              platforms: undefined,
              severity: 'high',
              source: undefined,
              tags: ['c2'],
            },
          ],
        },
      });
      expect(result[0].value).toBe('malicious.example.org');
    });
  });

  describe('delete', () => {
    it('sends a DELETE with ids and comment as query params', async () => {
      const http = fakeHttpClient({ resources: [], errors: [], meta: {} });
      const ioc = new IocClient(http);

      await ioc.delete({ ids: ['ioc_1'], comment: 'no longer needed' });

      expect(http.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/iocs/entities/indicators/v1',
        query: {
          filter: undefined,
          ids: ['ioc_1'],
          comment: 'no longer needed',
          from_parent: undefined,
        },
      });
    });
  });
});
