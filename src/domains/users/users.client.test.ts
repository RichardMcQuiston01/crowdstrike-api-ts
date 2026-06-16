import {describe, it, expect, mock} from 'bun:test';
import {UsersClient} from './users.client';
import type {HttpClient} from '../../core/http-client';
import usersFixture from './__fixtures__/get-users-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return {request} as unknown as HttpClient;
}

describe('UsersClient', () => {
  describe('searchIds', () => {
    it('sends a GET to the query-users endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['user-uuid-1'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const users = new UsersClient(http);

      const result = await users.searchIds({filter: "status:'active'"});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/user-management/queries/users/v1',
        query: {
          filter: "status:'active'",
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.ids).toEqual(['user-uuid-1']);
    });
  });

  describe('getDetails', () => {
    it('posts ids and maps results', async () => {
      const http = fakeHttpClient(usersFixture);
      const users = new UsersClient(http);

      const result = await users.getDetails(['user-uuid-1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/user-management/entities/users/GET/v1',
        body: {ids: ['user-uuid-1']},
      });
      expect(result[0].uid).toBe('jdoe@example.com');
      expect(result[0].firstName).toBe('Jane');
    });
  });

  describe('create', () => {
    it('posts the new user fields with validate_only as a query param', async () => {
      const http = fakeHttpClient(usersFixture);
      const users = new UsersClient(http);

      const result = await users.create({
        uid: 'jdoe@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        cid: 'cid-001',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/user-management/entities/users/v1',
        query: {validate_only: undefined},
        body: {
          cid: 'cid-001',
          first_name: 'Jane',
          last_name: 'Doe',
          password: undefined,
          uid: 'jdoe@example.com',
        },
      });
      expect(result.uuid).toBe('user-uuid-1');
    });
  });

  describe('update', () => {
    it('patches the user fields with user_uuid as a query param', async () => {
      const http = fakeHttpClient(usersFixture);
      const users = new UsersClient(http);

      await users.update({userUuid: 'user-uuid-1', lastName: 'Smith'});

      expect(http.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/user-management/entities/users/v1',
        query: {user_uuid: 'user-uuid-1'},
        body: {first_name: undefined, last_name: 'Smith'},
      });
    });
  });

  describe('delete', () => {
    it('sends a DELETE with user_uuid as a query param', async () => {
      const http = fakeHttpClient(undefined);
      const users = new UsersClient(http);

      await users.delete('user-uuid-1');

      expect(http.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/user-management/entities/users/v1',
        query: {user_uuid: 'user-uuid-1'},
      });
    });
  });

  describe('getRoles', () => {
    it('posts ids and maps role results', async () => {
      const http = fakeHttpClient({
        resources: [
          {
            id: 'role1',
            description: 'Falcon Administrator',
            display_name: 'Falcon Administrator',
            is_global: true,
          },
        ],
        errors: [],
        meta: {},
      });
      const users = new UsersClient(http);

      const [role] = await users.getRoles(['role1'], 'cid-001');

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/user-management/entities/roles/GET/v2',
        query: {cid: 'cid-001'},
        body: {ids: ['role1']},
      });
      expect(role.displayName).toBe('Falcon Administrator');
      expect(role.isGlobal).toBe(true);
    });
  });

  describe('queryAvailableRoleIds', () => {
    it('sends a GET and returns role ids', async () => {
      const http = fakeHttpClient({
        resources: ['role1', 'role2'],
        errors: [],
        meta: {},
      });
      const users = new UsersClient(http);

      const result = await users.queryAvailableRoleIds({cid: 'cid-001'});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/user-management/queries/roles/v1',
        query: {cid: 'cid-001', user_uuid: undefined, action: undefined},
      });
      expect(result).toEqual(['role1', 'role2']);
    });
  });

  describe('performAction', () => {
    it('posts ids and a nested action_name', async () => {
      const http = fakeHttpClient(undefined);
      const users = new UsersClient(http);

      await users.performAction({
        ids: ['user-uuid-1'],
        action: 'reset_password',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/user-management/entities/user-actions/v1',
        body: {
          ids: ['user-uuid-1'],
          action: {action_name: 'reset_password'},
        },
      });
    });
  });

  describe('grantOrRevokeRole', () => {
    it('posts the grant action with role ids', async () => {
      const http = fakeHttpClient(undefined);
      const users = new UsersClient(http);

      await users.grantOrRevokeRole({
        uuid: 'user-uuid-1',
        cid: 'cid-001',
        roleIds: ['role1'],
        action: 'grant',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/user-management/entities/user-role-actions/v1',
        body: {
          action: 'grant',
          cid: 'cid-001',
          uuid: 'user-uuid-1',
          role_ids: ['role1'],
          expires_at: undefined,
        },
      });
    });
  });

  describe('getCombinedUserRoles', () => {
    it('sends a GET and maps combined role grants', async () => {
      const http = fakeHttpClient({
        resources: [
          {
            role_id: 'role1',
            role_name: 'Falcon Administrator',
            cid: 'cid-001',
            grant_type: 'direct',
          },
        ],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const users = new UsersClient(http);

      const result = await users.getCombinedUserRoles({
        userUuid: 'user-uuid-1',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/user-management/combined/user-roles/v2',
        query: {
          user_uuid: 'user-uuid-1',
          cid: undefined,
          direct_only: undefined,
          filter: undefined,
          offset: undefined,
          limit: undefined,
          sort: undefined,
        },
      });
      expect(result.roles[0].roleName).toBe('Falcon Administrator');
      expect(result.pagination).toEqual({offset: 0, limit: 100, total: 1});
    });
  });
});
