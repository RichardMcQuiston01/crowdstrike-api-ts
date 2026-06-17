import { describe, it, expect, mock } from 'bun:test';
import { SensorDownloadClient } from './sensor-download.client';
import type { HttpClient } from '../../core/http-client';
import searchFixture from './__fixtures__/search-installers-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return { request } as unknown as HttpClient;
}

describe('SensorDownloadClient', () => {
  describe('searchIds', () => {
    it('sends a GET to the installer query endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['sha256_1'],
        errors: [],
        meta: { pagination: { offset: 0, limit: 100, total: 1 } },
      });
      const sensors = new SensorDownloadClient(http);

      const result = await sensors.searchIds({ filter: "platform:'windows'" });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/sensors/queries/installers/v3',
        query: {
          filter: "platform:'windows'",
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.ids).toEqual(['sha256_1']);
    });
  });

  describe('search', () => {
    it('sends a GET to the combined installers endpoint and maps results', async () => {
      const http = fakeHttpClient(searchFixture);
      const sensors = new SensorDownloadClient(http);

      const result = await sensors.search({ filter: "platform:'windows'" });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/sensors/combined/installers/v3',
        query: {
          filter: "platform:'windows'",
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.installers[0].name).toBe('WindowsSensor.exe');
      expect(result.installers[0].osVersion).toBe('10/11');
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
              sha256: 'sha256_2',
              name: 'MacSensor.pkg',
            },
          ],
          errors: [],
          meta: { pagination: { offset: 1, limit: 1, total: 2 } },
        },
      );
      const sensors = new SensorDownloadClient(http);

      const names: string[] = [];
      for await (const installer of sensors.searchAll({ limit: 1 })) {
        names.push(installer.name);
      }

      expect(names).toEqual(['WindowsSensor.exe', 'MacSensor.pkg']);
    });
  });

  describe('getDetails', () => {
    it('sends a GET with ids as a query param', async () => {
      const http = fakeHttpClient(searchFixture);
      const sensors = new SensorDownloadClient(http);

      const result = await sensors.getDetails(['sha256_1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/sensors/entities/installers/v3',
        query: { ids: ['sha256_1'] },
      });
      expect(result[0].sha256).toBe(
        '9f1a2b3c4d5e6f708192a3b4c5d6e7f809192a3b4c5d6e7f8091a2b3c4d5e6f',
      );
    });
  });

  describe('getCcid', () => {
    it('sends a GET to the ccid endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['ABCDEF1234567890-12'],
        errors: [],
        meta: {},
      });
      const sensors = new SensorDownloadClient(http);

      const result = await sensors.getCcid();

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/sensors/queries/installers/ccid/v1',
      });
      expect(result).toEqual(['ABCDEF1234567890-12']);
    });
  });

  describe('download', () => {
    it('sends a GET with the sha256 as a query param and a blob response type', async () => {
      const blob = new Blob(['installer-bytes']);
      const http = fakeHttpClient(blob);
      const sensors = new SensorDownloadClient(http);

      const result = await sensors.download('sha256_1');

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/sensors/entities/download-installer/v3',
        query: { id: 'sha256_1' },
        responseType: 'blob',
      });
      expect(result).toBe(blob);
    });
  });
});
