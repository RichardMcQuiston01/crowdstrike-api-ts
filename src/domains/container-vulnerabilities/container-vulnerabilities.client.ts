import type {HttpClient} from '../../core/http-client';
import {paginateOffset, type OffsetPageFetcher} from '../../core/pagination';
import type {CrowdStrikeEnvelope, OffsetPaginationMeta} from '../../core/types';
import * as requests from './container-vulnerabilities.requests';
import {
  mapRawVulnerability,
  type RawVulnerability,
} from './container-vulnerabilities.mapper';
import type {
  VulnerabilitySearchParams,
  VulnerabilitySearchResult,
  VulnerabilityDetails,
  GetVulnerabilityInfoParams,
} from './container-vulnerabilities.types';

export class ContainerVulnerabilitiesClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Returns a single page of fully hydrated vulnerability records (this endpoint
   * combines search+hydrate in one call; max page size 100, max 10k results).
   */
  async search(
    params: VulnerabilitySearchParams = {},
  ): Promise<VulnerabilitySearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawVulnerability>>(
      requests.buildSearchRequest(params),
    );
    const pagination = raw.meta?.pagination as OffsetPaginationMeta | undefined;
    return {
      vulnerabilities: raw.resources.map(mapRawVulnerability),
      pagination: pagination ?? {
        offset: 0,
        limit: 0,
        total: raw.resources.length,
      },
    };
  }

  /** Async-iterates every matching vulnerability across all pages. */
  searchAll(
    params: Omit<VulnerabilitySearchParams, 'offset'> = {},
  ): AsyncGenerator<VulnerabilityDetails> {
    const fetchPage: OffsetPageFetcher<VulnerabilityDetails> = async (
      offset,
      limit,
    ) => {
      const page = await this.search({...params, offset, limit});
      return {resources: page.vulnerabilities, pagination: page.pagination};
    };
    return paginateOffset(fetchPage, {pageSize: params.limit ?? 100});
  }

  /** Returns CVE-level info (across all affected images) for a single CVE. */
  async getByCve(
    params: GetVulnerabilityInfoParams,
  ): Promise<VulnerabilityDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawVulnerability>>(
      requests.buildGetInfoRequest(params),
    );
    return raw.resources.map(mapRawVulnerability);
  }
}
