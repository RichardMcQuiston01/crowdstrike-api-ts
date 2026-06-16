import {describe, it, expect, mock} from 'bun:test';
import {FalconClient} from './client';
import {FalconRegion} from './config';
import {CrowdStrikeAuthConfigError} from './core/errors';
import {HostsClient} from './domains/hosts/hosts.client';
import {CustomIoaClient} from './domains/custom-ioa/custom-ioa.client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
}

describe('FalconClient', () => {
  it('throws CrowdStrikeAuthConfigError synchronously if credentials are missing', () => {
    expect(
      () => new FalconClient({clientId: '', clientSecret: 'secret'}),
    ).toThrow(CrowdStrikeAuthConfigError);
  });

  it('exposes every domain client as a readonly property', () => {
    const client = new FalconClient({
      clientId: 'id',
      clientSecret: 'secret',
      fetch: mock(async () => jsonResponse({})) as unknown as typeof fetch,
    });

    expect(client.hosts).toBeInstanceOf(HostsClient);
    expect(client.hostGroups).toBeDefined();
    expect(client.cases).toBeDefined();
    expect(client.alerts).toBeDefined();
    expect(client.realTimeResponse).toBeDefined();
    expect(client.realTimeResponseAdmin).toBeDefined();
    expect(client.containerVulnerabilities).toBeDefined();
    expect(client.intel).toBeDefined();
    expect(client.ioc).toBeDefined();
    expect(client.cloudSecurity).toBeDefined();
    expect(client.identityProtection).toBeDefined();
    expect(client.sensorDownload).toBeDefined();
    expect(client.preventionPolicies).toBeDefined();
    expect(client.users).toBeDefined();
    expect(client.discover).toBeDefined();
    expect(client.customIoa).toBeInstanceOf(CustomIoaClient);
  });

  it('fetches a token from the configured region and attaches it to subsequent requests', async () => {
    const calls: [string, RequestInit][] = [];
    const fetchImpl = mock(async (url: string, init: RequestInit) => {
      calls.push([url, init]);
      if (calls.length === 1) {
        return jsonResponse({access_token: 'token-1', expires_in: 1800});
      }
      return jsonResponse({resources: ['host-1'], meta: {pagination: {}}});
    });

    const client = new FalconClient({
      clientId: 'id',
      clientSecret: 'secret',
      baseUrl: FalconRegion.EU1,
      fetch: fetchImpl as unknown as typeof fetch,
    });

    await client.hosts.search();

    expect(calls).toHaveLength(2);
    const [tokenUrl, tokenInit] = calls[0];
    expect(tokenUrl).toBe('https://api.eu-1.crowdstrike.com/oauth2/token');
    expect((tokenInit.headers as Headers).has('Authorization')).toBe(false);

    const [hostsUrl, hostsInit] = calls[1];
    expect(
      hostsUrl.startsWith('https://api.eu-1.crowdstrike.com/devices/'),
    ).toBe(true);
    expect((hostsInit.headers as Headers).get('Authorization')).toBe(
      'Bearer token-1',
    );
  });

  it('defaults to the US1 region when no baseUrl is configured', async () => {
    let call = 0;
    const fetchImpl = mock(async () => {
      call += 1;
      return call === 1
        ? jsonResponse({access_token: 'token-1', expires_in: 1800})
        : jsonResponse({resources: []});
    });
    const client = new FalconClient({
      clientId: 'id',
      clientSecret: 'secret',
      fetch: fetchImpl as unknown as typeof fetch,
    });

    await client.customIoa.getPatterns(['p1']);

    const [url] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url.startsWith('https://api.crowdstrike.com/oauth2/token')).toBe(
      true,
    );
  });
});
