import type { HttpClient } from '../../core/http-client';
import { paginateOffset, type OffsetPageFetcher } from '../../core/pagination';
import type {
  CrowdStrikeEnvelope,
  OffsetPaginationMeta,
} from '../../core/types';
import * as requests from './hosts.requests';
import { mapRawDeviceToHostDetails, type RawDevice } from './hosts.mapper';
import type {
  HostSearchParams,
  HostSearchResult,
  HostDetails,
  PerformHostActionParams,
  UpdateHostTagsParams,
} from './hosts.types';

export class HostsClient {
  constructor(private readonly http: HttpClient) {}

  /** Returns a single page of matching host IDs. */
  async search(params: HostSearchParams = {}): Promise<HostSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchRequest(params),
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

  /** Async-iterates every matching host ID across all pages. */
  searchAll(
    params: Omit<HostSearchParams, 'offset'> = {},
  ): AsyncGenerator<string> {
    const fetchPage: OffsetPageFetcher<string> = async (offset, limit) => {
      const page = await this.search({ ...params, offset, limit });
      return { resources: page.hostIds, pagination: page.pagination };
    };
    return paginateOffset(fetchPage, { pageSize: params.limit ?? 100 });
  }

  /** Hydrates full host details for up to 5000 device IDs. */
  async getDetails(ids: string[]): Promise<HostDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawDevice>>(
      requests.buildGetDetailsRequest(ids),
    );
    return raw.resources.map(mapRawDeviceToHostDetails);
  }

  /** Convenience: search + hydrate in one call for a single page. */
  async searchWithDetails(
    params: HostSearchParams = {},
  ): Promise<HostDetails[]> {
    const { hostIds } = await this.search(params);
    if (hostIds.length === 0) {
      return [];
    }
    return this.getDetails(hostIds);
  }

  async performAction(params: PerformHostActionParams): Promise<void> {
    await this.http.request(requests.buildPerformActionRequest(params));
  }

  async updateTags(params: UpdateHostTagsParams): Promise<void> {
    await this.http.request(requests.buildUpdateTagsRequest(params));
  }
}
