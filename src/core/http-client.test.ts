import {describe, it, expect, mock} from 'bun:test';
import {HttpClient, type TokenProvider} from './http-client';
import {CrowdStrikeApiError, CrowdStrikeNetworkError} from './errors';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  });
}

type FetchCall = [string, RequestInit];

function lastCall(fetchImpl: ReturnType<typeof mock>): FetchCall {
  return fetchImpl.mock.calls[0] as unknown as FetchCall;
}

function fakeTokenProvider(token = 'token-1'): TokenProvider {
  let current = token;
  return {
    getToken: mock(async () => current),
    invalidate: mock(() => {
      current = `${current}-refreshed`;
    }),
  };
}

describe('HttpClient', () => {
  describe('request building', () => {
    it('builds the URL with query params, including arrays as repeated keys', async () => {
      const fetchImpl = mock(async () => jsonResponse({resources: []}));
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        null,
        fetchImpl as unknown as typeof fetch,
      );

      await http.request({
        method: 'GET',
        path: '/devices/queries/devices/v1',
        query: {
          filter: "platform_name:'Windows'",
          limit: 50,
          ids: ['a', 'b'],
          skip: undefined,
        },
      });

      const [url] = lastCall(fetchImpl);
      const parsed = new URL(url);
      expect(parsed.origin + parsed.pathname).toBe(
        'https://api.crowdstrike.com/devices/queries/devices/v1',
      );
      expect(parsed.searchParams.get('filter')).toBe("platform_name:'Windows'");
      expect(parsed.searchParams.get('limit')).toBe('50');
      expect(parsed.searchParams.getAll('ids')).toEqual(['a', 'b']);
      expect(parsed.searchParams.has('skip')).toBe(false);
    });

    it('JSON-encodes the body by default', async () => {
      const fetchImpl = mock(async () => jsonResponse({resources: []}));
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        null,
        fetchImpl as unknown as typeof fetch,
      );

      await http.request({method: 'POST', path: '/x', body: {ids: ['a']}});

      const [, init] = lastCall(fetchImpl);
      expect(init.body).toBe(JSON.stringify({ids: ['a']}));
      expect((init.headers as Headers).get('Content-Type')).toBe(
        'application/json',
      );
    });

    it('form-encodes the body when bodyEncoding is form', async () => {
      const fetchImpl = mock(async () => jsonResponse({access_token: 'abc'}));
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        null,
        fetchImpl as unknown as typeof fetch,
      );

      await http.request({
        method: 'POST',
        path: '/oauth2/token',
        body: {client_id: 'id', client_secret: 'secret'},
        bodyEncoding: 'form',
      });

      const [, init] = lastCall(fetchImpl);
      expect(init.body).toBe('client_id=id&client_secret=secret');
      expect((init.headers as Headers).get('Content-Type')).toBe(
        'application/x-www-form-urlencoded',
      );
    });
  });

  describe('authorization', () => {
    it('attaches a bearer token when a token provider is supplied', async () => {
      const fetchImpl = mock(async () => jsonResponse({resources: []}));
      const tokenProvider = fakeTokenProvider('my-token');
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        tokenProvider,
        fetchImpl as unknown as typeof fetch,
      );

      await http.request({method: 'GET', path: '/x'});

      const [, init] = lastCall(fetchImpl);
      expect((init.headers as Headers).get('Authorization')).toBe(
        'Bearer my-token',
      );
    });

    it('omits the Authorization header when no token provider is supplied', async () => {
      const fetchImpl = mock(async () => jsonResponse({resources: []}));
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        null,
        fetchImpl as unknown as typeof fetch,
      );

      await http.request({method: 'GET', path: '/x'});

      const [, init] = lastCall(fetchImpl);
      expect((init.headers as Headers).has('Authorization')).toBe(false);
    });
  });

  describe('401 retry', () => {
    it('invalidates the token and retries once on a 401', async () => {
      let call = 0;
      const fetchImpl = mock(async () => {
        call += 1;
        return call === 1
          ? jsonResponse({errors: []}, 401)
          : jsonResponse({resources: ['ok']});
      });
      const tokenProvider = fakeTokenProvider('stale-token');
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        tokenProvider,
        fetchImpl as unknown as typeof fetch,
      );

      const result = await http.request<{resources: string[]}>({
        method: 'GET',
        path: '/x',
      });

      expect(result.resources).toEqual(['ok']);
      expect(tokenProvider.invalidate).toHaveBeenCalledTimes(1);
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it('does not retry a second time if the retried request also 401s', async () => {
      const fetchImpl = mock(async () => jsonResponse({errors: []}, 401));
      const tokenProvider = fakeTokenProvider();
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        tokenProvider,
        fetchImpl as unknown as typeof fetch,
      );

      await expect(http.request({method: 'GET', path: '/x'})).rejects.toThrow(
        CrowdStrikeApiError,
      );
      expect(fetchImpl).toHaveBeenCalledTimes(2);
    });
  });

  describe('error mapping', () => {
    it('throws CrowdStrikeApiError with status/errors/traceId on a non-2xx response', async () => {
      const fetchImpl = mock(async () =>
        jsonResponse(
          {
            errors: [{code: 403, message: 'access denied'}],
            meta: {trace_id: 'trace-123'},
          },
          403,
        ),
      );
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        null,
        fetchImpl as unknown as typeof fetch,
      );

      const error = (await http
        .request({method: 'GET', path: '/x'})
        .catch(e => e)) as CrowdStrikeApiError;
      expect(error).toBeInstanceOf(CrowdStrikeApiError);
      expect(error.status).toBe(403);
      expect(error.traceId).toBe('trace-123');
      expect(error.errors).toEqual([{code: 403, message: 'access denied'}]);
      expect(error.isAuthError).toBe(true);
    });

    it('wraps fetch-level failures in CrowdStrikeNetworkError', async () => {
      const fetchImpl = mock(async () => {
        throw new Error('ECONNRESET');
      });
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        null,
        fetchImpl as unknown as typeof fetch,
      );

      await expect(http.request({method: 'GET', path: '/x'})).rejects.toThrow(
        CrowdStrikeNetworkError,
      );
    });
  });

  describe('response handling', () => {
    it('returns undefined for a 204 No Content response', async () => {
      const fetchImpl = mock(async () => new Response(null, {status: 204}));
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        null,
        fetchImpl as unknown as typeof fetch,
      );

      const result = await http.request({method: 'DELETE', path: '/x'});
      expect(result).toBeUndefined();
    });

    it('returns the parsed JSON body on success', async () => {
      const fetchImpl = mock(async () => jsonResponse({resources: ['a', 'b']}));
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        null,
        fetchImpl as unknown as typeof fetch,
      );

      const result = await http.request<{resources: string[]}>({
        method: 'GET',
        path: '/x',
      });
      expect(result.resources).toEqual(['a', 'b']);
    });

    it('returns a Blob when responseType is blob', async () => {
      const fetchImpl = mock(
        async () =>
          new Response(new Blob(['binary-content']), {
            status: 200,
            headers: {'Content-Type': 'application/octet-stream'},
          }),
      );
      const http = new HttpClient(
        'https://api.crowdstrike.com',
        null,
        fetchImpl as unknown as typeof fetch,
      );

      const result = await http.request<Blob>({
        method: 'GET',
        path: '/sensors/entities/download-installer/v3',
        responseType: 'blob',
      });
      expect(result).toBeInstanceOf(Blob);
      expect(await result.text()).toBe('binary-content');
    });
  });
});
