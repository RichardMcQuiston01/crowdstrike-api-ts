import type {
  CommandExecuteResult,
  CommandStatusResult,
  RtrSession,
} from './real-time-response.types';

/** Raw wire shape of an RTR session (DomainInitResponse). */
export interface RawSession {
  created_at?: string;
  device_id?: string;
  existing_aid_sessions: number;
  offline_queued: boolean;
  platform?: string;
  pwd?: string;
  session_id: string;
  [key: string]: unknown;
}

/** Raw wire shape of a command execution response (DomainCommandExecuteResponse). */
export interface RawCommandExecuteResponse {
  cloud_request_id: string;
  queued_command_offline: boolean;
  session_id: string;
}

/** Raw wire shape of a command status response (DomainStatusResponse). */
export interface RawCommandStatus {
  base_command?: string;
  complete: boolean;
  session_id: string;
  stderr: string;
  stdout: string;
  task_id?: string;
}

export function mapRawSession(raw: RawSession): RtrSession {
  return {
    sessionId: raw.session_id,
    deviceId: raw.device_id,
    createdAt: raw.created_at,
    existingAidSessions: raw.existing_aid_sessions,
    offlineQueued: raw.offline_queued,
    platform: raw.platform,
    pwd: raw.pwd,
    raw,
  };
}

export function mapRawCommandExecuteResponse(
  raw: RawCommandExecuteResponse,
): CommandExecuteResult {
  return {
    cloudRequestId: raw.cloud_request_id,
    sessionId: raw.session_id,
    queuedCommandOffline: raw.queued_command_offline,
  };
}

export function mapRawCommandStatus(
  raw: RawCommandStatus,
): CommandStatusResult {
  return {
    sessionId: raw.session_id,
    complete: raw.complete,
    stdout: raw.stdout,
    stderr: raw.stderr,
    baseCommand: raw.base_command,
    taskId: raw.task_id,
  };
}
