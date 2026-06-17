import { describe, it, expect, mock } from 'bun:test';
import { AlertsClient } from './alerts.client';
import type { HttpClient } from '../../core/http-client';
import queryAlertsFixture from './__fixtures__/query-alerts-response.json';
import alertDetailsFixture from './__fixtures__/alert-details-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return { request } as unknown as HttpClient;
}

describe('AlertsClient', () => {
  describe('search', () => {
    it('sends a GET to the query-alerts v2 endpoint', async () => {
      const http = fakeHttpClient(queryAlertsFixture);
      const alerts = new AlertsClient(http);

      const result = await alerts.search({ filter: "status:'new'" });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/alerts/queries/alerts/v2',
        query: {
          include_hidden: undefined,
          offset: undefined,
          limit: undefined,
          sort: undefined,
          filter: "status:'new'",
          q: undefined,
        },
      });
      expect(result.compositeIds).toEqual(queryAlertsFixture.resources);
      expect(result.pagination).toEqual(queryAlertsFixture.meta.pagination);
    });
  });

  describe('getDetails', () => {
    it('posts composite_ids and maps raw alerts to AlertDetails', async () => {
      const http = fakeHttpClient(alertDetailsFixture);
      const alerts = new AlertsClient(http);

      const [alert] = await alerts.getDetails(['comp-1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/alerts/entities/alerts/v2',
        body: { composite_ids: ['comp-1'] },
      });
      expect(alert.compositeId).toBe('comp-1');
      expect(alert.severity).toBe(80);
      expect(alert.assignedToName).toBe('Jane Doe');
    });
  });

  describe('searchCombinedAll', () => {
    it('pages through results using the after cursor', async () => {
      const http = fakeHttpClient(
        {
          resources: [alertDetailsFixture.resources[0]],
          errors: [],
          meta: { pagination: { after: 'cursor-2', limit: 1, total: 2 } },
        },
        {
          resources: [
            { ...alertDetailsFixture.resources[0], composite_id: 'comp-2' },
          ],
          errors: [],
          meta: { pagination: { after: undefined, limit: 1, total: 2 } },
        },
      );
      const alerts = new AlertsClient(http);

      const ids: string[] = [];
      for await (const alert of alerts.searchCombinedAll({ limit: 1 })) {
        ids.push(alert.compositeId);
      }

      expect(ids).toEqual(['comp-1', 'comp-2']);
      expect(http.request).toHaveBeenNthCalledWith(1, {
        method: 'POST',
        path: '/alerts/combined/alerts/v1',
        body: {
          after: undefined,
          filter: undefined,
          limit: 1,
          sort: undefined,
        },
      });
      expect(http.request).toHaveBeenNthCalledWith(2, {
        method: 'POST',
        path: '/alerts/combined/alerts/v1',
        body: {
          after: 'cursor-2',
          filter: undefined,
          limit: 1,
          sort: undefined,
        },
      });
    });
  });

  describe('updateStatus', () => {
    it('patches with an update_status action parameter', async () => {
      const http = fakeHttpClient(undefined);
      const alerts = new AlertsClient(http);

      await alerts.updateStatus({ compositeIds: ['comp-1'], status: 'closed' });

      expect(http.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/alerts/entities/alerts/v3',
        body: {
          composite_ids: ['comp-1'],
          action_parameters: [{ name: 'update_status', value: 'closed' }],
        },
      });
    });
  });

  describe('update', () => {
    it('patches with arbitrary action parameters', async () => {
      const http = fakeHttpClient(undefined);
      const alerts = new AlertsClient(http);

      await alerts.update({
        compositeIds: ['comp-1'],
        actionParameters: [{ name: 'assign_to_uuid', value: 'uuid-1' }],
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/alerts/entities/alerts/v3',
        body: {
          composite_ids: ['comp-1'],
          action_parameters: [{ name: 'assign_to_uuid', value: 'uuid-1' }],
        },
      });
    });
  });
});
