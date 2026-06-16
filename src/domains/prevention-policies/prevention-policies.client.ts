import type {HttpClient} from '../../core/http-client';
import {paginateOffset, type OffsetPageFetcher} from '../../core/pagination';
import type {CrowdStrikeEnvelope, OffsetPaginationMeta} from '../../core/types';
import {mapRawDeviceToHostDetails, type RawDevice} from '../hosts/hosts.mapper';
import type {HostDetails} from '../hosts/hosts.types';
import * as requests from './prevention-policies.requests';
import {
  mapRawPreventionPolicy,
  type RawPreventionPolicy,
} from './prevention-policies.mapper';
import type {
  PreventionPolicySearchParams,
  PreventionPolicyIdSearchResult,
  PreventionPolicySearchResult,
  PreventionPolicyDetails,
  CreatePreventionPolicyParams,
  UpdatePreventionPolicyParams,
  PerformPreventionPolicyActionParams,
  SetPreventionPolicyPrecedenceParams,
  QueryPreventionPolicyMembersParams,
  PreventionPolicyMemberSearchResult,
} from './prevention-policies.types';

function toPagination(raw: CrowdStrikeEnvelope<unknown>): {
  offset: number;
  limit: number;
  total: number;
} {
  const pagination = raw.meta?.pagination as OffsetPaginationMeta | undefined;
  return (
    pagination ?? {offset: 0, limit: 0, total: (raw.resources ?? []).length}
  );
}

/**
 * Wraps CrowdStrike's Prevention Policies API (PreventionPoliciesApi) in full —
 * every operation FalconJS exposes for this collection is implemented here.
 *
 * getCombinedMembers reuses the Hosts domain's device mapper, mirroring how
 * Host Groups' own combined-members endpoint is wrapped, since both return
 * the same hydrated device entity shape.
 */
export class PreventionPoliciesClient {
  constructor(private readonly http: HttpClient) {}

  /** Returns just the matching policy ids (one page). */
  async searchIds(
    params: PreventionPolicySearchParams = {},
  ): Promise<PreventionPolicyIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchIdsRequest(params),
    );
    return {ids: raw.resources, pagination: toPagination(raw)};
  }

  /** Returns a single page of fully hydrated policies. */
  async search(
    params: PreventionPolicySearchParams = {},
  ): Promise<PreventionPolicySearchResult> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawPreventionPolicy>
    >(requests.buildSearchCombinedRequest(params));
    return {
      policies: raw.resources.map(mapRawPreventionPolicy),
      pagination: toPagination(raw),
    };
  }

  /** Async-iterates every matching policy across all pages. */
  searchAll(
    params: Omit<PreventionPolicySearchParams, 'offset'> = {},
  ): AsyncGenerator<PreventionPolicyDetails> {
    const fetchPage: OffsetPageFetcher<PreventionPolicyDetails> = async (
      offset,
      limit,
    ) => {
      const page = await this.search({...params, offset, limit});
      return {resources: page.policies, pagination: page.pagination};
    };
    return paginateOffset(fetchPage, {pageSize: params.limit ?? 100});
  }

  async getDetails(ids: string[]): Promise<PreventionPolicyDetails[]> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawPreventionPolicy>
    >(requests.buildGetDetailsRequest(ids));
    return raw.resources.map(mapRawPreventionPolicy);
  }

  async create(
    params: CreatePreventionPolicyParams,
  ): Promise<PreventionPolicyDetails> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawPreventionPolicy>
    >(requests.buildCreateRequest(params));
    return mapRawPreventionPolicy(raw.resources[0]);
  }

  async update(
    params: UpdatePreventionPolicyParams,
  ): Promise<PreventionPolicyDetails> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawPreventionPolicy>
    >(requests.buildUpdateRequest(params));
    return mapRawPreventionPolicy(raw.resources[0]);
  }

  async delete(ids: string[]): Promise<void> {
    await this.http.request(requests.buildDeleteRequest(ids));
  }

  /** Enables/disables a policy, or adds/removes a host group or IOA rule group. */
  async performAction(
    params: PerformPreventionPolicyActionParams,
  ): Promise<void> {
    await this.http.request(requests.buildPerformActionRequest(params));
  }

  /** Sets the precedence order for all of a platform's prevention policies. */
  async setPrecedence(
    params: SetPreventionPolicyPrecedenceParams,
  ): Promise<void> {
    await this.http.request(requests.buildSetPrecedenceRequest(params));
  }

  /** Returns just the member host IDs for a policy (one page). */
  async queryMembers(
    params: QueryPreventionPolicyMembersParams,
  ): Promise<PreventionPolicyMemberSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildQueryMembersRequest(params),
    );
    return {hostIds: raw.resources, pagination: toPagination(raw)};
  }

  /** Returns fully hydrated host details for a policy's members in one call. */
  async getCombinedMembers(
    params: QueryPreventionPolicyMembersParams,
  ): Promise<HostDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawDevice>>(
      requests.buildCombinedMembersRequest(params),
    );
    return raw.resources.map(mapRawDeviceToHostDetails);
  }
}
