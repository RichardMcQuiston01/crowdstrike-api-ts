import type { HttpClient } from '../../core/http-client';
import { paginateOffset, type OffsetPageFetcher } from '../../core/pagination';
import type {
  CrowdStrikeEnvelope,
  OffsetPaginationMeta,
} from '../../core/types';
import * as requests from './cases.requests';
import { mapRawCaseToDetails, type RawCase } from './cases.mapper';
import type {
  CaseSearchParams,
  CaseSearchResult,
  CaseDetails,
  AddCaseTagsParams,
  RemoveCaseTagsParams,
} from './cases.types';

export class CasesClient {
  constructor(private readonly http: HttpClient) {}

  async search(params: CaseSearchParams = {}): Promise<CaseSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchRequest(params),
    );
    const pagination = raw.meta?.pagination as OffsetPaginationMeta | undefined;
    return {
      caseIds: raw.resources,
      pagination: pagination ?? {
        offset: 0,
        limit: 0,
        total: raw.resources.length,
      },
    };
  }

  searchAll(
    params: Omit<CaseSearchParams, 'offset'> = {},
  ): AsyncGenerator<string> {
    const fetchPage: OffsetPageFetcher<string> = async (offset, limit) => {
      const page = await this.search({ ...params, offset, limit });
      return { resources: page.caseIds, pagination: page.pagination };
    };
    return paginateOffset(fetchPage, { pageSize: params.limit ?? 100 });
  }

  async getDetails(ids: string[]): Promise<CaseDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCase>>(
      requests.buildGetDetailsRequest(ids),
    );
    return raw.resources.map(mapRawCaseToDetails);
  }

  async searchWithDetails(
    params: CaseSearchParams = {},
  ): Promise<CaseDetails[]> {
    const { caseIds } = await this.search(params);
    if (caseIds.length === 0) {
      return [];
    }
    return this.getDetails(caseIds);
  }

  async addTags(params: AddCaseTagsParams): Promise<CaseDetails> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCase>>(
      requests.buildAddTagsRequest(params),
    );
    return mapRawCaseToDetails(raw.resources[0]);
  }

  async removeTags(params: RemoveCaseTagsParams): Promise<CaseDetails> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCase>>(
      requests.buildRemoveTagsRequest(params),
    );
    return mapRawCaseToDetails(raw.resources[0]);
  }
}
