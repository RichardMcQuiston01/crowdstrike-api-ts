import type { HttpClient } from '../../core/http-client';
import type { ActionResult } from '../../core/resources';
import { requestAction, requestFirst } from '../../core/resources';
import type {
  CrowdStrikeEnvelope,
  OffsetPaginationMeta,
} from '../../core/types';
import {
  mapRawDeviceToHostDetails,
  type RawDevice,
} from '../hosts/hosts.mapper';
import type { HostDetails } from '../hosts/hosts.types';
import * as requests from './host-groups.requests';
import {
  mapRawHostGroupToDetails,
  type RawHostGroup,
} from './host-groups.mapper';
import type {
  HostGroupSearchParams,
  HostGroupSearchResult,
  HostGroupDetails,
  CreateHostGroupParams,
  UpdateHostGroupParams,
  QueryGroupMembersParams,
  GroupMemberSearchResult,
  PerformHostGroupActionParams,
} from './host-groups.types';

export class HostGroupsClient {
  constructor(private readonly http: HttpClient) {}

  async search(
    params: HostGroupSearchParams = {},
  ): Promise<HostGroupSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchRequest(params),
    );
    const pagination = raw.meta?.pagination as OffsetPaginationMeta | undefined;
    return {
      groupIds: raw.resources,
      pagination: pagination ?? {
        offset: 0,
        limit: 0,
        total: raw.resources.length,
      },
    };
  }

  async getDetails(ids: string[]): Promise<HostGroupDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawHostGroup>>(
      requests.buildGetDetailsRequest(ids),
    );
    return raw.resources.map(mapRawHostGroupToDetails);
  }

  async create(params: CreateHostGroupParams): Promise<HostGroupDetails> {
    return mapRawHostGroupToDetails(
      await requestFirst<RawHostGroup>(
        this.http,
        requests.buildCreateRequest(params),
      ),
    );
  }

  async update(params: UpdateHostGroupParams): Promise<HostGroupDetails> {
    return mapRawHostGroupToDetails(
      await requestFirst<RawHostGroup>(
        this.http,
        requests.buildUpdateRequest(params),
      ),
    );
  }

  async delete(ids: string[]): Promise<ActionResult> {
    return requestAction(this.http, requests.buildDeleteRequest(ids));
  }

  /** Returns just the member device IDs for a group (one page). */
  async queryMembers(
    params: QueryGroupMembersParams,
  ): Promise<GroupMemberSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildQueryMembersRequest(params),
    );
    const pagination = raw.meta?.pagination as OffsetPaginationMeta | undefined;
    return {
      hostIds: raw.resources,
      pagination: pagination ?? {
        offset: 0,
        limit: 0,
        total: raw.resources.length,
      },
    };
  }

  /** Returns fully hydrated host details for a group's members in one call. */
  async getCombinedMembers(
    params: QueryGroupMembersParams,
  ): Promise<HostDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawDevice>>(
      requests.buildCombinedMembersRequest(params),
    );
    return raw.resources.map(mapRawDeviceToHostDetails);
  }

  async performAction(
    params: PerformHostGroupActionParams,
  ): Promise<ActionResult> {
    return requestAction(this.http, requests.buildPerformActionRequest(params));
  }
}
