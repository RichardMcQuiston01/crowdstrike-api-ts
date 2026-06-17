import type { AlertDetails } from './alerts.types';

/** Raw wire shape of a CrowdStrike alert (DetectsExternalAlert) - subset used here. */
export interface RawAlert {
  composite_id: string;
  severity: number;
  severity_name?: string;
  status: string;
  assigned_to_name?: string;
  assigned_to_uuid?: string;
  tactic?: string;
  technique?: string;
  created_timestamp?: string;
  updated_timestamp?: string;
  agent_id?: string;
  platform?: string;
  [key: string]: unknown;
}

export function mapRawAlertToDetails(raw: RawAlert): AlertDetails {
  return {
    compositeId: raw.composite_id,
    severity: raw.severity,
    severityName: raw.severity_name,
    status: raw.status,
    assignedToName: raw.assigned_to_name,
    assignedToUuid: raw.assigned_to_uuid,
    tactic: raw.tactic,
    technique: raw.technique,
    createdTimestamp: raw.created_timestamp,
    updatedTimestamp: raw.updated_timestamp,
    agentId: raw.agent_id,
    platform: raw.platform,
    raw,
  };
}
