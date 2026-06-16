import {describe, it, expect, mock} from 'bun:test';
import {PreventionPoliciesClient} from './prevention-policies.client';
import type {HttpClient} from '../../core/http-client';
import searchFixture from './__fixtures__/search-policies-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return {request} as unknown as HttpClient;
}

describe('PreventionPoliciesClient', () => {
  describe('searchIds', () => {
    it('sends a GET to the query-prevention endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['policy1'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const policies = new PreventionPoliciesClient(http);

      const result = await policies.searchIds({
        filter: "platform_name:'Windows'",
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/policy/queries/prevention/v1',
        query: {
          filter: "platform_name:'Windows'",
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.ids).toEqual(['policy1']);
    });
  });

  describe('search', () => {
    it('sends a GET to the combined-prevention endpoint and maps results', async () => {
      const http = fakeHttpClient(searchFixture);
      const policies = new PreventionPoliciesClient(http);

      const result = await policies.search({filter: "platform_name:'Windows'"});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/policy/combined/prevention/v1',
        query: {
          filter: "platform_name:'Windows'",
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.policies[0].name).toBe('Default Windows Policy');
      expect(result.policies[0].platformName).toBe('Windows');
      expect(result.policies[0].groups).toEqual([
        {id: 'group1', name: 'Finance Laptops'},
      ]);
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
            {...searchFixture.resources[0], id: 'policy2', name: 'Mac Policy'},
          ],
          errors: [],
          meta: {pagination: {offset: 1, limit: 1, total: 2}},
        },
      );
      const policies = new PreventionPoliciesClient(http);

      const names: string[] = [];
      for await (const policy of policies.searchAll({limit: 1})) {
        names.push(policy.name);
      }

      expect(names).toEqual(['Default Windows Policy', 'Mac Policy']);
    });
  });

  describe('getDetails', () => {
    it('sends a GET with ids as a query param', async () => {
      const http = fakeHttpClient(searchFixture);
      const policies = new PreventionPoliciesClient(http);

      const [policy] = await policies.getDetails(['policy1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/policy/entities/prevention/v1',
        query: {ids: ['policy1']},
      });
      expect(policy.id).toBe('policy1');
    });
  });

  describe('create', () => {
    it('posts a single-resource create request', async () => {
      const http = fakeHttpClient(searchFixture);
      const policies = new PreventionPoliciesClient(http);

      const result = await policies.create({
        name: 'Default Windows Policy',
        platformName: 'Windows',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/policy/entities/prevention/v1',
        body: {
          resources: [
            {
              name: 'Default Windows Policy',
              platform_name: 'Windows',
              description: undefined,
              clone_id: undefined,
              settings: undefined,
            },
          ],
        },
      });
      expect(result.id).toBe('policy1');
    });
  });

  describe('update', () => {
    it('patches a single-resource update request', async () => {
      const http = fakeHttpClient(searchFixture);
      const policies = new PreventionPoliciesClient(http);

      await policies.update({
        id: 'policy1',
        settings: [{id: 'ProcessProtection', value: {enabled: false}}],
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/policy/entities/prevention/v1',
        body: {
          resources: [
            {
              id: 'policy1',
              name: undefined,
              description: undefined,
              settings: [{id: 'ProcessProtection', value: {enabled: false}}],
            },
          ],
        },
      });
    });
  });

  describe('delete', () => {
    it('sends a DELETE with ids as a query param', async () => {
      const http = fakeHttpClient(undefined);
      const policies = new PreventionPoliciesClient(http);

      await policies.delete(['policy1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/policy/entities/prevention/v1',
        query: {ids: ['policy1']},
      });
    });
  });

  describe('performAction', () => {
    it('posts action_name with a group_id action_parameter for add-host-group', async () => {
      const http = fakeHttpClient(undefined);
      const policies = new PreventionPoliciesClient(http);

      await policies.performAction({
        ids: ['policy1'],
        action: 'add-host-group',
        groupId: 'group1',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/policy/entities/prevention-actions/v1',
        query: {action_name: 'add-host-group'},
        body: {
          ids: ['policy1'],
          action_parameters: [{name: 'group_id', value: 'group1'}],
        },
      });
    });

    it('omits action_parameters for enable/disable', async () => {
      const http = fakeHttpClient(undefined);
      const policies = new PreventionPoliciesClient(http);

      await policies.performAction({ids: ['policy1'], action: 'enable'});

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/policy/entities/prevention-actions/v1',
        query: {action_name: 'enable'},
        body: {ids: ['policy1'], action_parameters: undefined},
      });
    });
  });

  describe('setPrecedence', () => {
    it('posts the ordered ids and platform name', async () => {
      const http = fakeHttpClient(undefined);
      const policies = new PreventionPoliciesClient(http);

      await policies.setPrecedence({
        ids: ['policy1', 'policy2'],
        platformName: 'Windows',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/policy/entities/prevention-precedence/v1',
        body: {ids: ['policy1', 'policy2'], platform_name: 'Windows'},
      });
    });
  });

  describe('queryMembers', () => {
    it('sends a GET with the policy id and returns member host ids', async () => {
      const http = fakeHttpClient({
        resources: ['abc123'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const policies = new PreventionPoliciesClient(http);

      const result = await policies.queryMembers({policyId: 'policy1'});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/policy/queries/prevention-members/v1',
        query: {
          id: 'policy1',
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
      const http = fakeHttpClient({
        resources: [
          {
            device_id: 'abc123',
            cid: 'cid-001',
            hostname: 'WIN-LAPTOP-01',
            platform_name: 'Windows',
            status: 'normal',
          },
        ],
        errors: [],
        meta: {},
      });
      const policies = new PreventionPoliciesClient(http);

      const [host] = await policies.getCombinedMembers({policyId: 'policy1'});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/policy/combined/prevention-members/v1',
        query: {
          id: 'policy1',
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
});
