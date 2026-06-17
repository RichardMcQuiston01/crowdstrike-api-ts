import type { HttpClient } from '../../core/http-client';
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
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawCustomIoaRuleGroup>
    >(requests.buildGetRuleGroupsRequest(ids));
    return raw.resources.map(mapRawCustomIoaRuleGroup);
  }

  async createRuleGroup(
    params: CreateRuleGroupParams,
  ): Promise<CustomIoaRuleGroupDetails> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawCustomIoaRuleGroup>
    >(requests.buildCreateRuleGroupRequest(params));
    return mapRawCustomIoaRuleGroup(raw.resources[0]);
  }

  async updateRuleGroup(
    params: UpdateRuleGroupParams,
  ): Promise<CustomIoaRuleGroupDetails> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawCustomIoaRuleGroup>
    >(requests.buildUpdateRuleGroupRequest(params));
    return mapRawCustomIoaRuleGroup(raw.resources[0]);
  }

  async deleteRuleGroups(ids: string[], comment?: string): Promise<void> {
    await this.http.request(
      requests.buildDeleteRuleGroupsRequest(ids, comment),
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
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCustomIoaRule>>(
      requests.buildGetRulesRequest(ids),
    );
    return raw.resources.map(mapRawCustomIoaRule);
  }

  /** Fetches rules by id, optionally with an embedded `cid` and/or `version` (e.g. `cid:id:version`). */
  async getRulesByVersion(ids: string[]): Promise<CustomIoaRuleDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCustomIoaRule>>(
      requests.buildGetRulesByVersionRequest(ids),
    );
    return raw.resources.map(mapRawCustomIoaRule);
  }

  async createRule(params: CreateRuleParams): Promise<CustomIoaRuleDetails> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCustomIoaRule>>(
      requests.buildCreateRuleRequest(params),
    );
    return mapRawCustomIoaRule(raw.resources[0]);
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
  ): Promise<void> {
    await this.http.request(
      requests.buildDeleteRulesRequest(ruleGroupId, ids, comment),
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
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawPatternSeverity>
    >(requests.buildGetPatternsRequest(ids));
    return raw.resources.map(mapRawPatternSeverity);
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
    const raw = await this.http.request<CrowdStrikeEnvelope<RawIoaPlatform>>(
      requests.buildGetPlatformsRequest(ids),
    );
    return raw.resources.map(mapRawIoaPlatform);
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
    const raw = await this.http.request<CrowdStrikeEnvelope<RawRuleType>>(
      requests.buildGetRuleTypesRequest(ids),
    );
    return raw.resources.map(mapRawRuleType);
  }
}
