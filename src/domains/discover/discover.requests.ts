import type { RequestOptions } from '../../core/http-client';
import type {
  DiscoverSearchParams,
  DiscoverCombinedSearchParams,
} from './discover.types';

function buildSearchQuery(params: DiscoverSearchParams) {
  return {
    filter: params.filter,
    offset: params.offset,
    limit: params.limit,
    sort: params.sort,
  };
}

export function buildQueryHostsRequest(
  params: DiscoverSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/discover/queries/hosts/v1',
    query: buildSearchQuery(params),
  };
}

export function buildQueryApplicationsRequest(
  params: DiscoverSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/discover/queries/applications/v1',
    query: buildSearchQuery(params),
  };
}

export function buildQueryAccountsRequest(
  params: DiscoverSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/discover/queries/accounts/v1',
    query: buildSearchQuery(params),
  };
}

export function buildQueryLoginsRequest(
  params: DiscoverSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/discover/queries/logins/v1',
    query: buildSearchQuery(params),
  };
}

export function buildGetHostsRequest(ids: string[]): RequestOptions {
  return { method: 'GET', path: '/discover/entities/hosts/v1', query: { ids } };
}

export function buildGetApplicationsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/discover/entities/applications/v1',
    query: { ids },
  };
}

export function buildGetAccountsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/discover/entities/accounts/v1',
    query: { ids },
  };
}

export function buildGetLoginsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/discover/entities/logins/v1',
    query: { ids },
  };
}

function buildCombinedQuery(
  params: DiscoverCombinedSearchParams,
  after?: string,
) {
  return {
    filter: params.filter,
    after,
    limit: params.limit,
    sort: params.sort,
    facet: params.facet,
  };
}

export function buildCombinedHostsRequest(
  params: DiscoverCombinedSearchParams,
  after?: string,
): RequestOptions {
  return {
    method: 'GET',
    path: '/discover/combined/hosts/v1',
    query: buildCombinedQuery(params, after),
  };
}

export function buildCombinedApplicationsRequest(
  params: DiscoverCombinedSearchParams,
  after?: string,
): RequestOptions {
  return {
    method: 'GET',
    path: '/discover/combined/applications/v1',
    query: buildCombinedQuery(params, after),
  };
}
