import type {RequestOptions} from '../../core/http-client';
import type {
  AlertSearchParams,
  CombinedAlertSearchParams,
  UpdateAlertParams,
} from './alerts.types';

export function buildSearchRequest(params: AlertSearchParams): RequestOptions {
  return {
    method: 'GET',
    path: '/alerts/queries/alerts/v2',
    query: {
      include_hidden: params.includeHidden,
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
      filter: params.filter,
      q: params.q,
    },
  };
}

export function buildGetDetailsRequest(
  compositeIds: string[],
): RequestOptions<{composite_ids: string[]}> {
  return {
    method: 'POST',
    path: '/alerts/entities/alerts/v2',
    body: {composite_ids: compositeIds},
  };
}

export function buildCombinedSearchRequest(
  params: CombinedAlertSearchParams,
  after?: string,
): RequestOptions<{
  after?: string;
  filter?: string;
  limit?: number;
  sort?: string;
}> {
  return {
    method: 'POST',
    path: '/alerts/combined/alerts/v1',
    body: {
      after,
      filter: params.filter,
      limit: params.limit,
      sort: params.sort,
    },
  };
}

export function buildUpdateRequest(params: UpdateAlertParams): RequestOptions<{
  composite_ids: string[];
  action_parameters: Array<{name: string; value: string}>;
}> {
  return {
    method: 'PATCH',
    path: '/alerts/entities/alerts/v3',
    body: {
      composite_ids: params.compositeIds,
      action_parameters: params.actionParameters,
    },
  };
}
