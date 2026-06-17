import type { RequestOptions } from '../../core/http-client';
import type {
  CaseSearchParams,
  AddCaseTagsParams,
  RemoveCaseTagsParams,
} from './cases.types';

export function buildSearchRequest(params: CaseSearchParams): RequestOptions {
  return {
    method: 'GET',
    path: '/cases/queries/cases/v1',
    query: {
      filter: params.filter,
      q: params.q,
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
    },
  };
}

export function buildGetDetailsRequest(
  ids: string[],
): RequestOptions<{ ids: string[] }> {
  return { method: 'POST', path: '/cases/entities/cases/v2', body: { ids } };
}

export function buildAddTagsRequest(
  params: AddCaseTagsParams,
): RequestOptions<{ id: string; tags: string[] }> {
  return {
    method: 'POST',
    path: '/cases/entities/case-tags/v1',
    body: { id: params.id, tags: params.tags },
  };
}

export function buildRemoveTagsRequest(
  params: RemoveCaseTagsParams,
): RequestOptions {
  return {
    method: 'DELETE',
    path: '/cases/entities/case-tags/v1',
    query: { id: params.id, tag: params.tags },
  };
}
