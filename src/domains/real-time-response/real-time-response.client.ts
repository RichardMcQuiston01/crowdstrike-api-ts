import type {HttpClient} from '../../core/http-client';
import type {CrowdStrikeEnvelope, OffsetPaginationMeta} from '../../core/types';
import * as requests from './real-time-response.requests';
import {
  mapRawCommandExecuteResponse,
  mapRawCommandStatus,
  mapRawSession,
  type RawCommandExecuteResponse,
  type RawCommandStatus,
  type RawSession,
} from './real-time-response.mapper';
import type {
  InitSessionParams,
  RtrSession,
  ListSessionsParams,
  ListSessionsResult,
  ExecuteCommandParams,
  CommandExecuteResult,
  CommandStatusParams,
  CommandStatusResult,
} from './real-time-response.types';

export class RealTimeResponseClient {
  constructor(private readonly http: HttpClient) {}

  async initSession(params: InitSessionParams): Promise<RtrSession> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawSession>>(
      requests.buildInitSessionRequest(params),
    );
    return mapRawSession(raw.resources[0]);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.http.request(requests.buildDeleteSessionRequest(sessionId));
  }

  async listSessions(
    params: ListSessionsParams = {},
  ): Promise<ListSessionsResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildListSessionsRequest(params),
    );
    const pagination = raw.meta?.pagination as OffsetPaginationMeta | undefined;
    return {
      sessionIds: raw.resources,
      pagination: pagination ?? {
        offset: 0,
        limit: 0,
        total: raw.resources.length,
      },
    };
  }

  /** Executes a read-only RTR command (e.g. ls, ps, cat). */
  async executeCommand(
    params: ExecuteCommandParams,
  ): Promise<CommandExecuteResult> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawCommandExecuteResponse>
    >(requests.buildExecuteCommandRequest(params));
    return mapRawCommandExecuteResponse(raw.resources[0]);
  }

  /** Executes an active-responder (read/write-light) RTR command. */
  async executeActiveResponderCommand(
    params: ExecuteCommandParams,
  ): Promise<CommandExecuteResult> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawCommandExecuteResponse>
    >(requests.buildExecuteActiveResponderCommandRequest(params));
    return mapRawCommandExecuteResponse(raw.resources[0]);
  }

  async getCommandStatus(
    params: CommandStatusParams,
  ): Promise<CommandStatusResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCommandStatus>>(
      requests.buildCommandStatusRequest(params),
    );
    return mapRawCommandStatus(raw.resources[0]);
  }

  async getActiveResponderCommandStatus(
    params: CommandStatusParams,
  ): Promise<CommandStatusResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCommandStatus>>(
      requests.buildActiveResponderCommandStatusRequest(params),
    );
    return mapRawCommandStatus(raw.resources[0]);
  }
}
