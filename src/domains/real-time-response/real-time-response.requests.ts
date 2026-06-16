import type {RequestOptions} from '../../core/http-client';
import type {
  InitSessionParams,
  ListSessionsParams,
  ExecuteCommandParams,
  CommandStatusParams,
} from './real-time-response.types';

export function buildInitSessionRequest(
  params: InitSessionParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/real-time-response/entities/sessions/v1',
    body: {
      device_id: params.deviceId,
      origin: params.origin ?? '',
      queue_offline: params.queueOffline ?? false,
    },
  };
}

export function buildDeleteSessionRequest(sessionId: string): RequestOptions {
  return {
    method: 'DELETE',
    path: '/real-time-response/entities/sessions/v1',
    query: {session_id: sessionId},
  };
}

export function buildListSessionsRequest(
  params: ListSessionsParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/real-time-response/queries/sessions/v1',
    query: {
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
      filter: params.filter,
    },
  };
}

function buildCommandBody(params: ExecuteCommandParams) {
  return {
    base_command: params.baseCommand,
    command_string: params.commandString,
    device_id: params.deviceId,
    id: params.id ?? 0,
    persist: params.persist ?? false,
    session_id: params.sessionId,
  };
}

export function buildExecuteCommandRequest(
  params: ExecuteCommandParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/real-time-response/entities/command/v1',
    body: buildCommandBody(params),
  };
}

export function buildExecuteActiveResponderCommandRequest(
  params: ExecuteCommandParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/real-time-response/entities/active-responder-command/v1',
    body: buildCommandBody(params),
  };
}

export function buildExecuteAdminCommandRequest(
  params: ExecuteCommandParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/real-time-response/entities/admin-command/v1',
    body: buildCommandBody(params),
  };
}

function buildStatusQuery(params: CommandStatusParams) {
  return {
    cloud_request_id: params.cloudRequestId,
    sequence_id: params.sequenceId,
  };
}

export function buildCommandStatusRequest(
  params: CommandStatusParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/real-time-response/entities/command/v1',
    query: buildStatusQuery(params),
  };
}

export function buildActiveResponderCommandStatusRequest(
  params: CommandStatusParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/real-time-response/entities/active-responder-command/v1',
    query: buildStatusQuery(params),
  };
}

export function buildAdminCommandStatusRequest(
  params: CommandStatusParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/real-time-response/entities/admin-command/v1',
    query: buildStatusQuery(params),
  };
}
