import type { HttpClient } from '../../core/http-client';
import { chunkedAction, chunkedLookup } from '../../core/chunk';
import type { ActionResult } from '../../core/resources';
import { requestAction } from '../../core/resources';
import {
  paginateOffset,
  type OffsetPageFetcher,
  readOffsetPagination,
} from '../../core/pagination';
import type { CrowdStrikeEnvelope } from '../../core/types';
import * as requests from './ioc.requests';
import { mapRawIoc, type RawIoc } from './ioc.mapper';
import type {
  IocSearchParams,
  IocSearchResult,
  IocCombinedSearchResult,
  IocDetails,
  CreateIocParams,
  DeleteIocParams,
} from './ioc.types';

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
    return { ids: raw.resources, pagination: readOffsetPagination(raw) };
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
      pagination: readOffsetPagination(raw),
    };
  }

  /** Async-iterates every matching IOC across all pages. */
  searchAll(
    params: Omit<IocSearchParams, 'offset'> = {},
  ): AsyncGenerator<IocDetails> {
    const fetchPage: OffsetPageFetcher<IocDetails> = async (offset, limit) => {
      const page = await this.searchCombined({ ...params, offset, limit });
      return { resources: page.iocs, pagination: page.pagination };
    };
    return paginateOffset(fetchPage, { pageSize: params.limit ?? 100 });
  }

  async getDetails(ids: string[]): Promise<IocDetails[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<CrowdStrikeEnvelope<RawIoc>>(
        requests.buildGetDetailsRequest(idChunk),
      );
      return raw.resources.map(mapRawIoc);
    });
  }

  async create(params: CreateIocParams): Promise<IocDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawIoc>>(
      requests.buildCreateRequest(params),
    );
    return raw.resources.map(mapRawIoc);
  }

  async delete(params: DeleteIocParams): Promise<ActionResult> {
    // A filter-based delete is a single server-side operation; only an explicit
    // id list is split to keep the query string within URL limits.
    const { ids } = params;
    if (!ids || params.filter) {
      return requestAction(this.http, requests.buildDeleteRequest(params));
    }
    return chunkedAction(ids, (idChunk) =>
      requestAction(
        this.http,
        requests.buildDeleteRequest({ ...params, ids: idChunk }),
      ),
    );
  }
}
