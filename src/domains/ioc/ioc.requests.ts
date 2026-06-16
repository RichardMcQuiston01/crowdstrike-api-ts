import type {RequestOptions} from '../../core/http-client';
import type {
  IocSearchParams,
  CreateIocParams,
  DeleteIocParams,
} from './ioc.types';

function buildSearchQuery(params: IocSearchParams) {
  return {
    filter: params.filter,
    offset: params.offset,
    limit: params.limit,
    sort: params.sort,
    after: params.after,
    from_parent: params.fromParent,
  };
}

export function buildSearchRequest(params: IocSearchParams): RequestOptions {
  return {
    method: 'GET',
    path: '/iocs/queries/indicators/v1',
    query: buildSearchQuery(params),
  };
}

export function buildSearchCombinedRequest(
  params: IocSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/iocs/combined/indicator/v1',
    query: buildSearchQuery(params),
  };
}

export function buildGetDetailsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/iocs/entities/indicators/v1',
    query: {ids},
  };
}

export function buildCreateRequest(params: CreateIocParams): RequestOptions {
  return {
    method: 'POST',
    path: '/iocs/entities/indicators/v1',
    query: {
      retrodetects: params.retrodetects,
      ignore_warnings: params.ignoreWarnings,
    },
    body: {
      comment: params.comment,
      indicators: params.indicators.map(indicator => ({
        type: indicator.type,
        value: indicator.value,
        applied_globally: indicator.appliedGlobally,
        action: indicator.action,
        description: indicator.description,
        expiration: indicator.expiration,
        host_groups: indicator.hostGroups,
        mobile_action: indicator.mobileAction,
        platforms: indicator.platforms,
        severity: indicator.severity,
        source: indicator.source,
        tags: indicator.tags,
      })),
    },
  };
}

export function buildDeleteRequest(params: DeleteIocParams): RequestOptions {
  return {
    method: 'DELETE',
    path: '/iocs/entities/indicators/v1',
    query: {
      filter: params.filter,
      ids: params.ids,
      comment: params.comment,
      from_parent: params.fromParent,
    },
  };
}
