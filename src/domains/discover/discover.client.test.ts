import {describe, it, expect, mock} from 'bun:test';
import {DiscoverClient} from './discover.client';
import type {HttpClient} from '../../core/http-client';
import searchHostsFixture from './__fixtures__/search-hosts-response.json';
import getApplicationsFixture from './__fixtures__/get-applications-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return {request} as unknown as HttpClient;
}

describe('DiscoverClient', () => {
  describe('queryHostIds', () => {
    it('sends a GET to the query-hosts endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['host-1'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const discover = new DiscoverClient(http);

      const result = await discover.queryHostIds({
        filter: "platform_name:'Windows'",
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/discover/queries/hosts/v1',
        query: {
          filter: "platform_name:'Windows'",
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.ids).toEqual(['host-1']);
      expect(result.pagination).toEqual({offset: 0, limit: 100, total: 1});
    });
  });

  describe('queryApplicationIds', () => {
    it('sends a GET to the query-applications endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['app-1'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const discover = new DiscoverClient(http);

      const result = await discover.queryApplicationIds({});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/discover/queries/applications/v1',
        query: {
          filter: undefined,
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.ids).toEqual(['app-1']);
    });
  });

  describe('queryAccountIds', () => {
    it('sends a GET to the query-accounts endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['account-1'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const discover = new DiscoverClient(http);

      const result = await discover.queryAccountIds({});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/discover/queries/accounts/v1',
        query: {
          filter: undefined,
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.ids).toEqual(['account-1']);
    });
  });

  describe('queryLoginIds', () => {
    it('sends a GET to the query-logins endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['login-1'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const discover = new DiscoverClient(http);

      const result = await discover.queryLoginIds({});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/discover/queries/logins/v1',
        query: {
          filter: undefined,
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.ids).toEqual(['login-1']);
    });
  });

  describe('getHosts', () => {
    it('gets hosts by id and maps them to DiscoverHostDetails', async () => {
      const http = fakeHttpClient(searchHostsFixture);
      const discover = new DiscoverClient(http);

      const [host] = await discover.getHosts(['host-1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/discover/entities/hosts/v1',
        query: {ids: ['host-1']},
      });
      expect(host.hostname).toBe('WIN-LAPTOP-01');
      expect(host.platformName).toBe('Windows');
    });
  });

  describe('getApplications', () => {
    it('gets applications by id and maps them to DiscoverApplicationDetails', async () => {
      const http = fakeHttpClient(getApplicationsFixture);
      const discover = new DiscoverClient(http);

      const [app] = await discover.getApplications(['app-1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/discover/entities/applications/v1',
        query: {ids: ['app-1']},
      });
      expect(app.name).toBe('7-Zip');
      expect(app.vendor).toBe('Igor Pavlov');
    });
  });

  describe('getAccounts', () => {
    it('gets accounts by id and maps them to DiscoverAccountDetails', async () => {
      const http = fakeHttpClient({
        resources: [
          {
            id: 'account-1',
            cid: 'cid-001',
            account_name: 'jdoe',
            account_type: 'local',
          },
        ],
        errors: [],
        meta: {},
      });
      const discover = new DiscoverClient(http);

      const [account] = await discover.getAccounts(['account-1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/discover/entities/accounts/v1',
        query: {ids: ['account-1']},
      });
      expect(account.accountName).toBe('jdoe');
      expect(account.accountType).toBe('local');
    });
  });

  describe('getLogins', () => {
    it('gets logins by id and maps them to DiscoverLoginDetails', async () => {
      const http = fakeHttpClient({
        resources: [
          {
            id: 'login-1',
            cid: 'cid-001',
            account_name: 'jdoe',
            login_type: 'interactive',
          },
        ],
        errors: [],
        meta: {},
      });
      const discover = new DiscoverClient(http);

      const [login] = await discover.getLogins(['login-1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/discover/entities/logins/v1',
        query: {ids: ['login-1']},
      });
      expect(login.accountName).toBe('jdoe');
      expect(login.loginType).toBe('interactive');
    });
  });

  describe('searchHosts', () => {
    it('sends a GET to the combined-hosts endpoint and maps a single page', async () => {
      const http = fakeHttpClient(searchHostsFixture);
      const discover = new DiscoverClient(http);

      const result = await discover.searchHosts({
        filter: "platform_name:'Windows'",
        limit: 1,
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/discover/combined/hosts/v1',
        query: {
          filter: "platform_name:'Windows'",
          after: undefined,
          limit: 1,
          sort: undefined,
          facet: undefined,
        },
      });
      expect(result.hosts[0].hostname).toBe('WIN-LAPTOP-01');
      expect(result.pagination).toEqual({
        after: 'next-cursor',
        limit: 1,
        total: 2,
      });
    });
  });

  describe('searchAllHosts', () => {
    it('pages through every host using the after cursor', async () => {
      const http = fakeHttpClient(searchHostsFixture, {
        resources: [{...searchHostsFixture.resources[0], id: 'host-2'}],
        errors: [],
        meta: {pagination: {limit: 1, total: 2}},
      });
      const discover = new DiscoverClient(http);

      const ids: string[] = [];
      for await (const host of discover.searchAllHosts({
        filter: "platform_name:'Windows'",
        limit: 1,
      })) {
        ids.push(host.id);
      }

      expect(ids).toEqual(['host-1', 'host-2']);
      expect(http.request).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        path: '/discover/combined/hosts/v1',
        query: {
          filter: "platform_name:'Windows'",
          after: undefined,
          limit: 1,
          sort: undefined,
          facet: undefined,
        },
      });
      expect(http.request).toHaveBeenNthCalledWith(2, {
        method: 'GET',
        path: '/discover/combined/hosts/v1',
        query: {
          filter: "platform_name:'Windows'",
          after: 'next-cursor',
          limit: 1,
          sort: undefined,
          facet: undefined,
        },
      });
    });
  });

  describe('searchApplications', () => {
    it('sends a GET to the combined-applications endpoint and maps a single page', async () => {
      const http = fakeHttpClient(getApplicationsFixture);
      const discover = new DiscoverClient(http);

      const result = await discover.searchApplications({
        filter: "name:'7-Zip'",
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/discover/combined/applications/v1',
        query: {
          filter: "name:'7-Zip'",
          after: undefined,
          limit: undefined,
          sort: undefined,
          facet: undefined,
        },
      });
      expect(result.applications[0].name).toBe('7-Zip');
      expect(result.pagination).toEqual({limit: 100, total: 1});
    });
  });

  describe('searchAllApplications', () => {
    it('pages through every application using the after cursor', async () => {
      const http = fakeHttpClient(
        {
          resources: [getApplicationsFixture.resources[0]],
          errors: [],
          meta: {pagination: {after: 'cursor-2', limit: 1, total: 2}},
        },
        {
          resources: [{...getApplicationsFixture.resources[0], id: 'app-2'}],
          errors: [],
          meta: {pagination: {limit: 1, total: 2}},
        },
      );
      const discover = new DiscoverClient(http);

      const ids: string[] = [];
      for await (const app of discover.searchAllApplications({
        filter: "name:'7-Zip'",
        limit: 1,
      })) {
        ids.push(app.id);
      }

      expect(ids).toEqual(['app-1', 'app-2']);
    });
  });
});
