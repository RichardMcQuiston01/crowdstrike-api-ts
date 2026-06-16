import type {HttpClient} from '../../core/http-client';
import {paginateOffset, type OffsetPageFetcher} from '../../core/pagination';
import type {CrowdStrikeEnvelope, OffsetPaginationMeta} from '../../core/types';
import * as requests from './ioc.requests';
import {mapRawIoc, type RawIoc} from './ioc.mapper';
import type {
  IocSearchParams,
  IocSearchResult,
  IocCombinedSearchResult,
  IocDetails,
  CreateIocParams,
  DeleteIocParams,
} from './ioc.types';

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
 * Wraps CrowdStrike's custom IOC management surface (IocApi). Update is
 * intentionally omitted: ApiIndicatorUpdateReqV1's exact fields aren't
 * confirmed against the real API spec.
 */
export class IocClient {
  constructor(private readonly http: HttpClient) {}

  /** Returns just the matching indicator IDs (one page). */
  async search(params: IocSearchParams = {}): Promise<IocSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchRequest(params),
    );
    return {ids: raw.resources, pagination: toPagination(raw)};
  }

  /** Returns a single page of fully hydrated IOC records. */
  async searchCombined(
    params: IocSearchParams = {},
  ): Promise<IocCombinedSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawIoc>>(
      requests.buildSearchCombinedRequest(params),
    );
    return {
      iocs: raw.resources.map(mapRawIoc),
      pagination: toPagination(raw),
    };
  }

  /** Async-iterates every matching IOC across all pages. */
  searchAll(
    params: Omit<IocSearchParams, 'offset'> = {},
  ): AsyncGenerator<IocDetails> {
    const fetchPage: OffsetPageFetcher<IocDetails> = async (offset, limit) => {
      const page = await this.searchCombined({...params, offset, limit});
      return {resources: page.iocs, pagination: page.pagination};
    };
    return paginateOffset(fetchPage, {pageSize: params.limit ?? 100});
  }

  async getDetails(ids: string[]): Promise<IocDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawIoc>>(
      requests.buildGetDetailsRequest(ids),
    );
    return raw.resources.map(mapRawIoc);
  }

  async create(params: CreateIocParams): Promise<IocDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawIoc>>(
      requests.buildCreateRequest(params),
    );
    return raw.resources.map(mapRawIoc);
  }

  async delete(params: DeleteIocParams): Promise<void> {
    await this.http.request(requests.buildDeleteRequest(params));
  }
}
