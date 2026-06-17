import type { CaseDetails } from './cases.types';

/** Raw wire shape of a CrowdStrike case (SdkCaseVM) - scalar fields only. */
export interface RawCase {
  id: string;
  cid: string;
  name: string;
  description: string;
  status: string;
  severity: number;
  reference_id: string;
  tags?: string[];
  created_timestamp: string;
  updated_timestamp: string;
  start_timestamp: string;
  end_timestamp: string;
  version: number;
  [key: string]: unknown;
}

export function mapRawCaseToDetails(raw: RawCase): CaseDetails {
  return {
    id: raw.id,
    cid: raw.cid,
    name: raw.name,
    description: raw.description,
    status: raw.status,
    severity: raw.severity,
    referenceId: raw.reference_id,
    tags: raw.tags,
    createdTimestamp: raw.created_timestamp,
    updatedTimestamp: raw.updated_timestamp,
    startTimestamp: raw.start_timestamp,
    endTimestamp: raw.end_timestamp,
    version: raw.version,
    raw,
  };
}
