import type { HttpClient } from '../../core/http-client';
import { chunkedLookup } from '../../core/chunk';
import {
  paginateCursor,
  type CursorPageFetcher,
  readOffsetPagination,
} from '../../core/pagination';
import type { CrowdStrikeEnvelope } from '../../core/types';
import * as requests from './discover.requests';
import {
  mapRawDiscoverHost,
  mapRawDiscoverApplication,
  mapRawDiscoverAccount,
  mapRawDiscoverLogin,
  type RawDiscoverHost,
  type RawDiscoverApplication,
  type RawDiscoverAccount,
  type RawDiscoverLogin,
} from './discover.mapper';
import type {
  DiscoverSearchParams,
  DiscoverIdSearchResult,
  DiscoverCombinedSearchParams,
  DiscoverCursorPagination,
  DiscoverHostDetails,
  DiscoverHostSearchResult,
  DiscoverApplicationDetails,
  DiscoverApplicationSearchResult,
  DiscoverAccountDetails,
  DiscoverLoginDetails,
} from './discover.types';

/**
 * The combined hosts/applications endpoints use Discover's own meta envelope
 * (DomainDiscoverAPIMetaInfo / DomainDiscoverAPIPaging: `{after, limit, total}`)
 * rather than the standard MsaMetaInfo offset/limit/total shape, so they get a
 * small local envelope type instead of the shared CrowdStrikeEnvelope.
 */
interface DiscoverCombinedEnvelope<T> {
  resources: T[];
  errors?: unknown[];
  meta?: { pagination?: { after?: string; limit: number; total: number } };
}

function toCursorPagination(
  raw: DiscoverCombinedEnvelope<unknown>,
  limit: number,
): DiscoverCursorPagination {
  return (
    raw.meta?.pagination ?? {
      limit,
      total: raw.resources.length,
    }
  );
}

/** Wraps CrowdStrike's Falcon Discover API (DiscoverApi) — asset/application/account/login inventory. */
export class DiscoverClient {
  constructor(private readonly http: HttpClient) {}

  async queryHostIds(
    params: DiscoverSearchParams = {},
  ): Promise<DiscoverIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildQueryHostsRequest(params),
    );
    return { ids: raw.resources, pagination: readOffsetPagination(raw) };
  }

  async queryApplicationIds(
    params: DiscoverSearchParams = {},
  ): Promise<DiscoverIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildQueryApplicationsRequest(params),
    );
    return { ids: raw.resources, pagination: readOffsetPagination(raw) };
  }

  async queryAccountIds(
    params: DiscoverSearchParams = {},
  ): Promise<DiscoverIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildQueryAccountsRequest(params),
    );
    return { ids: raw.resources, pagination: readOffsetPagination(raw) };
  }

  async queryLoginIds(
    params: DiscoverSearchParams = {},
  ): Promise<DiscoverIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildQueryLoginsRequest(params),
    );
    return { ids: raw.resources, pagination: readOffsetPagination(raw) };
  }

  async getHosts(ids: string[]): Promise<DiscoverHostDetails[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<CrowdStrikeEnvelope<RawDiscoverHost>>(
        requests.buildGetHostsRequest(idChunk),
      );
      return raw.resources.map(mapRawDiscoverHost);
    });
  }

  async getApplications(ids: string[]): Promise<DiscoverApplicationDetails[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<
        CrowdStrikeEnvelope<RawDiscoverApplication>
      >(requests.buildGetApplicationsRequest(idChunk));
      return raw.resources.map(mapRawDiscoverApplication);
    });
  }

  async getAccounts(ids: string[]): Promise<DiscoverAccountDetails[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<
        CrowdStrikeEnvelope<RawDiscoverAccount>
      >(requests.buildGetAccountsRequest(idChunk));
      return raw.resources.map(mapRawDiscoverAccount);
    });
  }

  async getLogins(ids: string[]): Promise<DiscoverLoginDetails[]> {
    return chunkedLookup(ids, async (idChunk) => {
      const raw = await this.http.request<
        CrowdStrikeEnvelope<RawDiscoverLogin>
      >(requests.buildGetLoginsRequest(idChunk));
      return raw.resources.map(mapRawDiscoverLogin);
    });
  }

  /** Returns a single page of fully hydrated assets matching the filter. */
  async searchHosts(
    params: DiscoverCombinedSearchParams,
  ): Promise<DiscoverHostSearchResult> {
    const raw = await this.http.request<
      DiscoverCombinedEnvelope<RawDiscoverHost>
    >(requests.buildCombinedHostsRequest(params));
    return {
      hosts: raw.resources.map(mapRawDiscoverHost),
      pagination: toCursorPagination(raw, params.limit ?? 100),
    };
  }

  /** Async-iterates every matching asset across all pages via cursor pagination. */
  searchAllHosts(
    params: DiscoverCombinedSearchParams,
  ): AsyncGenerator<DiscoverHostDetails> {
    const fetchPage: CursorPageFetcher<DiscoverHostDetails> = async (
      after,
      limit,
    ) => {
      const raw = await this.http.request<
        DiscoverCombinedEnvelope<RawDiscoverHost>
      >(requests.buildCombinedHostsRequest({ ...params, limit }, after));
      return {
        resources: raw.resources.map(mapRawDiscoverHost),
        pagination: toCursorPagination(raw, limit),
      };
    };
    return paginateCursor(fetchPage, { pageSize: params.limit ?? 100 });
  }

  /** Returns a single page of fully hydrated applications matching the filter. */
  async searchApplications(
    params: DiscoverCombinedSearchParams,
  ): Promise<DiscoverApplicationSearchResult> {
    const raw = await this.http.request<
      DiscoverCombinedEnvelope<RawDiscoverApplication>
    >(requests.buildCombinedApplicationsRequest(params));
    return {
      applications: raw.resources.map(mapRawDiscoverApplication),
      pagination: toCursorPagination(raw, params.limit ?? 100),
    };
  }

  /** Async-iterates every matching application across all pages via cursor pagination. */
  searchAllApplications(
    params: DiscoverCombinedSearchParams,
  ): AsyncGenerator<DiscoverApplicationDetails> {
    const fetchPage: CursorPageFetcher<DiscoverApplicationDetails> = async (
      after,
      limit,
    ) => {
      const raw = await this.http.request<
        DiscoverCombinedEnvelope<RawDiscoverApplication>
      >(requests.buildCombinedApplicationsRequest({ ...params, limit }, after));
      return {
        resources: raw.resources.map(mapRawDiscoverApplication),
        pagination: toCursorPagination(raw, limit),
      };
    };
    return paginateCursor(fetchPage, { pageSize: params.limit ?? 100 });
  }
}
