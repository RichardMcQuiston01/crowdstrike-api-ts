import { describe, it, expect, mock } from 'bun:test';
import { HttpClient } from './http-client';
import { CrowdStrikeAuthConfigError } from './errors';
import { validateBaseUrl } from './base-url';

describe('validateBaseUrl', () => {
  it('accepts an https origin and normalizes a trailing slash', () => {
    expect(validateBaseUrl('https://api.crowdstrike.com/')).toBe(
      'https://api.crowdstrike.com',
    );
  });

  it('rejects userinfo that would swap the real host', () => {
    expect(() =>
      validateBaseUrl('https://api.crowdstrike.com@evil.example'),
    ).toThrow(CrowdStrikeAuthConfigError);
  });

  it('rejects plain http by default', () => {
    expect(() => validateBaseUrl('http://api.crowdstrike.com')).toThrow(
      /https/,
    );
  });

  it('rejects http loopback without the explicit opt-in', () => {
    expect(() => validateBaseUrl('http://localhost:8080')).toThrow(
      CrowdStrikeAuthConfigError,
    );
  });

  it('accepts http loopback with the opt-in', () => {
    expect(validateBaseUrl('http://localhost:8080', true)).toBe(
      'http://localhost:8080',
    );
  });

  it('rejects http on a non-loopback host even with the opt-in', () => {
    expect(() => validateBaseUrl('http://evil.example', true)).toThrow(
      CrowdStrikeAuthConfigError,
    );
  });

  it('rejects base URLs carrying a path or query', () => {
    expect(() => validateBaseUrl('https://api.crowdstrike.com/x')).toThrow(
      /bare origin/,
    );
  });

  it('rejects values that are not URLs', () => {
    expect(() => validateBaseUrl('not a url')).toThrow(
      CrowdStrikeAuthConfigError,
    );
  });
});

describe('HttpClient request path safety', () => {
  const makeClient = () => {
    const fetchImpl = mock(async () => new Response('{}'));
    const http = new HttpClient(
      'https://api.crowdstrike.com',
      null,
      fetchImpl as unknown as typeof fetch,
    );
    return { fetchImpl, http };
  };

  it.each(['//evil.example/steal', 'https://evil.example/steal', 'relative'])(
    'rejects path %s without calling fetch',
    async (path) => {
      const { fetchImpl, http } = makeClient();
      await expect(http.request({ method: 'GET', path })).rejects.toThrow(
        CrowdStrikeAuthConfigError,
      );
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it('rejects an insecure base URL at construction', () => {
    expect(
      () => new HttpClient('http://api.crowdstrike.com', null, fetch),
    ).toThrow(CrowdStrikeAuthConfigError);
  });
});
