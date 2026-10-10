import { describe, it, expect, mock } from 'bun:test';
import { RtrSequenceTracker } from './rtr-sequence';
import { RealTimeResponseClient } from './real-time-response.client';
import { RealTimeResponseAdminClient } from './real-time-response-admin.client';
import type { HttpClient } from '../../core/http-client';
import executeCommandFixture from './__fixtures__/execute-command-response.json';

function fakeHttpClient(): HttpClient {
  const request = mock(async () => executeCommandFixture);
  return { request } as unknown as HttpClient;
}

function sentIds(http: HttpClient): number[] {
  return (
    (http.request as unknown as ReturnType<typeof mock>).mock
      .calls as unknown as Array<[{ body: { id: number } }]>
  ).map(([options]) => options.body.id);
}

const base = {
  sessionId: 'session-abc',
  deviceId: 'abc123',
  baseCommand: 'ls',
  commandString: 'ls',
};

describe('RtrSequenceTracker', () => {
  it('hands out 0, 1, 2 per session independently', () => {
    const tracker = new RtrSequenceTracker();
    expect([
      tracker.claim('a'),
      tracker.claim('a'),
      tracker.claim('b'),
    ]).toEqual([0, 1, 0]);
  });

  it('honors an explicit id and moves past it', () => {
    const tracker = new RtrSequenceTracker();
    expect(tracker.claim('a', 5)).toBe(5);
    expect(tracker.claim('a')).toBe(6);
    expect(tracker.claim('a', 2)).toBe(2);
    expect(tracker.claim('a')).toBe(7);
  });

  it('restarts a session at 0 after reset', () => {
    const tracker = new RtrSequenceTracker();
    tracker.claim('a');
    tracker.reset('a');
    expect(tracker.claim('a')).toBe(0);
  });
});

describe('RTR execute sequence ids', () => {
  it('does not reuse id 0 for a second command on the same session', async () => {
    const http = fakeHttpClient();
    const rtr = new RealTimeResponseClient(http);

    const first = await rtr.executeCommand(base);
    const second = await rtr.executeCommand({ ...base, commandString: 'ps' });

    expect(sentIds(http)).toEqual([0, 1]);
    expect([first.sequenceId, second.sequenceId]).toEqual([0, 1]);
  });

  it('shares one counter across read-only, active-responder, and admin commands', async () => {
    const http = fakeHttpClient();
    const tracker = new RtrSequenceTracker();
    const rtr = new RealTimeResponseClient(http, tracker);
    const admin = new RealTimeResponseAdminClient(http, tracker);

    await rtr.executeCommand(base);
    await rtr.executeActiveResponderCommand(base);
    await admin.executeAdminCommand(base);

    expect(sentIds(http)).toEqual([0, 1, 2]);
  });

  it('uses an explicit id as given and continues after it', async () => {
    const http = fakeHttpClient();
    const rtr = new RealTimeResponseClient(http);

    await rtr.executeCommand({ ...base, id: 10 });
    await rtr.executeCommand(base);

    expect(sentIds(http)).toEqual([10, 11]);
  });

  it('restarts numbering once the session is deleted', async () => {
    const http = fakeHttpClient();
    const rtr = new RealTimeResponseClient(http);

    await rtr.executeCommand(base);
    await rtr.deleteSession('session-abc');
    await rtr.executeCommand(base);

    const bodies = (
      (http.request as unknown as ReturnType<typeof mock>).mock
        .calls as unknown as Array<[{ body?: { id: number } }]>
    ).map(([options]) => options.body?.id);
    expect(bodies).toEqual([0, undefined, 0]);
  });
});
