import type { HttpClient } from '../../core/http-client';
import { paginateOffset, type OffsetPageFetcher } from '../../core/pagination';
import type {
  CrowdStrikeEnvelope,
  OffsetPaginationMeta,
} from '../../core/types';
import * as requests from './intel.requests';
import { mapRawIntelIndicator, type RawIntelIndicator } from './intel.mapper';
import type {
  IntelIndicatorSearchParams,
  IntelIndicatorSearchResult,
  IntelIndicatorIdSearchResult,
  IntelIndicatorDetails,
} from './intel.types';

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
 * Wraps CrowdStrike's threat intelligence indicator feed (IntelApi). Actor,
 * report, and MITRE ATT&CK lookups are out of scope for this initial pass.
 */
export class IntelClient {
  constructor(private readonly http: HttpClient) {}

  /** Returns just the matching indicator IDs (one page). */
  async searchIds(
    params: IntelIndicatorSearchParams = {},
  ): Promise<IntelIndicatorIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchIdsRequest(params),
    );
    return { ids: raw.resources, pagination: toPagination(raw) };
  }

  /** Returns a single page of fully hydrated indicator records. */
  async search(
    params: IntelIndicatorSearchParams = {},
  ): Promise<IntelIndicatorSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawIntelIndicator>>(
      requests.buildSearchRequest(params),
    );
    return {
      indicators: raw.resources.map(mapRawIntelIndicator),
      pagination: toPagination(raw),
    };
  }

  /** Async-iterates every matching indicator across all pages. */
  searchAll(
    params: Omit<IntelIndicatorSearchParams, 'offset'> = {},
  ): AsyncGenerator<IntelIndicatorDetails> {
    const fetchPage: OffsetPageFetcher<IntelIndicatorDetails> = async (
      offset,
      limit,
    ) => {
      const page = await this.search({ ...params, offset, limit });
      return { resources: page.indicators, pagination: page.pagination };
    };
    return paginateOffset(fetchPage, { pageSize: params.limit ?? 100 });
  }

  async getDetails(ids: string[]): Promise<IntelIndicatorDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawIntelIndicator>>(
      requests.buildGetDetailsRequest(ids),
    );
    return raw.resources.map(mapRawIntelIndicator);
  }
}
