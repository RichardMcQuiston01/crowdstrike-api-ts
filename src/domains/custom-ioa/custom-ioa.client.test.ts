import {describe, it, expect, mock} from 'bun:test';
import {CustomIoaClient} from './custom-ioa.client';
import type {HttpClient} from '../../core/http-client';
import ruleGroupFixture from './__fixtures__/rule-group-response.json';
import ruleFixture from './__fixtures__/rule-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return {request} as unknown as HttpClient;
}

describe('CustomIoaClient', () => {
  describe('searchRuleGroupIds', () => {
    it('sends a GET to the query-rule-groups endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['rulegroup-1'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const customIoa = new CustomIoaClient(http);

      const result = await customIoa.searchRuleGroupIds({
        filter: "platform:'Windows'",
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/ioarules/queries/rule-groups/v1',
        query: {
          sort: undefined,
          filter: "platform:'Windows'",
          q: undefined,
          offset: undefined,
          limit: undefined,
        },
      });
      expect(result.ids).toEqual(['rulegroup-1']);
    });
  });

  describe('searchRuleGroupsFull', () => {
    it('sends a GET to the query-rule-groups-full endpoint and maps hydrated groups', async () => {
      const http = fakeHttpClient(ruleGroupFixture);
      const customIoa = new CustomIoaClient(http);

      const [group] = await customIoa.searchRuleGroupsFull({});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/ioarules/queries/rule-groups-full/v1',
        query: {
          sort: undefined,
          filter: undefined,
          q: undefined,
          offset: undefined,
          limit: undefined,
        },
      });
      expect(group.name).toBe('Suspicious PowerShell');
      expect(group.rules[0].name).toBe('Encoded command');
    });
  });

  describe('getRuleGroups', () => {
    it('gets rule groups by id', async () => {
      const http = fakeHttpClient(ruleGroupFixture);
      const customIoa = new CustomIoaClient(http);

      const [group] = await customIoa.getRuleGroups(['rulegroup-1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/ioarules/entities/rule-groups/v1',
        query: {ids: ['rulegroup-1']},
      });
      expect(group.platform).toBe('Windows');
    });
  });

  describe('createRuleGroup', () => {
    it('posts the new rule group fields', async () => {
      const http = fakeHttpClient(ruleGroupFixture);
      const customIoa = new CustomIoaClient(http);

      const group = await customIoa.createRuleGroup({
        name: 'Suspicious PowerShell',
        description: 'Flags suspicious PowerShell command lines',
        platform: 'Windows',
        comment: 'initial version',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/ioarules/entities/rule-groups/v1',
        body: {
          name: 'Suspicious PowerShell',
          description: 'Flags suspicious PowerShell command lines',
          platform: 'Windows',
          comment: 'initial version',
        },
      });
      expect(group.id).toBe('rulegroup-1');
    });
  });

  describe('updateRuleGroup', () => {
    it('patches the rule group fields with rulegroup_version', async () => {
      const http = fakeHttpClient(ruleGroupFixture);
      const customIoa = new CustomIoaClient(http);

      await customIoa.updateRuleGroup({
        id: 'rulegroup-1',
        name: 'Suspicious PowerShell',
        description: 'Updated description',
        enabled: true,
        comment: 'v2',
        rulegroupVersion: 2,
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/ioarules/entities/rule-groups/v1',
        body: {
          id: 'rulegroup-1',
          name: 'Suspicious PowerShell',
          description: 'Updated description',
          enabled: true,
          comment: 'v2',
          rulegroup_version: 2,
        },
      });
    });
  });

  describe('deleteRuleGroups', () => {
    it('sends a DELETE with ids and an optional comment', async () => {
      const http = fakeHttpClient(undefined);
      const customIoa = new CustomIoaClient(http);

      await customIoa.deleteRuleGroups(['rulegroup-1'], 'cleanup');

      expect(http.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/ioarules/entities/rule-groups/v1',
        query: {ids: ['rulegroup-1'], comment: 'cleanup'},
      });
    });
  });

  describe('searchRuleIds', () => {
    it('sends a GET to the query-rules endpoint', async () => {
      const http = fakeHttpClient({
        resources: ['rule-1'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const customIoa = new CustomIoaClient(http);

      const result = await customIoa.searchRuleIds({filter: "enabled:'true'"});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/ioarules/queries/rules/v1',
        query: {
          sort: undefined,
          filter: "enabled:'true'",
          q: undefined,
          offset: undefined,
          limit: undefined,
        },
      });
      expect(result.ids).toEqual(['rule-1']);
    });
  });

  describe('getRules', () => {
    it('gets rules by id and maps field values', async () => {
      const http = fakeHttpClient(ruleFixture);
      const customIoa = new CustomIoaClient(http);

      const [rule] = await customIoa.getRules(['rule-1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/ioarules/entities/rules/v1',
        query: {ids: ['rule-1']},
      });
      expect(rule.name).toBe('Encoded command');
      expect(rule.fieldValues[0].value).toBe('*-EncodedCommand*');
    });
  });

  describe('getRulesByVersion', () => {
    it('posts ids to the rules GET endpoint', async () => {
      const http = fakeHttpClient(ruleFixture);
      const customIoa = new CustomIoaClient(http);

      const [rule] = await customIoa.getRulesByVersion(['cid:rule-1:1']);

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/ioarules/entities/rules/GET/v1',
        body: {ids: ['cid:rule-1:1']},
      });
      expect(rule.instanceId).toBe('rule-1');
    });
  });

  describe('createRule', () => {
    it('posts the new rule fields with snake_case field values', async () => {
      const http = fakeHttpClient(ruleFixture);
      const customIoa = new CustomIoaClient(http);

      const rule = await customIoa.createRule({
        rulegroupId: 'rulegroup-1',
        ruletypeId: 'ruletype-1',
        name: 'Encoded command',
        description: 'Detects -EncodedCommand usage',
        comment: 'initial version',
        dispositionId: 20,
        patternSeverity: 'high',
        fieldValues: [
          {name: 'CommandLine', type: 'string', value: '*-EncodedCommand*'},
        ],
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/ioarules/entities/rules/v1',
        body: {
          rulegroup_id: 'rulegroup-1',
          ruletype_id: 'ruletype-1',
          name: 'Encoded command',
          description: 'Detects -EncodedCommand usage',
          comment: 'initial version',
          disposition_id: 20,
          pattern_severity: 'high',
          field_values: [
            {
              name: 'CommandLine',
              type: 'string',
              value: '*-EncodedCommand*',
              label: undefined,
              final_value: undefined,
              values: undefined,
            },
          ],
        },
      });
      expect(rule.instanceId).toBe('rule-1');
    });
  });

  describe('updateRules', () => {
    it('patches v1 with the full rule_updates state', async () => {
      const http = fakeHttpClient({
        resources: [ruleFixture.resources[0]],
        errors: [],
        meta: {},
      });
      const customIoa = new CustomIoaClient(http);

      await customIoa.updateRules({
        rulegroupId: 'rulegroup-1',
        rulegroupVersion: 2,
        comment: 'tightened pattern',
        ruleUpdates: [
          {
            instanceId: 'rule-1',
            name: 'Encoded command',
            description: 'Detects -EncodedCommand usage',
            enabled: true,
            dispositionId: 20,
            patternSeverity: 'high',
            fieldValues: [
              {name: 'CommandLine', type: 'string', value: '*-enc*'},
            ],
            rulegroupVersion: 2,
          },
        ],
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/ioarules/entities/rules/v1',
        body: {
          comment: 'tightened pattern',
          rulegroup_id: 'rulegroup-1',
          rulegroup_version: 2,
          rule_updates: [
            {
              instance_id: 'rule-1',
              name: 'Encoded command',
              description: 'Detects -EncodedCommand usage',
              enabled: true,
              disposition_id: 20,
              pattern_severity: 'high',
              field_values: [
                {
                  name: 'CommandLine',
                  type: 'string',
                  value: '*-enc*',
                  label: undefined,
                  final_value: undefined,
                  values: undefined,
                },
              ],
              rulegroup_version: 2,
            },
          ],
        },
      });
    });
  });

  describe('updateRulesV2', () => {
    it('patches v2 with a partial rule_updates subset', async () => {
      const http = fakeHttpClient({
        resources: [ruleFixture.resources[0]],
        errors: [],
        meta: {},
      });
      const customIoa = new CustomIoaClient(http);

      await customIoa.updateRulesV2({
        rulegroupId: 'rulegroup-1',
        rulegroupVersion: 2,
        comment: 'disable rule',
        ruleUpdates: [
          {
            instanceId: 'rule-1',
            name: 'Encoded command',
            description: 'Detects -EncodedCommand usage',
            enabled: false,
            dispositionId: 20,
            patternSeverity: 'high',
            fieldValues: [],
            rulegroupVersion: 2,
          },
        ],
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'PATCH',
        path: '/ioarules/entities/rules/v2',
        body: {
          comment: 'disable rule',
          rulegroup_id: 'rulegroup-1',
          rulegroup_version: 2,
          rule_updates: [
            {
              instance_id: 'rule-1',
              name: 'Encoded command',
              description: 'Detects -EncodedCommand usage',
              enabled: false,
              disposition_id: 20,
              pattern_severity: 'high',
              field_values: [],
              rulegroup_version: 2,
            },
          ],
        },
      });
    });
  });

  describe('deleteRules', () => {
    it('sends a DELETE with rule_group_id, ids, and an optional comment', async () => {
      const http = fakeHttpClient(undefined);
      const customIoa = new CustomIoaClient(http);

      await customIoa.deleteRules(
        'rulegroup-1',
        ['rule-1'],
        'no longer needed',
      );

      expect(http.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/ioarules/entities/rules/v1',
        query: {
          rule_group_id: 'rulegroup-1',
          ids: ['rule-1'],
          comment: 'no longer needed',
        },
      });
    });
  });

  describe('validate', () => {
    it('posts fields and maps validation results', async () => {
      const http = fakeHttpClient({
        resources: [
          {
            name: 'CommandLine',
            value: '*-EncodedCommand*',
            bytes: '12',
            valid: true,
            matches_test: true,
            test_data: 'powershell -EncodedCommand abc',
          },
        ],
        errors: [],
        meta: {},
      });
      const customIoa = new CustomIoaClient(http);

      const [result] = await customIoa.validate([
        {
          name: 'CommandLine',
          type: 'string',
          testData: 'powershell -EncodedCommand abc',
        },
      ]);

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/ioarules/entities/rules/validate/v1',
        body: {
          fields: [
            {
              name: 'CommandLine',
              type: 'string',
              test_data: 'powershell -EncodedCommand abc',
              values: undefined,
            },
          ],
        },
      });
      expect(result.valid).toBe(true);
      expect(result.matchesTest).toBe(true);
    });
  });

  describe('searchPatternIds / getPatterns', () => {
    it('searches pattern severity ids and hydrates them', async () => {
      const http = fakeHttpClient(
        {
          resources: ['high'],
          errors: [],
          meta: {pagination: {offset: 0, limit: 100, total: 1}},
        },
        {resources: [{name: 'high', severity: '80'}], errors: [], meta: {}},
      );
      const customIoa = new CustomIoaClient(http);

      const ids = await customIoa.searchPatternIds({});
      const [pattern] = await customIoa.getPatterns(['high']);

      expect(http.request).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        path: '/ioarules/queries/pattern-severities/v1',
        query: {offset: undefined, limit: undefined},
      });
      expect(http.request).toHaveBeenNthCalledWith(2, {
        method: 'GET',
        path: '/ioarules/entities/pattern-severities/v1',
        query: {ids: ['high']},
      });
      expect(ids.ids).toEqual(['high']);
      expect(pattern.severity).toBe('80');
    });
  });

  describe('searchPlatformIds / getPlatforms', () => {
    it('searches platform ids and hydrates them', async () => {
      const http = fakeHttpClient(
        {
          resources: ['windows'],
          errors: [],
          meta: {pagination: {offset: 0, limit: 100, total: 1}},
        },
        {resources: [{id: 'windows', label: 'Windows'}], errors: [], meta: {}},
      );
      const customIoa = new CustomIoaClient(http);

      const ids = await customIoa.searchPlatformIds({});
      const [platform] = await customIoa.getPlatforms(['windows']);

      expect(http.request).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        path: '/ioarules/queries/platforms/v1',
        query: {offset: undefined, limit: undefined},
      });
      expect(http.request).toHaveBeenNthCalledWith(2, {
        method: 'GET',
        path: '/ioarules/entities/platforms/v1',
        query: {ids: ['windows']},
      });
      expect(ids.ids).toEqual(['windows']);
      expect(platform.label).toBe('Windows');
    });
  });

  describe('searchRuleTypeIds / getRuleTypes', () => {
    it('searches rule type ids and hydrates them', async () => {
      const http = fakeHttpClient(
        {
          resources: ['ruletype-1'],
          errors: [],
          meta: {pagination: {offset: 0, limit: 100, total: 1}},
        },
        {
          resources: [
            {
              id: 'ruletype-1',
              name: 'Process Creation',
              platform: 'Windows',
              long_desc: 'Triggered on process creation events',
              channel: 1,
              released: true,
              disposition_map: [{id: 20, label: 'Detect'}],
              fields: [{name: 'CommandLine', label: 'Command Line'}],
            },
          ],
          errors: [],
          meta: {},
        },
      );
      const customIoa = new CustomIoaClient(http);

      const ids = await customIoa.searchRuleTypeIds({});
      const [ruleType] = await customIoa.getRuleTypes(['ruletype-1']);

      expect(http.request).toHaveBeenNthCalledWith(1, {
        method: 'GET',
        path: '/ioarules/queries/rule-types/v1',
        query: {offset: undefined, limit: undefined},
      });
      expect(http.request).toHaveBeenNthCalledWith(2, {
        method: 'GET',
        path: '/ioarules/entities/rule-types/v1',
        query: {ids: ['ruletype-1']},
      });
      expect(ids.ids).toEqual(['ruletype-1']);
      expect(ruleType.name).toBe('Process Creation');
      expect(ruleType.fields[0]).toEqual({
        name: 'CommandLine',
        label: 'Command Line',
      });
    });
  });
});
