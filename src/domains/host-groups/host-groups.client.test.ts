import { describe, it, expect, mock } from 'bun:test';
import { HostGroupsClient } from './host-groups.client';
import type { HttpClient } from '../../core/http-client';
import queryGroupsFixture from './__fixtures__/query-host-groups-response.json';
import groupDetailsFixture from './__fixtures__/host-group-details-response.json';
import combinedMembersFixture from './__fixtures__/combined-group-members-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return { request } as unknown as HttpClient;
}

describe('HostGroupsClient', () => {
  describe('search', () => {
    it('sends a GET to the query-host-groups endpoint', async () => {
      const http = fakeHttpClient(queryGroupsFixture);
      const groups = new HostGroupsClient(http);

      const result = await groups.search({ filter: "name:'Finance*'" });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/devices/queries/host-groups/v1',
        query: {
          filter: "name:'Finance*'",
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.groupIds).toEqual(queryGroupsFixture.resources);
      expect(result.pagination).toEqual(queryGroupsFixture.meta.pagination);
    });
  });

  describe('getDetails', () => {
    it('gets group details by id and maps to HostGroupDetails', async () => {
      const http = fakeHttpClient(groupDetailsFixture);
      const groups = new HostGroupsClient(http);

      const [group] = await groups.getDetails(['group1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/devices/entities/host-groups/v1',
        query: { ids: ['group1'] },
      });
      expect(group.id).toBe('group1');
      expect(group.name).toBe('Finance Laptops');
      expect(group.groupType).toBe('static');
    });
  });

  describe('create', () => {
    it('posts a single-resource create request', async () => {
      const http = fakeHttpClient(groupDetailsFixture);
      const groups = new HostGroupsClient(http);

      const result = await groups.create({
        name: 'Finance Laptops',
        groupType: 'static',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/devices/entities/host-groups/v1',
        body: {
          resources: [
            {
              name: 'Finance Laptops',
              group_type: 'static',
              description: undefined,
              assignment_rule: undefined,
            },
          ],
        },
      });
      expect(result.id).toBe('group1');
    });
  });

  describe('update', () => {
    it('patches a single-resource update request', async () => {
      const http = fakeHttpClient(groupDetailsFixture);
      const groups = new HostGroupsClient(http);

      await groups.update({ id: 'group1', description: 'Updated description' });

      expect(http.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/devices/entities/host-groups/v1',
        body: {
          resources: [
            {
              id: 'group1',
              name: undefined,
              description: 'Updated description',
              assignment_rule: undefined,
            },
          ],
        },
      });
    });
  });

  describe('delete', () => {
    it('sends a DELETE with ids as a query param', async () => {
      const http = fakeHttpClient(undefined);
      const groups = new HostGroupsClient(http);

      await groups.delete(['group1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/devices/entities/host-groups/v1',
        query: { ids: ['group1'] },
      });
    });
  });

  describe('queryMembers', () => {
    it('sends a GET with the group id and returns member host ids', async () => {
      const http = fakeHttpClient({
        resources: ['abc123'],
        errors: [],
        meta: { pagination: { offset: 0, limit: 100, total: 1 } },
      });
      const groups = new HostGroupsClient(http);

      const result = await groups.queryMembers({ groupId: 'group1' });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/devices/queries/host-group-members/v1',
        query: {
          id: 'group1',
          filter: undefined,
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.hostIds).toEqual(['abc123']);
    });
  });

  describe('getCombinedMembers', () => {
    it('hydrates member hosts via the combined endpoint', async () => {
      const http = fakeHttpClient(combinedMembersFixture);
      const groups = new HostGroupsClient(http);

      const [host] = await groups.getCombinedMembers({ groupId: 'group1' });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/devices/combined/host-group-members/v1',
        query: {
          id: 'group1',
          filter: undefined,
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(host.deviceId).toBe('abc123');
      expect(host.hostname).toBe('WIN-LAPTOP-01');
    });
  });

  describe('performAction', () => {
    it('posts action_name and a filter-based action_parameter', async () => {
      const http = fakeHttpClient(undefined);
      const groups = new HostGroupsClient(http);

      await groups.performAction({
        groupIds: ['group1'],
        action: 'add-hosts',
        filter: "device_id:'abc123'",
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/devices/entities/host-group-actions/v1',
        query: { action_name: 'add-hosts', disable_hostname_check: undefined },
        body: {
          ids: ['group1'],
          action_parameters: [{ name: 'filter', value: "device_id:'abc123'" }],
        },
      });
    });
  });
});
