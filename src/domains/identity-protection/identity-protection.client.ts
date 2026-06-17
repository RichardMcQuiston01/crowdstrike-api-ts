import type { HttpClient } from '../../core/http-client';
import { paginateOffset, type OffsetPageFetcher } from '../../core/pagination';
import type {
  CrowdStrikeEnvelope,
  OffsetPaginationMeta,
} from '../../core/types';
import * as requests from './identity-protection.requests';
import {
  mapRawIdentitySensor,
  type RawIdentitySensor,
} from './identity-protection.mapper';
import type {
  IdentitySensorSearchParams,
  IdentitySensorIdSearchResult,
  IdentitySensorDetails,
  IdentityProtectionGraphQLResponse,
} from './identity-protection.types';

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
 * Wraps CrowdStrike's Identity Protection module: sensor inventory
 * (IdentityEntitiesApi) plus the GraphQL passthrough for entities, timeline
 * activities, identity-based incidents, and security assessments
 * (IdentityProtectionApi). Policy rule management is out of scope.
 */
export class IdentityProtectionClient {
  constructor(private readonly http: HttpClient) {}

  /** Returns just the matching sensor (device) IDs (one page). */
  async searchSensorIds(
    params: IdentitySensorSearchParams = {},
  ): Promise<IdentitySensorIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchSensorIdsRequest(params),
    );
    return { ids: raw.resources, pagination: toPagination(raw) };
  }

  /** Async-iterates every matching sensor ID across all pages. */
  searchAllSensorIds(
    params: Omit<IdentitySensorSearchParams, 'offset'> = {},
  ): AsyncGenerator<string> {
    const fetchPage: OffsetPageFetcher<string> = async (offset, limit) => {
      const page = await this.searchSensorIds({ ...params, offset, limit });
      return { resources: page.ids, pagination: page.pagination };
    };
    return paginateOffset(fetchPage, { pageSize: params.limit ?? 100 });
  }

  async getSensorDetails(ids: string[]): Promise<IdentitySensorDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawIdentitySensor>>(
      requests.buildGetSensorDetailsRequest(ids),
    );
    return raw.resources.map(mapRawIdentitySensor);
  }

  /**
   * Runs a raw GraphQL query against the Identity Protection API. The
   * response shape depends entirely on the query, so the caller supplies
   * the expected `data` type as a generic parameter.
   */
  async graphql<T = unknown>(
    query: string,
  ): Promise<IdentityProtectionGraphQLResponse<T>> {
    return this.http.request<IdentityProtectionGraphQLResponse<T>>(
      requests.buildGraphqlRequest(query),
    );
  }
}
