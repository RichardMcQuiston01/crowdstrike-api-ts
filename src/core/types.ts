/** A single error entry as returned in CrowdStrike's MsaAPIError envelope. */
export interface CrowdStrikeErrorDetail {
  code: number;
  id?: string;
  message: string;
}

/** Pagination metadata for offset/limit based list endpoints (MsaPaging). */
export interface OffsetPaginationMeta {
  offset: number;
  limit: number;
  total: number;
}

/** Pagination metadata for cursor/after-token based list endpoints. */
export interface CursorPaginationMeta {
  after?: string;
  limit: number;
}

/** Shared response metadata block (MsaMetaInfo) attached to most CrowdStrike responses. */
export interface CrowdStrikeResponseMeta {
  queryTime?: number;
  poweredBy?: string;
  traceId?: string;
  pagination?: OffsetPaginationMeta | CursorPaginationMeta;
}

/** The raw envelope shape CrowdStrike wraps every API response in (MsaQueryResponse). */
export interface CrowdStrikeEnvelope<TResource> {
  resources: TResource[];
  errors?: CrowdStrikeErrorDetail[];
  meta?: CrowdStrikeResponseMeta;
}
