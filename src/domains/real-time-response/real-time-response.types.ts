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
  /**
   * Sequence id for this command. When omitted the client assigns the next
   * unused id for the session (0, 1, 2, ...), shared across the read-only,
   * active-responder, and admin execute methods.
   */
  id?: number;
}

export interface CommandExecuteResult {
  cloudRequestId: string;
  /** Sequence id sent with the command; pass it to the matching get...CommandStatus call. */
  sequenceId: number;
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
