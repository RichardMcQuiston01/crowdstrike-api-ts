import { describe, it, expect } from 'bun:test';
import { FalconClient, FalconRegion, CrowdStrikeApiError } from './index';

describe('public barrel', () => {
  it('exposes a working FalconClient and core exports', () => {
    const client = new FalconClient({
      clientId: 'id',
      clientSecret: 'secret',
      baseUrl: FalconRegion.US2,
    });

    expect(client.hosts).toBeDefined();
    expect(client.custom.hostsWithGroups).toBeDefined();
    expect(CrowdStrikeApiError).toBeDefined();
  });
});
