import type {RequestOptions} from '../../core/http-client';
import type {SensorInstallerSearchParams} from './sensor-download.types';

function buildSearchQuery(params: SensorInstallerSearchParams) {
  return {
    filter: params.filter,
    offset: params.offset,
    limit: params.limit,
    sort: params.sort,
  };
}

export function buildSearchIdsRequest(
  params: SensorInstallerSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/sensors/queries/installers/v3',
    query: buildSearchQuery(params),
  };
}

export function buildSearchRequest(
  params: SensorInstallerSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/sensors/combined/installers/v3',
    query: buildSearchQuery(params),
  };
}

export function buildGetDetailsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/sensors/entities/installers/v3',
    query: {ids},
  };
}

export function buildGetCcidRequest(): RequestOptions {
  return {
    method: 'GET',
    path: '/sensors/queries/installers/ccid/v1',
  };
}

export function buildDownloadRequest(sha256: string): RequestOptions {
  return {
    method: 'GET',
    path: '/sensors/entities/download-installer/v3',
    query: {id: sha256},
    responseType: 'blob',
  };
}
