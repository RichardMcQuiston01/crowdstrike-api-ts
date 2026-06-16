import type {HttpClient} from '../../core/http-client';
import type {CrowdStrikeEnvelope} from '../../core/types';
import * as requests from './real-time-response.requests';
import {
  mapRawCommandExecuteResponse,
  mapRawCommandStatus,
  type RawCommandExecuteResponse,
  type RawCommandStatus,
} from './real-time-response.mapper';
import type {
  ExecuteCommandParams,
  CommandExecuteResult,
  CommandStatusParams,
  CommandStatusResult,
} from './real-time-response.types';

/** Write-access RTR commands (e.g. put, run, restart) requiring the RTR Admin role. */
export class RealTimeResponseAdminClient {
  constructor(private readonly http: HttpClient) {}

  async executeAdminCommand(
    params: ExecuteCommandParams,
  ): Promise<CommandExecuteResult> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawCommandExecuteResponse>
    >(requests.buildExecuteAdminCommandRequest(params));
    return mapRawCommandExecuteResponse(raw.resources[0]);
  }

  async getAdminCommandStatus(
    params: CommandStatusParams,
  ): Promise<CommandStatusResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawCommandStatus>>(
      requests.buildAdminCommandStatusRequest(params),
    );
    return mapRawCommandStatus(raw.resources[0]);
  }
}
