import type { RequestOptions } from '../../core/http-client';
import type {
  HostSearchParams,
  PerformHostActionParams,
  UpdateHostTagsParams,
} from './hosts.types';

export function buildSearchRequest(params: HostSearchParams): RequestOptions {
  return {
    method: 'GET',
    path: '/devices/queries/devices/v1',
    query: {
      filter: params.filter,
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
    },
  };
}

export function buildGetDetailsRequest(
  ids: string[],
): RequestOptions<{ ids: string[] }> {
  return {
    method: 'POST',
    path: '/devices/entities/devices/v2',
    body: { ids },
  };
}

export function buildPerformActionRequest(
  params: PerformHostActionParams,
): RequestOptions<{ ids: string[] }> {
  return {
    method: 'POST',
    path: '/devices/entities/devices-actions/v2',
    query: { action_name: params.action },
    body: { ids: params.ids },
  };
}

export function buildUpdateTagsRequest(
  params: UpdateHostTagsParams,
): RequestOptions<{ action: string; device_ids: string[]; tags: string[] }> {
  return {
    method: 'PATCH',
    path: '/devices/entities/devices/tags/v1',
    body: { action: params.action, device_ids: params.ids, tags: params.tags },
  };
}
