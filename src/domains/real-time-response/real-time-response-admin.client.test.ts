import { describe, it, expect, mock } from 'bun:test';
import { RealTimeResponseAdminClient } from './real-time-response-admin.client';
import type { HttpClient } from '../../core/http-client';
import executeCommandFixture from './__fixtures__/execute-command-response.json';
import commandStatusFixture from './__fixtures__/command-status-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return { request } as unknown as HttpClient;
}

describe('RealTimeResponseAdminClient', () => {
  describe('executeAdminCommand', () => {
    it('posts to the admin-command path and maps the response', async () => {
      const http = fakeHttpClient(executeCommandFixture);
      const admin = new RealTimeResponseAdminClient(http);

      const result = await admin.executeAdminCommand({
        sessionId: 'session-abc',
        deviceId: 'abc123',
        baseCommand: 'put',
        commandString: 'put script.ps1',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/real-time-response/entities/admin-command/v1',
        body: {
          base_command: 'put',
          command_string: 'put script.ps1',
          device_id: 'abc123',
          id: 0,
          persist: false,
          session_id: 'session-abc',
        },
      });
      expect(result.cloudRequestId).toBe('req-123');
    });
  });

  describe('getAdminCommandStatus', () => {
    it('sends a GET to the admin-command status path', async () => {
      const http = fakeHttpClient(commandStatusFixture);
      const admin = new RealTimeResponseAdminClient(http);

      const result = await admin.getAdminCommandStatus({
        cloudRequestId: 'req-123',
        sequenceId: 0,
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/real-time-response/entities/admin-command/v1',
        query: { cloud_request_id: 'req-123', sequence_id: 0 },
      });
      expect(result.complete).toBe(true);
    });
  });
});
