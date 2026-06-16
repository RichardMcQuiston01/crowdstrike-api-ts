import {describe, it, expect, mock} from 'bun:test';
import {IdentityProtectionClient} from './identity-protection.client';
import type {HttpClient} from '../../core/http-client';
import searchIdsFixture from './__fixtures__/search-sensor-ids-response.json';
import sensorDetailsFixture from './__fixtures__/get-sensor-details-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return {request} as unknown as HttpClient;
}

describe('IdentityProtectionClient', () => {
  describe('searchSensorIds', () => {
    it('sends a GET to the sensor query endpoint', async () => {
      const http = fakeHttpClient(searchIdsFixture);
      const identity = new IdentityProtectionClient(http);

      const result = await identity.searchSensorIds({
        filter: "status:'enforced'",
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/identity-protection/queries/devices/v1',
        query: {
          filter: "status:'enforced'",
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.ids).toEqual(['dc-0a1b2c3d4e5f6071']);
    });
  });

  describe('searchAllSensorIds', () => {
    it('pages through all results via the offset cursor', async () => {
      const http = fakeHttpClient(
        {
          resources: ['dc-1'],
          errors: [],
          meta: {pagination: {offset: 0, limit: 1, total: 2}},
        },
        {
          resources: ['dc-2'],
          errors: [],
          meta: {pagination: {offset: 1, limit: 1, total: 2}},
        },
      );
      const identity = new IdentityProtectionClient(http);

      const ids: string[] = [];
      for await (const id of identity.searchAllSensorIds({limit: 1})) {
        ids.push(id);
      }

      expect(ids).toEqual(['dc-1', 'dc-2']);
    });
  });

  describe('getSensorDetails', () => {
    it('sends a POST with ids in the body and maps results', async () => {
      const http = fakeHttpClient(sensorDetailsFixture);
      const identity = new IdentityProtectionClient(http);

      const result = await identity.getSensorDetails(['dc-0a1b2c3d4e5f6071']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/identity-protection/entities/devices/GET/v1',
        body: {ids: ['dc-0a1b2c3d4e5f6071']},
      });
      expect(result[0].hostname).toBe('dc01.corp.example.com');
      expect(result[0].idpPolicyName).toBe('Default Policy');
    });
  });

  describe('graphql', () => {
    it('sends a POST with the query in the body', async () => {
      const http = fakeHttpClient({
        data: {entities: {nodes: [{id: 'entity_1'}]}},
      });
      const identity = new IdentityProtectionClient(http);

      const result = await identity.graphql<{
        entities: {nodes: Array<{id: string}>};
      }>('query { entities { nodes { id } } }');

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/identity-protection/combined/graphql/v1',
        body: {query: 'query { entities { nodes { id } } }'},
      });
      expect(result.data?.entities.nodes[0].id).toBe('entity_1');
    });
  });
});
