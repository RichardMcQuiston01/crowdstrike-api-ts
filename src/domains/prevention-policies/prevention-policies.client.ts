import type { HttpClient } from '../../core/http-client';
import { chunkedAction, chunkedLookup } from '../../core/chunk';
import type { ActionResult } from '../../core/resources';
import { requestAction, requestFirst } from '../../core/resources';
import {
  paginateOffset,
  type OffsetPageFetcher,
  readOffsetPagination,
} from '../../core/pagination';
import type { CrowdStrikeEnvelope } from '../../core/types';
import {
  mapRawDeviceToHostDetails,
  type RawDevice,
} from '../hosts/hosts.mapper';
import type { HostDetails } from '../hosts/hosts.types';
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
    return { ids: raw.resources, pagination: readOffsetPagination(raw) };
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
      pagination: readOffsetPagination(raw),
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
      const page = await this.search({ ...params, offset, limit });
      return { resources: page.policies, pagination: page.pagination };
    };
    return paginateOffset(fetchPage, { pageSize: params.limit ?? 100 });
  }

  async getDetails(ids: string[]): Promise<PreventionPolicyDetails[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<
        CrowdStrikeEnvelope<RawPreventionPolicy>
      >(requests.buildGetDetailsRequest(idChunk));
      return raw.resources.map(mapRawPreventionPolicy);
    });
  }

  async create(
    params: CreatePreventionPolicyParams,
  ): Promise<PreventionPolicyDetails> {
    return mapRawPreventionPolicy(
      await requestFirst<RawPreventionPolicy>(
        this.http,
        requests.buildCreateRequest(params),
      ),
    );
  }

  async update(
    params: UpdatePreventionPolicyParams,
  ): Promise<PreventionPolicyDetails> {
    return mapRawPreventionPolicy(
      await requestFirst<RawPreventionPolicy>(
        this.http,
        requests.buildUpdateRequest(params),
      ),
    );
  }

  async delete(ids: string[]): Promise<ActionResult> {
    return chunkedAction(ids, (idChunk) =>
      requestAction(this.http, requests.buildDeleteRequest(idChunk)),
    );
  }

  /** Enables/disables a policy, or adds/removes a host group or IOA rule group. */
  async performAction(
    params: PerformPreventionPolicyActionParams,
  ): Promise<ActionResult> {
    return requestAction(this.http, requests.buildPerformActionRequest(params));
  }

  /** Sets the precedence order for all of a platform's prevention policies. */
  async setPrecedence(
    params: SetPreventionPolicyPrecedenceParams,
  ): Promise<ActionResult> {
    return requestAction(this.http, requests.buildSetPrecedenceRequest(params));
  }

  /** Returns just the member host IDs for a policy (one page). */
  async queryMembers(
    params: QueryPreventionPolicyMembersParams,
  ): Promise<PreventionPolicyMemberSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildQueryMembersRequest(params),
    );
    return { hostIds: raw.resources, pagination: readOffsetPagination(raw) };
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
