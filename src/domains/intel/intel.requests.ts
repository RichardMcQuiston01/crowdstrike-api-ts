import type { RequestOptions } from '../../core/http-client';
import type { IntelIndicatorSearchParams } from './intel.types';

function buildSearchQuery(params: IntelIndicatorSearchParams) {
  return {
    offset: params.offset,
    limit: params.limit,
    sort: params.sort,
    filter: params.filter,
    q: params.q,
    include_deleted: params.includeDeleted,
    include_relations: params.includeRelations,
  };
}

export function buildSearchIdsRequest(
  params: IntelIndicatorSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/intel/queries/indicators/v1',
    query: buildSearchQuery(params),
  };
}

export function buildSearchRequest(
  params: IntelIndicatorSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/intel/combined/indicators/v1',
    query: buildSearchQuery(params),
  };
}

export function buildGetDetailsRequest(ids: string[]): RequestOptions {
  return {
    method: 'POST',
    path: '/intel/entities/indicators/GET/v1',
    body: { ids },
  };
}
