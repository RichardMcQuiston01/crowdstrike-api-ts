import type { HttpClient } from '../../core/http-client';
import type { ActionResult } from '../../core/resources';
import { requestAction } from '../../core/resources';
import {
  paginateCursor,
  type CursorPageFetcher,
  readOffsetPagination,
} from '../../core/pagination';
import type {
  CrowdStrikeEnvelope,
  CursorPaginationMeta,
} from '../../core/types';
import * as requests from './alerts.requests';
import { mapRawAlertToDetails, type RawAlert } from './alerts.mapper';
import type {
  AlertSearchParams,
  AlertSearchResult,
  AlertDetails,
  CombinedAlertSearchParams,
  UpdateAlertStatusParams,
  UpdateAlertParams,
} from './alerts.types';

export class AlertsClient {
  constructor(private readonly http: HttpClient) {}

  /** Returns a single page of matching alert composite IDs. */
  async search(params: AlertSearchParams = {}): Promise<AlertSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchRequest(params),
    );
    return {
      compositeIds: raw.resources,
      pagination: readOffsetPagination(raw),
    };
  }

  /** Hydrates full alert details for the given composite IDs. */
  async getDetails(compositeIds: string[]): Promise<AlertDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawAlert>>(
      requests.buildGetDetailsRequest(compositeIds),
    );
    return raw.resources.map(mapRawAlertToDetails);
  }

  /**
   * Async-iterates every alert matching the filter using cursor/after-token
   * pagination, intended for retrieving large (>10k) result sets.
   */
  searchCombinedAll(
    params: CombinedAlertSearchParams = {},
  ): AsyncGenerator<AlertDetails> {
    const fetchPage: CursorPageFetcher<AlertDetails> = async (after, limit) => {
      const raw = await this.http.request<CrowdStrikeEnvelope<RawAlert>>(
        requests.buildCombinedSearchRequest({ ...params, limit }, after),
      );
      const pagination = raw.meta?.pagination as
        | CursorPaginationMeta
        | undefined;
      return {
        resources: raw.resources.map(mapRawAlertToDetails),
        pagination: {
          after: pagination?.after,
          limit: pagination?.limit ?? limit,
        },
      };
    };
    return paginateCursor(fetchPage, { pageSize: params.limit ?? 100 });
  }

  /** Convenience wrapper around update() for the common update_status action. */
  async updateStatus(params: UpdateAlertStatusParams): Promise<ActionResult> {
    return this.update({
      compositeIds: params.compositeIds,
      actionParameters: [{ name: 'update_status', value: params.status }],
    });
  }

  async update(params: UpdateAlertParams): Promise<ActionResult> {
    return requestAction(this.http, requests.buildUpdateRequest(params));
  }
}
