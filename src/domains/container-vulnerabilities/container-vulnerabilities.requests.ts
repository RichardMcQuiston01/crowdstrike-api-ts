import type {RequestOptions} from '../../core/http-client';
import type {
  VulnerabilitySearchParams,
  GetVulnerabilityInfoParams,
} from './container-vulnerabilities.types';

export function buildSearchRequest(
  params: VulnerabilitySearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/container-security/combined/vulnerabilities/v1',
    query: {
      filter: params.filter,
      limit: params.limit,
      offset: params.offset,
      sort: params.sort,
    },
  };
}

export function buildGetInfoRequest(
  params: GetVulnerabilityInfoParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/container-security/combined/vulnerabilities/info/v1',
    query: {cve_id: params.cveId, limit: params.limit, offset: params.offset},
  };
}
