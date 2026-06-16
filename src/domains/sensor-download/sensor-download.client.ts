import type {HttpClient} from '../../core/http-client';
import {paginateOffset, type OffsetPageFetcher} from '../../core/pagination';
import type {CrowdStrikeEnvelope, OffsetPaginationMeta} from '../../core/types';
import * as requests from './sensor-download.requests';
import {
  mapRawSensorInstaller,
  type RawSensorInstaller,
} from './sensor-download.mapper';
import type {
  SensorInstallerSearchParams,
  SensorInstallerIdSearchResult,
  SensorInstallerSearchResult,
  SensorInstallerDetails,
} from './sensor-download.types';

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

/** Wraps CrowdStrike's sensor installer catalog and binary download (SensorDownloadApi, v3 endpoints). */
export class SensorDownloadClient {
  constructor(private readonly http: HttpClient) {}

  /** Returns just the matching installer sha256 hashes (one page). */
  async searchIds(
    params: SensorInstallerSearchParams = {},
  ): Promise<SensorInstallerIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchIdsRequest(params),
    );
    return {ids: raw.resources, pagination: toPagination(raw)};
  }

  /** Returns a single page of fully hydrated installer records. */
  async search(
    params: SensorInstallerSearchParams = {},
  ): Promise<SensorInstallerSearchResult> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawSensorInstaller>
    >(requests.buildSearchRequest(params));
    return {
      installers: raw.resources.map(mapRawSensorInstaller),
      pagination: toPagination(raw),
    };
  }

  /** Async-iterates every matching installer across all pages. */
  searchAll(
    params: Omit<SensorInstallerSearchParams, 'offset'> = {},
  ): AsyncGenerator<SensorInstallerDetails> {
    const fetchPage: OffsetPageFetcher<SensorInstallerDetails> = async (
      offset,
      limit,
    ) => {
      const page = await this.search({...params, offset, limit});
      return {resources: page.installers, pagination: page.pagination};
    };
    return paginateOffset(fetchPage, {pageSize: params.limit ?? 100});
  }

  async getDetails(ids: string[]): Promise<SensorInstallerDetails[]> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawSensorInstaller>
    >(requests.buildGetDetailsRequest(ids));
    return raw.resources.map(mapRawSensorInstaller);
  }

  /** Returns the customer checksum ID(s) (CCID) needed to configure an installer. */
  async getCcid(): Promise<string[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildGetCcidRequest(),
    );
    return raw.resources;
  }

  /** Downloads the installer binary for the given sha256 as a Blob. */
  async download(sha256: string): Promise<Blob> {
    return this.http.request<Blob>(requests.buildDownloadRequest(sha256));
  }
}
