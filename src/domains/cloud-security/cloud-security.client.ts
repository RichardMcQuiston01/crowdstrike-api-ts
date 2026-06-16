import type {HttpClient} from '../../core/http-client';
import {paginateOffset, type OffsetPageFetcher} from '../../core/pagination';
import type {CrowdStrikeEnvelope, OffsetPaginationMeta} from '../../core/types';
import * as requests from './cloud-security.requests';
import {
  mapRawCloudResource,
  mapRawApplicationFinding,
  type RawCloudResource,
  type RawApplicationFinding,
} from './cloud-security.mapper';
import type {
  CloudResourceSearchParams,
  CloudResourceIdSearchResult,
  CloudResourceDetails,
  ApplicationFindingsParams,
  ApplicationFindingsResult,
} from './cloud-security.types';

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
 * Wraps CrowdStrike's cloud asset inventory (CloudSecurityAssetsApi) — the
 * core CSPM read surface. Cloud account registration (AWS/Azure/GCP/OCI),
 * policies, compliance, detections, and risk scoring are separate FalconJS
 * collections out of scope for this initial pass.
 */
export class CloudSecurityClient {
  constructor(private readonly http: HttpClient) {}

  /** Returns just the matching resource IDs (one page). */
  async searchIds(
    params: CloudResourceSearchParams = {},
  ): Promise<CloudResourceIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchIdsRequest(params),
    );
    return {ids: raw.resources, pagination: toPagination(raw)};
  }

  /** Async-iterates every matching resource ID across all pages. */
  searchAllIds(
    params: Omit<CloudResourceSearchParams, 'offset'> = {},
  ): AsyncGenerator<string> {
    const fetchPage: OffsetPageFetcher<string> = async (offset, limit) => {
      const page = await this.searchIds({...params, offset, limit});
      return {resources: page.ids, pagination: page.pagination};
    };
    return paginateOffset(fetchPage, {pageSize: params.limit ?? 100});
  }

  /** Hydrates up to 100 resources at a time by ID. */
  async getDetails(ids: string[]): Promise<CloudResourceDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCloudResource>>(
      requests.buildGetDetailsRequest(ids),
    );
    return raw.resources.map(mapRawCloudResource);
  }

  /** Returns application-level findings for a single resource. */
  async getApplicationFindings(
    params: ApplicationFindingsParams,
  ): Promise<ApplicationFindingsResult> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawApplicationFinding>
    >(requests.buildApplicationFindingsRequest(params));
    return {
      findings: raw.resources.map(mapRawApplicationFinding),
      pagination: toPagination(raw),
    };
  }
}
