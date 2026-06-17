import { describe, it, expect, mock } from 'bun:test';
import { HostsClient } from './hosts.client';
import type { HttpClient } from '../../core/http-client';
import { CrowdStrikeApiError } from '../../core/errors';
import queryDevicesFixture from './__fixtures__/query-devices-response.json';
import deviceDetailsFixture from './__fixtures__/device-details-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return { request } as unknown as HttpClient;
}

describe('HostsClient', () => {
  describe('search', () => {
    it('sends a GET to the query-devices endpoint with filter/offset/limit', async () => {
      const http = fakeHttpClient(queryDevicesFixture);
      const hosts = new HostsClient(http);

      const result = await hosts.search({
        filter: "platform_name:'Windows'",
        limit: 50,
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/devices/queries/devices/v1',
        query: {
          filter: "platform_name:'Windows'",
          offset: undefined,
          limit: 50,
          sort: undefined,
        },
      });
      expect(result.hostIds).toEqual(queryDevicesFixture.resources);
      expect(result.pagination).toEqual(queryDevicesFixture.meta.pagination);
    });

    it('falls back to a default pagination block when meta.pagination is missing', async () => {
      const http = fakeHttpClient({
        resources: ['a', 'b'],
        errors: [],
        meta: {},
      });
      const hosts = new HostsClient(http);

      const result = await hosts.search();

      expect(result.pagination).toEqual({ offset: 0, limit: 0, total: 2 });
    });

    it('propagates CrowdStrikeApiError from the underlying request', async () => {
      const http = {
        request: mock(async () => {
          throw new CrowdStrikeApiError({
            status: 403,
            errors: [{ code: 403, message: 'denied' }],
            requestPath: '/devices/queries/devices/v1',
          });
        }),
      } as unknown as HttpClient;
      const hosts = new HostsClient(http);

      await expect(hosts.search()).rejects.toBeInstanceOf(CrowdStrikeApiError);
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
      const hosts = new HostsClient(http);

      const ids: string[] = [];
      for await (const id of hosts.searchAll({ limit: 2 })) {
        ids.push(id);
      }

      expect(ids).toEqual(['a', 'b', 'c']);
    });
  });

  describe('getDetails', () => {
    it('posts ids and maps raw device payloads to HostDetails', async () => {
      const http = fakeHttpClient(deviceDetailsFixture);
      const hosts = new HostsClient(http);

      const [host] = await hosts.getDetails(['abc123']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/devices/entities/devices/v2',
        body: { ids: ['abc123'] },
      });
      expect(host.deviceId).toBe(deviceDetailsFixture.resources[0].device_id);
      expect(host.hostname).toBe(deviceDetailsFixture.resources[0].hostname);
      expect(host.tags).toEqual(deviceDetailsFixture.resources[0].tags);
      expect(host.raw).toEqual(deviceDetailsFixture.resources[0]);
    });
  });

  describe('searchWithDetails', () => {
    it('returns an empty array without hydrating when search finds no hosts', async () => {
      const http = fakeHttpClient({ resources: [], errors: [], meta: {} });
      const hosts = new HostsClient(http);

      const result = await hosts.searchWithDetails();

      expect(result).toEqual([]);
      expect(http.request).toHaveBeenCalledTimes(1);
    });

    it('searches then hydrates the resulting ids', async () => {
      const http = fakeHttpClient(queryDevicesFixture, deviceDetailsFixture);
      const hosts = new HostsClient(http);

      const result = await hosts.searchWithDetails();

      expect(result).toHaveLength(1);
      expect(http.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('performAction', () => {
    it('posts the action name as a query param with ids in the body', async () => {
      const http = fakeHttpClient(undefined);
      const hosts = new HostsClient(http);

      await hosts.performAction({ ids: ['abc123'], action: 'contain' });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/devices/entities/devices-actions/v2',
        query: { action_name: 'contain' },
        body: { ids: ['abc123'] },
      });
    });
  });

  describe('updateTags', () => {
    it('sends a PATCH with the add/remove action and device_ids', async () => {
      const http = fakeHttpClient(undefined);
      const hosts = new HostsClient(http);

      await hosts.updateTags({
        ids: ['abc123'],
        tags: ['team/finance'],
        action: 'add',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/devices/entities/devices/tags/v1',
        body: { action: 'add', device_ids: ['abc123'], tags: ['team/finance'] },
      });
    });
  });
});
