import type { HttpClient } from '../../core/http-client';
import { chunkedAction, chunkedLookup } from '../../core/chunk';
import type { ActionResult } from '../../core/resources';
import { requestAction, requestFirst } from '../../core/resources';
import type {
  CrowdStrikeEnvelope,
  OffsetPaginationMeta,
} from '../../core/types';
import * as requests from './custom-ioa.requests';
import {
  mapRawCustomIoaRule,
  mapRawCustomIoaRuleGroup,
  mapRawPatternSeverity,
  mapRawIoaPlatform,
  mapRawRuleType,
  mapRawFieldValidation,
  type RawCustomIoaRule,
  type RawCustomIoaRuleGroup,
  type RawPatternSeverity,
  type RawIoaPlatform,
  type RawRuleType,
  type RawFieldValidation,
} from './custom-ioa.mapper';
import type {
  CustomIoaSearchParams,
  CustomIoaIdSearchResult,
  LookupSearchParams,
  CustomIoaRuleDetails,
  CustomIoaRuleGroupDetails,
  CreateRuleGroupParams,
  UpdateRuleGroupParams,
  CreateRuleParams,
  UpdateRulesParams,
  ValidateRuleField,
  PatternSeverity,
  IoaPlatform,
  RuleTypeDetails,
  FieldValidationResult,
} from './custom-ioa.types';

function toPagination(raw: CrowdStrikeEnvelope<unknown>): {
  offset: number;
  limit: number;
  total: number;
} {
  const pagination = raw.meta?.pagination as OffsetPaginationMeta | undefined;
  return (
    pagination ?? { offset: 0, limit: 0, total: (raw.resources ?? []).length }
  );
}

/**
 * Wraps CrowdStrike's Custom IOA API (CustomIoaApi) — Falcon's custom
 * indicator-of-attack rule groups and rules. Full FalconJS coverage: all 20
 * methods are implemented, including both the v1 (full rule-group state) and
 * v2 (partial/subset) flavors of rule updates, since they serve genuinely
 * different update semantics rather than one superseding the other.
 */
export class CustomIoaClient {
  constructor(private readonly http: HttpClient) {}

  async searchRuleGroupIds(
    params: CustomIoaSearchParams = {},
  ): Promise<CustomIoaIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchRuleGroupIdsRequest(params),
    );
    return { ids: raw.resources, pagination: toPagination(raw) };
  }

  async searchRuleGroupsFull(
    params: CustomIoaSearchParams = {},
  ): Promise<CustomIoaRuleGroupDetails[]> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawCustomIoaRuleGroup>
    >(requests.buildSearchRuleGroupsFullRequest(params));
    return raw.resources.map(mapRawCustomIoaRuleGroup);
  }

  async getRuleGroups(ids: string[]): Promise<CustomIoaRuleGroupDetails[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<
        CrowdStrikeEnvelope<RawCustomIoaRuleGroup>
      >(requests.buildGetRuleGroupsRequest(idChunk));
      return raw.resources.map(mapRawCustomIoaRuleGroup);
    });
  }

  async createRuleGroup(
    params: CreateRuleGroupParams,
  ): Promise<CustomIoaRuleGroupDetails> {
    return mapRawCustomIoaRuleGroup(
      await requestFirst<RawCustomIoaRuleGroup>(
        this.http,
        requests.buildCreateRuleGroupRequest(params),
      ),
    );
  }

  async updateRuleGroup(
    params: UpdateRuleGroupParams,
  ): Promise<CustomIoaRuleGroupDetails> {
    return mapRawCustomIoaRuleGroup(
      await requestFirst<RawCustomIoaRuleGroup>(
        this.http,
        requests.buildUpdateRuleGroupRequest(params),
      ),
    );
  }

  async deleteRuleGroups(
    ids: string[],
    comment?: string,
  ): Promise<ActionResult> {
    return chunkedAction(ids, (idChunk) =>
      requestAction(
        this.http,
        requests.buildDeleteRuleGroupsRequest(idChunk, comment),
      ),
    );
  }

  async searchRuleIds(
    params: CustomIoaSearchParams = {},
  ): Promise<CustomIoaIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchRuleIdsRequest(params),
    );
    return { ids: raw.resources, pagination: toPagination(raw) };
  }

  async getRules(ids: string[]): Promise<CustomIoaRuleDetails[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<
        CrowdStrikeEnvelope<RawCustomIoaRule>
      >(requests.buildGetRulesRequest(idChunk));
      return raw.resources.map(mapRawCustomIoaRule);
    });
  }

  /** Fetches rules by id, optionally with an embedded `cid` and/or `version` (e.g. `cid:id:version`). */
  async getRulesByVersion(ids: string[]): Promise<CustomIoaRuleDetails[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<
        CrowdStrikeEnvelope<RawCustomIoaRule>
      >(requests.buildGetRulesByVersionRequest(idChunk));
      return raw.resources.map(mapRawCustomIoaRule);
    });
  }

  async createRule(params: CreateRuleParams): Promise<CustomIoaRuleDetails> {
    return mapRawCustomIoaRule(
      await requestFirst<RawCustomIoaRule>(
        this.http,
        requests.buildCreateRuleRequest(params),
      ),
    );
  }

  /** Updates rules within a group; requires the complete state of every rule in the group. */
  async updateRules(
    params: UpdateRulesParams,
  ): Promise<CustomIoaRuleDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCustomIoaRule>>(
      requests.buildUpdateRulesRequest(params),
    );
    return raw.resources.map(mapRawCustomIoaRule);
  }

  /** Updates rules within a group; accepts a subset of the group's rules and only applies those changes. */
  async updateRulesV2(
    params: UpdateRulesParams,
  ): Promise<CustomIoaRuleDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCustomIoaRule>>(
      requests.buildUpdateRulesV2Request(params),
    );
    return raw.resources.map(mapRawCustomIoaRule);
  }

  async deleteRules(
    ruleGroupId: string,
    ids: string[],
    comment?: string,
  ): Promise<ActionResult> {
    return chunkedAction(ids, (idChunk) =>
      requestAction(
        this.http,
        requests.buildDeleteRulesRequest(ruleGroupId, idChunk, comment),
      ),
    );
  }

  async validate(
    fields: ValidateRuleField[],
  ): Promise<FieldValidationResult[]> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawFieldValidation>
    >(requests.buildValidateRequest(fields));
    return raw.resources.map(mapRawFieldValidation);
  }

  async searchPatternIds(
    params: LookupSearchParams = {},
  ): Promise<CustomIoaIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchPatternIdsRequest(params),
    );
    return { ids: raw.resources, pagination: toPagination(raw) };
  }

  async getPatterns(ids: string[]): Promise<PatternSeverity[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<
        CrowdStrikeEnvelope<RawPatternSeverity>
      >(requests.buildGetPatternsRequest(idChunk));
      return raw.resources.map(mapRawPatternSeverity);
    });
  }

  async searchPlatformIds(
    params: LookupSearchParams = {},
  ): Promise<CustomIoaIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchPlatformIdsRequest(params),
    );
    return { ids: raw.resources, pagination: toPagination(raw) };
  }

  async getPlatforms(ids: string[]): Promise<IoaPlatform[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<CrowdStrikeEnvelope<RawIoaPlatform>>(
        requests.buildGetPlatformsRequest(idChunk),
      );
      return raw.resources.map(mapRawIoaPlatform);
    });
  }

  async searchRuleTypeIds(
    params: LookupSearchParams = {},
  ): Promise<CustomIoaIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchRuleTypeIdsRequest(params),
    );
    return { ids: raw.resources, pagination: toPagination(raw) };
  }

  async getRuleTypes(ids: string[]): Promise<RuleTypeDetails[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<CrowdStrikeEnvelope<RawRuleType>>(
        requests.buildGetRuleTypesRequest(idChunk),
      );
      return raw.resources.map(mapRawRuleType);
    });
  }
}
