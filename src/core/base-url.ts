import { CrowdStrikeAuthConfigError } from './errors';

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Validates a configured Falcon base URL before any credentials are sent to it
 * and returns its normalized origin. Rejects userinfo (which changes the host a
 * request is actually sent to), non-HTTPS schemes, and anything that is not a
 * bare origin. Plain HTTP is only accepted for loopback hosts, and only when
 * the caller explicitly opts in.
 */
export function validateBaseUrl(
  baseUrl: string,
  allowInsecureLoopback = false,
): string {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch (cause) {
    throw new CrowdStrikeAuthConfigError(
      `FalconClientConfig.baseUrl "${baseUrl}" is not a valid absolute URL: ${String(cause)}`,
    );
  }

  if (parsed.username || parsed.password) {
    throw new CrowdStrikeAuthConfigError(
      `FalconClientConfig.baseUrl must not contain credentials (userinfo); received a URL whose host resolves to "${parsed.hostname}".`,
    );
  }

  if (parsed.protocol !== 'https:') {
    const isLoopbackHttp =
      parsed.protocol === 'http:' && LOOPBACK_HOSTNAMES.has(parsed.hostname);
    if (!(isLoopbackHttp && allowInsecureLoopback)) {
      throw new CrowdStrikeAuthConfigError(
        `FalconClientConfig.baseUrl must use https: (received "${parsed.protocol}"). ` +
          'Plain http: is only allowed for localhost/127.0.0.1/[::1] with allowInsecureLoopback set to true.',
      );
    }
  }

  if (
    (parsed.pathname !== '/' && parsed.pathname !== '') ||
    parsed.search ||
    parsed.hash
  ) {
    throw new CrowdStrikeAuthConfigError(
      'FalconClientConfig.baseUrl must be a bare origin (scheme and host only), without a path, query string, or fragment.',
    );
  }

  return parsed.origin;
}

/**
 * Ensures a request path is a single absolute path on the configured origin so
 * it can never redirect the bearer token to another host.
 */
export function assertSafeRequestPath(path: string): void {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new CrowdStrikeAuthConfigError(
      `Request path "${path}" must start with a single "/" and must not be protocol-relative or contain backslashes.`,
    );
  }
}
