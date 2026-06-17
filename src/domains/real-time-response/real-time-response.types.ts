export interface InitSessionParams {
  deviceId: string;
  /** Defaults to empty string, matching CrowdStrike's default. */
  origin?: string;
  queueOffline?: boolean;
}

export interface RtrSession {
  sessionId: string;
  deviceId?: string;
  createdAt?: string;
  existingAidSessions: number;
  offlineQueued: boolean;
  platform?: string;
  pwd?: string;
  raw: Record<string, unknown>;
}

export interface ListSessionsParams {
  offset?: number;
  limit?: number;
  sort?: string;
  filter?: string;
}

export interface ListSessionsResult {
  sessionIds: string[];
  pagination: { offset: number; limit: number; total: number };
}

export interface ExecuteCommandParams {
  sessionId: string;
  deviceId: string;
  baseCommand: string;
  commandString: string;
  persist?: boolean;
  /** Client-supplied sequence id for this command; defaults to 0. */
  id?: number;
}

export interface CommandExecuteResult {
  cloudRequestId: string;
  sessionId: string;
  queuedCommandOffline: boolean;
}

export interface CommandStatusParams {
  cloudRequestId: string;
  sequenceId: number;
}

export interface CommandStatusResult {
  sessionId: string;
  complete: boolean;
  stdout: string;
  stderr: string;
  baseCommand?: string;
  taskId?: string;
}
