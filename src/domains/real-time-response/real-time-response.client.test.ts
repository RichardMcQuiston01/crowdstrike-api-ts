import {describe, it, expect, mock} from 'bun:test';
import {RealTimeResponseClient} from './real-time-response.client';
import type {HttpClient} from '../../core/http-client';
import initSessionFixture from './__fixtures__/init-session-response.json';
import executeCommandFixture from './__fixtures__/execute-command-response.json';
import commandStatusFixture from './__fixtures__/command-status-response.json';

function fakeHttpClient(...responses: unknown[]): HttpClient {
  const request = mock(async () => responses.shift());
  return {request} as unknown as HttpClient;
}

describe('RealTimeResponseClient', () => {
  describe('initSession', () => {
    it('posts device_id/origin/queue_offline and maps the response', async () => {
      const http = fakeHttpClient(initSessionFixture);
      const rtr = new RealTimeResponseClient(http);

      const session = await rtr.initSession({deviceId: 'abc123'});

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/real-time-response/entities/sessions/v1',
        body: {device_id: 'abc123', origin: '', queue_offline: false},
      });
      expect(session.sessionId).toBe('session-abc');
      expect(session.platform).toBe('Windows');
    });
  });

  describe('deleteSession', () => {
    it('sends a DELETE with session_id as a query param', async () => {
      const http = fakeHttpClient(undefined);
      const rtr = new RealTimeResponseClient(http);

      await rtr.deleteSession('session-abc');

      expect(http.request).toHaveBeenCalledWith({
        method: 'DELETE',
        path: '/real-time-response/entities/sessions/v1',
        query: {session_id: 'session-abc'},
      });
    });
  });

  describe('listSessions', () => {
    it('sends a GET with offset/limit/sort/filter', async () => {
      const http = fakeHttpClient({
        resources: ['session-abc'],
        errors: [],
        meta: {pagination: {offset: 0, limit: 100, total: 1}},
      });
      const rtr = new RealTimeResponseClient(http);

      const result = await rtr.listSessions({limit: 100});

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/real-time-response/queries/sessions/v1',
        query: {
          offset: undefined,
          limit: 100,
          sort: undefined,
          filter: undefined,
        },
      });
      expect(result.sessionIds).toEqual(['session-abc']);
    });
  });

  describe('executeCommand', () => {
    it('posts the read-only command body and maps the response', async () => {
      const http = fakeHttpClient(executeCommandFixture);
      const rtr = new RealTimeResponseClient(http);

      const result = await rtr.executeCommand({
        sessionId: 'session-abc',
        deviceId: 'abc123',
        baseCommand: 'ls',
        commandString: 'ls',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/real-time-response/entities/command/v1',
        body: {
          base_command: 'ls',
          command_string: 'ls',
          device_id: 'abc123',
          id: 0,
          persist: false,
          session_id: 'session-abc',
        },
      });
      expect(result.cloudRequestId).toBe('req-123');
    });
  });

  describe('executeActiveResponderCommand', () => {
    it('posts to the active-responder-command path', async () => {
      const http = fakeHttpClient(executeCommandFixture);
      const rtr = new RealTimeResponseClient(http);

      await rtr.executeActiveResponderCommand({
        sessionId: 'session-abc',
        deviceId: 'abc123',
        baseCommand: 'mv',
        commandString: 'mv a.txt b.txt',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/real-time-response/entities/active-responder-command/v1',
        body: {
          base_command: 'mv',
          command_string: 'mv a.txt b.txt',
          device_id: 'abc123',
          id: 0,
          persist: false,
          session_id: 'session-abc',
        },
      });
    });
  });

  describe('getCommandStatus', () => {
    it('sends a GET with cloud_request_id/sequence_id and maps the response', async () => {
      const http = fakeHttpClient(commandStatusFixture);
      const rtr = new RealTimeResponseClient(http);

      const result = await rtr.getCommandStatus({
        cloudRequestId: 'req-123',
        sequenceId: 0,
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/real-time-response/entities/command/v1',
        query: {cloud_request_id: 'req-123', sequence_id: 0},
      });
      expect(result.complete).toBe(true);
      expect(result.stdout).toContain('file1.txt');
    });
  });

  describe('getActiveResponderCommandStatus', () => {
    it('sends a GET to the active-responder-command status path', async () => {
      const http = fakeHttpClient(commandStatusFixture);
      const rtr = new RealTimeResponseClient(http);

      await rtr.getActiveResponderCommandStatus({
        cloudRequestId: 'req-123',
        sequenceId: 0,
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'GET',
        path: '/real-time-response/entities/active-responder-command/v1',
        query: {cloud_request_id: 'req-123', sequence_id: 0},
      });
    });
  });
});
