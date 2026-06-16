import type {RequestOptions} from '../../core/http-client';
import type {
  CloudResourceSearchParams,
  ApplicationFindingsParams,
} from './cloud-security.types';

export function buildSearchIdsRequest(
  params: CloudResourceSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/cloud-security-assets/queries/resources/v1',
    query: {
      filter: params.filter,
      sort: params.sort,
      offset: params.offset,
      limit: params.limit,
    },
  };
}

export function buildGetDetailsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/cloud-security-assets/entities/resources/v1',
    query: {ids},
  };
}

export function buildApplicationFindingsRequest(
  params: ApplicationFindingsParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/cloud-security-assets/combined/application-findings/v1',
    query: {
      type: params.type,
      crn: params.crn,
      gcrn: params.gcrn,
      filter: params.filter,
      offset: params.offset,
      limit: params.limit,
    },
  };
}
