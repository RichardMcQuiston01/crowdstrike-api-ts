import {describe, it, expect, mock} from 'bun:test';
import {OAuth2TokenManager} from './auth';
import {CrowdStrikeAuthConfigError} from './errors';
import type {Oauth2Client} from '../domains/oauth2/oauth2.client';
import type {FalconClientConfig} from '../config';

function fakeOauth2Client(
  createToken: Oauth2Client['createToken'],
): Oauth2Client {
  return {createToken} as unknown as Oauth2Client;
}

function config(
  overrides: Partial<FalconClientConfig> = {},
): FalconClientConfig {
  return {clientId: 'id', clientSecret: 'secret', ...overrides};
}

describe('OAuth2TokenManager', () => {
  it('throws CrowdStrikeAuthConfigError synchronously if credentials are missing', () => {
    const oauth2Client = fakeOauth2Client(mock());
    expect(
      () => new OAuth2TokenManager(config({clientId: ''}), oauth2Client),
    ).toThrow(CrowdStrikeAuthConfigError);
  });

  it('fetches a token on first call and caches it for subsequent calls', async () => {
    const createToken = mock(async () => ({
      accessToken: 'token-1',
      expiresIn: 1800,
    }));
    const manager = new OAuth2TokenManager(
      config(),
      fakeOauth2Client(createToken),
    );

    const first = await manager.getToken();
    const second = await manager.getToken();

    expect(first).toBe('token-1');
    expect(second).toBe('token-1');
    expect(createToken).toHaveBeenCalledTimes(1);
  });

  it('passes clientId/clientSecret/memberCid through to the oauth2 client', async () => {
    const createToken = mock(async () => ({
      accessToken: 'token-1',
      expiresIn: 1800,
    }));
    const manager = new OAuth2TokenManager(
      config({memberCid: 'child-cid'}),
      fakeOauth2Client(createToken),
    );

    await manager.getToken();

    expect(createToken).toHaveBeenCalledWith({
      clientId: 'id',
      clientSecret: 'secret',
      memberCid: 'child-cid',
    });
  });

  it('refetches once the cached token has expired (within the skew window)', async () => {
    const createToken = mock(async () => ({
      accessToken: 'token-1',
      expiresIn: 0,
    }));
    const manager = new OAuth2TokenManager(
      config(),
      fakeOauth2Client(createToken),
    );

    await manager.getToken();
    await manager.getToken();

    expect(createToken).toHaveBeenCalledTimes(2);
  });

  it('refetches immediately after invalidate() is called', async () => {
    const createToken = mock(async () => ({
      accessToken: 'token-1',
      expiresIn: 1800,
    }));
    const manager = new OAuth2TokenManager(
      config(),
      fakeOauth2Client(createToken),
    );

    await manager.getToken();
    manager.invalidate();
    await manager.getToken();

    expect(createToken).toHaveBeenCalledTimes(2);
  });

  it('de-duplicates concurrent getToken() calls into a single in-flight fetch', async () => {
    let resolveFetch!: (value: {
      accessToken: string;
      expiresIn: number;
    }) => void;
    const createToken = mock(
      () =>
        new Promise<{accessToken: string; expiresIn: number}>(resolve => {
          resolveFetch = resolve;
        }),
    );
    const manager = new OAuth2TokenManager(
      config(),
      fakeOauth2Client(createToken),
    );

    const first = manager.getToken();
    const second = manager.getToken();
    resolveFetch({accessToken: 'token-1', expiresIn: 1800});

    expect(await first).toBe('token-1');
    expect(await second).toBe('token-1');
    expect(createToken).toHaveBeenCalledTimes(1);
  });
});
