import {describe, it, expect, mock} from 'bun:test';
import {ContainerVulnerabilitiesClient} from './container-vulnerabilities.client';
import type {HttpClient} from '../../core/http-client';
import searchFixture from './__fixtures__/search-vulnerabilities-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return {request} as unknown as HttpClient;
}

describe('ContainerVulnerabilitiesClient', () => {
  describe('search', () => {
    it('sends a GET to the combined vulnerabilities endpoint and maps results', async () => {
      const http = fakeHttpClient(searchFixture);
      const vulns = new ContainerVulnerabilitiesClient(http);

      const result = await vulns.search({filter: "severity:'Critical'"});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/container-security/combined/vulnerabilities/v1',
        query: {
          filter: "severity:'Critical'",
          limit: undefined,
          offset: undefined,
          sort: undefined,
        },
      });
      expect(result.vulnerabilities[0].cveId).toBe('CVE-2026-12345');
      expect(result.vulnerabilities[0].cvssScore).toBe(9.8);
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
            {...searchFixture.resources[0], cve_id: 'CVE-2026-99999'},
          ],
          errors: [],
          meta: {pagination: {offset: 1, limit: 1, total: 2}},
        },
      );
      const vulns = new ContainerVulnerabilitiesClient(http);

      const cveIds: string[] = [];
      for await (const vuln of vulns.searchAll({limit: 1})) {
        cveIds.push(vuln.cveId);
      }

      expect(cveIds).toEqual(['CVE-2026-12345', 'CVE-2026-99999']);
    });
  });

  describe('getByCve', () => {
    it('sends a GET with cve_id as a query param', async () => {
      const http = fakeHttpClient(searchFixture);
      const vulns = new ContainerVulnerabilitiesClient(http);

      const result = await vulns.getByCve({cveId: 'CVE-2026-12345'});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/container-security/combined/vulnerabilities/info/v1',
        query: {cve_id: 'CVE-2026-12345', limit: undefined, offset: undefined},
      });
      expect(result[0].cveId).toBe('CVE-2026-12345');
    });
  });
});
