/**
 * Runnable demo for @richardmcquiston01/crowdstrike-ts-api.
 *
 * Exercises a handful of read-only Falcon API domains against a real tenant so
 * you can verify credentials and see the friendly, camelCased shapes this
 * library returns. It is intentionally side-effect free — it only *reads*.
 *
 * Run it locally with bun:
 *   FALCON_CLIENT_ID=... FALCON_CLIENT_SECRET=... bun run examples/demo.ts
 *
 * Or containerised (see the repo README "Running the demo in Docker"):
 *   docker compose run --rm demo
 *
 * Configuration is read entirely from environment variables:
 *   FALCON_CLIENT_ID      (required) OAuth2 client ID from the Falcon console
 *   FALCON_CLIENT_SECRET  (required) OAuth2 client secret
 *   FALCON_BASE_URL       (optional) region key (US1|US2|EU1|USGOV1) or a raw
 *                                    base URL. Defaults to US1.
 *   FALCON_MEMBER_CID     (optional) MSSP child CID to act on behalf of
 *   DEMO_LIMIT            (optional) page size for the sample queries (max 20)
 */
import {
  FalconClient,
  FalconRegion,
  CrowdStrikeApiError,
  CrowdStrikeNetworkError,
  CrowdStrikeAuthConfigError,
} from '../src/index';

/** Resolve FALCON_BASE_URL to a region enum value, or pass through a raw URL. */
function resolveBaseUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const region = (FalconRegion as Record<string, string | undefined>)[
    value.toUpperCase()
  ];
  return region ?? value;
}

/** Print a labelled section header so the output stays readable. */
function section(title: string): void {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 56 - title.length))}`);
}

/** Turn any thrown value into a single human-readable line. */
function describeError(err: unknown): string {
  if (err instanceof CrowdStrikeApiError) {
    const detail = err.errors?.[0]?.message;
    return `API error ${err.status} on ${err.requestPath}${
      detail ? ` — ${detail}` : ''
    }`;
  }
  if (err instanceof CrowdStrikeNetworkError) {
    return `Network failure — ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Run a named demo step, catching per-step failures so one missing API scope
 * doesn't abort the whole demo.
 */
async function step(name: string, fn: () => Promise<void>): Promise<void> {
  section(name);
  try {
    await fn();
  } catch (err) {
    console.warn(`  ⚠️  skipped: ${describeError(err)}`);
  }
}

async function main(): Promise<void> {
  const clientId = process.env.FALCON_CLIENT_ID;
  const clientSecret = process.env.FALCON_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      'Missing credentials. Set FALCON_CLIENT_ID and FALCON_CLIENT_SECRET ' +
        'in the environment before running the demo.',
    );
    process.exitCode = 1;
    return;
  }

  const limit = Math.min(Number(process.env.DEMO_LIMIT) || 5, 20);
  const baseUrl = resolveBaseUrl(process.env.FALCON_BASE_URL);

  console.log('CrowdStrike Falcon API — TypeScript helper demo');
  console.log(`  base URL : ${baseUrl ?? FalconRegion.US1} (default US1)`);
  console.log(`  page size: ${limit}`);

  const client = new FalconClient({
    clientId,
    clientSecret,
    baseUrl,
    memberCid: process.env.FALCON_MEMBER_CID,
  });

  await step('Hosts — recent devices', async () => {
    const hosts = await client.hosts.searchWithDetails({ limit });
    if (hosts.length === 0) {
      console.log('  (no hosts returned)');
      return;
    }
    for (const host of hosts) {
      const os = host.osVersion ?? host.platformName ?? 'unknown OS';
      console.log(
        `  • ${host.hostname ?? host.deviceId} — ${os}` +
          `${host.localIp ? ` @ ${host.localIp}` : ''}` +
          `${host.status ? ` [${host.status}]` : ''}`,
      );
    }
  });

  await step('Alerts — most recent', async () => {
    const alerts = await client.alerts.search({ limit });
    console.log(`  matched ${alerts.pagination.total} alert(s) total`);
    console.log(`  showing ${alerts.compositeIds.length} composite ID(s)`);
  });

  await step('Users — tenant members', async () => {
    const { ids } = await client.users.searchIds({ limit });
    if (ids.length === 0) {
      console.log('  (no users returned)');
      return;
    }
    const users = await client.users.getDetails(ids);
    for (const user of users) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
      console.log(`  • ${user.uid ?? user.uuid}${name ? ` (${name})` : ''}`);
    }
  });

  console.log('\n✅ Demo complete.');
}

main().catch((err) => {
  if (err instanceof CrowdStrikeAuthConfigError) {
    console.error(`Bad configuration: ${err.message}`);
  } else {
    console.error(`Unexpected failure: ${describeError(err)}`);
  }
  process.exitCode = 1;
});
