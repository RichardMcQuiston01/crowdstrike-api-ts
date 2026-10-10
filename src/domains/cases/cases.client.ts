import type { HttpClient } from '../../core/http-client';
import { requestFirst } from '../../core/resources';
import {
  paginateOffset,
  type OffsetPageFetcher,
  readOffsetPagination,
} from '../../core/pagination';
import type { CrowdStrikeEnvelope } from '../../core/types';
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
    return {
      caseIds: raw.resources,
      pagination: readOffsetPagination(raw),
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
    return mapRawCaseToDetails(
      await requestFirst<RawCase>(
        this.http,
        requests.buildAddTagsRequest(params),
      ),
    );
  }

  async removeTags(params: RemoveCaseTagsParams): Promise<CaseDetails> {
    return mapRawCaseToDetails(
      await requestFirst<RawCase>(
        this.http,
        requests.buildRemoveTagsRequest(params),
      ),
    );
  }
}
