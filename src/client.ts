import {FalconRegion, type FalconClientConfig} from './config';
import {OAuth2TokenManager} from './core/auth';
import {HttpClient} from './core/http-client';
import {Oauth2Client} from './domains/oauth2/oauth2.client';
import {HostsClient} from './domains/hosts/hosts.client';
import {HostGroupsClient} from './domains/host-groups/host-groups.client';
import {CasesClient} from './domains/cases/cases.client';
import {AlertsClient} from './domains/alerts/alerts.client';
import {RealTimeResponseClient} from './domains/real-time-response/real-time-response.client';
import {RealTimeResponseAdminClient} from './domains/real-time-response/real-time-response-admin.client';
import {ContainerVulnerabilitiesClient} from './domains/container-vulnerabilities/container-vulnerabilities.client';
import {IntelClient} from './domains/intel/intel.client';
import {IocClient} from './domains/ioc/ioc.client';
import {CloudSecurityClient} from './domains/cloud-security/cloud-security.client';
import {IdentityProtectionClient} from './domains/identity-protection/identity-protection.client';
import {SensorDownloadClient} from './domains/sensor-download/sensor-download.client';
import {PreventionPoliciesClient} from './domains/prevention-policies/prevention-policies.client';
import {UsersClient} from './domains/users/users.client';
import {DiscoverClient} from './domains/discover/discover.client';
import {CustomIoaClient} from './domains/custom-ioa/custom-ioa.client';
import {CustomEndpoints} from './custom';

/**
 * Top-level entry point for the CrowdStrike Falcon API. Composes one shared,
 * authenticated HttpClient and exposes each API domain as a readonly property.
 */
export class FalconClient {
  readonly hosts: HostsClient;
  readonly hostGroups: HostGroupsClient;
  readonly cases: CasesClient;
  readonly alerts: AlertsClient;
  readonly realTimeResponse: RealTimeResponseClient;
  readonly realTimeResponseAdmin: RealTimeResponseAdminClient;
  readonly containerVulnerabilities: ContainerVulnerabilitiesClient;
  readonly intel: IntelClient;
  readonly ioc: IocClient;
  readonly cloudSecurity: CloudSecurityClient;
  readonly identityProtection: IdentityProtectionClient;
  readonly sensorDownload: SensorDownloadClient;
  readonly preventionPolicies: PreventionPoliciesClient;
  readonly users: UsersClient;
  readonly discover: DiscoverClient;
  readonly customIoa: CustomIoaClient;
  readonly custom: CustomEndpoints;

  constructor(config: FalconClientConfig) {
    const baseUrl = config.baseUrl ?? FalconRegion.US1;
    const fetchImpl = config.fetch ?? fetch;

    // The /oauth2/token call itself carries no bearer token, so it gets its
    // own unauthenticated HttpClient rather than the shared one below.
    const authHttp = new HttpClient(baseUrl, null, fetchImpl, config.timeoutMs);
    const oauth2Client = new Oauth2Client(authHttp);
    const tokenManager = new OAuth2TokenManager(config, oauth2Client);

    const http = new HttpClient(
      baseUrl,
      tokenManager,
      fetchImpl,
      config.timeoutMs,
    );

    this.hosts = new HostsClient(http);
    this.hostGroups = new HostGroupsClient(http);
    this.cases = new CasesClient(http);
    this.alerts = new AlertsClient(http);
    this.realTimeResponse = new RealTimeResponseClient(http);
    this.realTimeResponseAdmin = new RealTimeResponseAdminClient(http);
    this.containerVulnerabilities = new ContainerVulnerabilitiesClient(http);
    this.intel = new IntelClient(http);
    this.ioc = new IocClient(http);
    this.cloudSecurity = new CloudSecurityClient(http);
    this.identityProtection = new IdentityProtectionClient(http);
    this.sensorDownload = new SensorDownloadClient(http);
    this.preventionPolicies = new PreventionPoliciesClient(http);
    this.users = new UsersClient(http);
    this.discover = new DiscoverClient(http);
    this.customIoa = new CustomIoaClient(http);
    this.custom = new CustomEndpoints({
      hosts: this.hosts,
      hostGroups: this.hostGroups,
      cases: this.cases,
      alerts: this.alerts,
    });
  }
}
