import {describe, it, expect, mock} from 'bun:test';
import {Oauth2Client} from './oauth2.client';
import type {HttpClient} from '../../core/http-client';

function fakeHttpClient(response: unknown): HttpClient {
  return {request: mock(async () => response)} as unknown as HttpClient;
}

describe('Oauth2Client', () => {
  describe('createToken', () => {
    it('posts client_id/client_secret as a form-encoded body', async () => {
      const http = fakeHttpClient({access_token: 'abc', expires_in: 1800});
      const client = new Oauth2Client(http);

      await client.createToken({clientId: 'id', clientSecret: 'secret'});

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/oauth2/token',
        body: {client_id: 'id', client_secret: 'secret'},
        bodyEncoding: 'form',
      });
    });

    it('includes member_cid in the body when supplied', async () => {
      const http = fakeHttpClient({access_token: 'abc', expires_in: 1800});
      const client = new Oauth2Client(http);

      await client.createToken({
        clientId: 'id',
        clientSecret: 'secret',
        memberCid: 'child-cid',
      });

      expect(http.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/oauth2/token',
        body: {
          client_id: 'id',
          client_secret: 'secret',
          member_cid: 'child-cid',
        },
        bodyEncoding: 'form',
      });
    });

    it('maps the raw snake_case response to a camelCase OAuth2TokenResult', async () => {
      const http = fakeHttpClient({
        access_token: 'abc',
        expires_in: 1800,
        token_type: 'bearer',
      });
      const client = new Oauth2Client(http);

      const result = await client.createToken({
        clientId: 'id',
        clientSecret: 'secret',
      });

      expect(result).toEqual({
        accessToken: 'abc',
        expiresIn: 1800,
        tokenType: 'bearer',
      });
    });

    it('defaults expiresIn to 1800 seconds when the response omits it', async () => {
      const http = fakeHttpClient({access_token: 'abc'});
      const client = new Oauth2Client(http);

      const result = await client.createToken({
        clientId: 'id',
        clientSecret: 'secret',
      });

      expect(result.expiresIn).toBe(1800);
    });
  });
});
