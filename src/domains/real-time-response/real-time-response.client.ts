import type { HttpClient } from '../../core/http-client';
import { requestFirst } from '../../core/resources';
import type {
  CrowdStrikeEnvelope,
  OffsetPaginationMeta,
} from '../../core/types';
import { RtrSequenceTracker } from './rtr-sequence';
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
  constructor(
    private readonly http: HttpClient,
    private readonly sequence: RtrSequenceTracker = new RtrSequenceTracker(),
  ) {}

  async initSession(params: InitSessionParams): Promise<RtrSession> {
    return mapRawSession(
      await requestFirst<RawSession>(
        this.http,
        requests.buildInitSessionRequest(params),
      ),
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.http.request(requests.buildDeleteSessionRequest(sessionId));
    this.sequence.reset(sessionId);
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
    const id = this.sequence.claim(params.sessionId, params.id);
    return mapRawCommandExecuteResponse(
      await requestFirst<RawCommandExecuteResponse>(
        this.http,
        requests.buildExecuteCommandRequest({ ...params, id }),
      ),
      id,
    );
  }

  /** Executes an active-responder (read/write-light) RTR command. */
  async executeActiveResponderCommand(
    params: ExecuteCommandParams,
  ): Promise<CommandExecuteResult> {
    const id = this.sequence.claim(params.sessionId, params.id);
    return mapRawCommandExecuteResponse(
      await requestFirst<RawCommandExecuteResponse>(
        this.http,
        requests.buildExecuteActiveResponderCommandRequest({ ...params, id }),
      ),
      id,
    );
  }

  async getCommandStatus(
    params: CommandStatusParams,
  ): Promise<CommandStatusResult> {
    return mapRawCommandStatus(
      await requestFirst<RawCommandStatus>(
        this.http,
        requests.buildCommandStatusRequest(params),
      ),
    );
  }

  async getActiveResponderCommandStatus(
    params: CommandStatusParams,
  ): Promise<CommandStatusResult> {
    return mapRawCommandStatus(
      await requestFirst<RawCommandStatus>(
        this.http,
        requests.buildActiveResponderCommandStatusRequest(params),
      ),
    );
  }
}
