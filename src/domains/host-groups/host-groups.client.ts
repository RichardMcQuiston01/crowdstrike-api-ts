import type {HttpClient} from '../../core/http-client';
import type {CrowdStrikeEnvelope, OffsetPaginationMeta} from '../../core/types';
import {mapRawDeviceToHostDetails, type RawDevice} from '../hosts/hosts.mapper';
import type {HostDetails} from '../hosts/hosts.types';
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
    const raw = await this.http.request<CrowdStrikeEnvelope<RawHostGroup>>(
      requests.buildCreateRequest(params),
    );
    return mapRawHostGroupToDetails(raw.resources[0]);
  }

  async update(params: UpdateHostGroupParams): Promise<HostGroupDetails> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawHostGroup>>(
      requests.buildUpdateRequest(params),
    );
    return mapRawHostGroupToDetails(raw.resources[0]);
  }

  async delete(ids: string[]): Promise<void> {
    await this.http.request(requests.buildDeleteRequest(ids));
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

  async performAction(params: PerformHostGroupActionParams): Promise<void> {
    await this.http.request(requests.buildPerformActionRequest(params));
  }
}
