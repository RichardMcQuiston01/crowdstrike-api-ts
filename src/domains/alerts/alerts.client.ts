import type { HttpClient } from '../../core/http-client';
import { paginateCursor, type CursorPageFetcher } from '../../core/pagination';
import type {
  CrowdStrikeEnvelope,
  CursorPaginationMeta,
  OffsetPaginationMeta,
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
    const pagination = raw.meta?.pagination as OffsetPaginationMeta | undefined;
    return {
      compositeIds: raw.resources,
      pagination: pagination ?? {
        offset: 0,
        limit: 0,
        total: raw.resources.length,
      },
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
  async updateStatus(params: UpdateAlertStatusParams): Promise<void> {
    await this.update({
      compositeIds: params.compositeIds,
      actionParameters: [{ name: 'update_status', value: params.status }],
    });
  }

  async update(params: UpdateAlertParams): Promise<void> {
    await this.http.request(requests.buildUpdateRequest(params));
  }
}
