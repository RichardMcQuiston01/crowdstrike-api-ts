import type { RequestOptions } from '../../core/http-client';
import type { IdentitySensorSearchParams } from './identity-protection.types';

export function buildSearchSensorIdsRequest(
  params: IdentitySensorSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/identity-protection/queries/devices/v1',
    query: {
      filter: params.filter,
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
    },
  };
}

export function buildGetSensorDetailsRequest(ids: string[]): RequestOptions {
  return {
    method: 'POST',
    path: '/identity-protection/entities/devices/GET/v1',
    body: { ids },
  };
}

export function buildGraphqlRequest(query: string): RequestOptions {
  return {
    method: 'POST',
    path: '/identity-protection/combined/graphql/v1',
    body: { query },
  };
}
