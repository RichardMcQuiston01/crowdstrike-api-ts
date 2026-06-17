import { describe, it, expect, mock } from 'bun:test';
import { CloudSecurityClient } from './cloud-security.client';
import type { HttpClient } from '../../core/http-client';
import searchIdsFixture from './__fixtures__/search-ids-response.json';
import getResourcesFixture from './__fixtures__/get-resources-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return { request } as unknown as HttpClient;
}

describe('CloudSecurityClient', () => {
  describe('searchIds', () => {
    it('sends a GET to the resource query endpoint', async () => {
      const http = fakeHttpClient(searchIdsFixture);
      const cloud = new CloudSecurityClient(http);

      const result = await cloud.searchIds({ filter: "cloud_provider:'aws'" });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/cloud-security-assets/queries/resources/v1',
        query: {
          filter: "cloud_provider:'aws'",
          sort: undefined,
          offset: undefined,
          limit: undefined,
        },
      });
      expect(result.ids).toEqual(['res_9f1a2b3c4d5e6f708192a3b4c5d6e7f8']);
      expect(result.pagination).toEqual(searchIdsFixture.meta.pagination);
    });
  });

  describe('searchAllIds', () => {
    it('pages through all results via the offset cursor', async () => {
      const http = fakeHttpClient(
        {
          resources: ['res_1'],
          errors: [],
          meta: { pagination: { offset: 0, limit: 1, total: 2 } },
        },
        {
          resources: ['res_2'],
          errors: [],
          meta: { pagination: { offset: 1, limit: 1, total: 2 } },
        },
      );
      const cloud = new CloudSecurityClient(http);

      const ids: string[] = [];
      for await (const id of cloud.searchAllIds({ limit: 1 })) {
        ids.push(id);
      }

      expect(ids).toEqual(['res_1', 'res_2']);
    });
  });

  describe('getDetails', () => {
    it('sends a GET with ids as a query param and maps results', async () => {
      const http = fakeHttpClient(getResourcesFixture);
      const cloud = new CloudSecurityClient(http);

      const result = await cloud.getDetails([
        'res_9f1a2b3c4d5e6f708192a3b4c5d6e7f8',
      ]);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/cloud-security-assets/entities/resources/v1',
        query: { ids: ['res_9f1a2b3c4d5e6f708192a3b4c5d6e7f8'] },
      });
      expect(result[0].resourceName).toBe('web-server-01');
      expect(result[0].cloudProvider).toBe('aws');
    });
  });

  describe('getApplicationFindings', () => {
    it('sends a GET to the application findings endpoint and maps results', async () => {
      const http = fakeHttpClient({
        resources: [
          {
            crn: 'crn:aws:ec2:us-east-1:111122223333:instance/i-0a1b2c3d4e5f60718',
            finding_type: 'vulnerable-package',
            findings: [{ id: 'finding_1' }],
          },
        ],
        errors: [],
        meta: { pagination: { offset: 0, limit: 100, total: 1 } },
      });
      const cloud = new CloudSecurityClient(http);

      const result = await cloud.getApplicationFindings({
        crn: 'crn:aws:ec2:us-east-1:111122223333:instance/i-0a1b2c3d4e5f60718',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/cloud-security-assets/combined/application-findings/v1',
        query: {
          type: undefined,
          crn: 'crn:aws:ec2:us-east-1:111122223333:instance/i-0a1b2c3d4e5f60718',
          gcrn: undefined,
          filter: undefined,
          offset: undefined,
          limit: undefined,
        },
      });
      expect(result.findings[0].findingType).toBe('vulnerable-package');
    });
  });
});
