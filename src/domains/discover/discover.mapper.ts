import type {
  DiscoverHostDetails,
  DiscoverApplicationDetails,
  DiscoverAccountDetails,
  DiscoverLoginDetails,
} from './discover.types';

/** Raw wire shape of a Falcon Discover asset (DomainDiscoverAPIHost); only a subset of fields are declared. */
export interface RawDiscoverHost {
  id: string;
  cid: string;
  hostname?: string;
  fqdn?: string;
  aid?: string;
  agent_version?: string;
  platform_name?: string;
  os_version?: string;
  entity_type?: string;
  criticality?: string;
  internet_exposure?: string;
  external_ip?: string;
  current_local_ip?: string;
  local_ip_addresses?: string[];
  mac_addresses?: string[];
  first_seen_timestamp?: string;
  last_seen_timestamp?: string;
  discovering_by?: string[];
  data_providers?: string[];
  tags?: string[];
  groups?: string[];
  managed_by?: string;
  owned_by?: string;
  department?: string;
  system_manufacturer?: string;
  system_product_name?: string;
  [key: string]: unknown;
}

export function mapRawDiscoverHost(raw: RawDiscoverHost): DiscoverHostDetails {
  return {
    id: raw.id,
    cid: raw.cid,
    hostname: raw.hostname,
    fqdn: raw.fqdn,
    aid: raw.aid,
    agentVersion: raw.agent_version,
    platformName: raw.platform_name,
    osVersion: raw.os_version,
    entityType: raw.entity_type,
    criticality: raw.criticality,
    internetExposure: raw.internet_exposure,
    externalIp: raw.external_ip,
    currentLocalIp: raw.current_local_ip,
    localIpAddresses: raw.local_ip_addresses,
    macAddresses: raw.mac_addresses,
    firstSeenTimestamp: raw.first_seen_timestamp,
    lastSeenTimestamp: raw.last_seen_timestamp,
    discoveringBy: raw.discovering_by,
    dataProviders: raw.data_providers,
    tags: raw.tags,
    groups: raw.groups,
    managedBy: raw.managed_by,
    ownedBy: raw.owned_by,
    department: raw.department,
    systemManufacturer: raw.system_manufacturer,
    systemProductName: raw.system_product_name,
    raw,
  };
}

/** Raw wire shape of a Falcon Discover application (DomainDiscoverAPIApplication). */
export interface RawDiscoverApplication {
  id: string;
  cid: string;
  name?: string;
  vendor?: string;
  version?: string;
  category?: string;
  software_type?: string;
  groups?: string[];
  installation_paths?: string[];
  first_seen_timestamp?: string;
  last_used_timestamp?: string;
  is_suspicious?: boolean;
  [key: string]: unknown;
}

export function mapRawDiscoverApplication(
  raw: RawDiscoverApplication,
): DiscoverApplicationDetails {
  return {
    id: raw.id,
    cid: raw.cid,
    name: raw.name,
    vendor: raw.vendor,
    version: raw.version,
    category: raw.category,
    softwareType: raw.software_type,
    groups: raw.groups,
    installationPaths: raw.installation_paths,
    firstSeenTimestamp: raw.first_seen_timestamp,
    lastUsedTimestamp: raw.last_used_timestamp,
    isSuspicious: raw.is_suspicious,
    raw,
  };
}

/** Raw wire shape of a Falcon Discover account (DomainDiscoverAPIAccount). */
export interface RawDiscoverAccount {
  id: string;
  cid: string;
  account_name?: string;
  account_type?: string;
  username?: string;
  login_domain?: string;
  admin_privileges?: string;
  local_admin_privileges?: string;
  last_successful_login_timestamp?: string;
  last_successful_login_hostname?: string;
  last_failed_login_timestamp?: string;
  first_seen_timestamp?: string;
  [key: string]: unknown;
}

export function mapRawDiscoverAccount(
  raw: RawDiscoverAccount,
): DiscoverAccountDetails {
  return {
    id: raw.id,
    cid: raw.cid,
    accountName: raw.account_name,
    accountType: raw.account_type,
    username: raw.username,
    loginDomain: raw.login_domain,
    adminPrivileges: raw.admin_privileges,
    localAdminPrivileges: raw.local_admin_privileges,
    lastSuccessfulLoginTimestamp: raw.last_successful_login_timestamp,
    lastSuccessfulLoginHostname: raw.last_successful_login_hostname,
    lastFailedLoginTimestamp: raw.last_failed_login_timestamp,
    firstSeenTimestamp: raw.first_seen_timestamp,
    raw,
  };
}

/** Raw wire shape of a Falcon Discover login event (DomainDiscoverAPILogin). */
export interface RawDiscoverLogin {
  id?: string;
  cid?: string;
  account_id?: string;
  account_name?: string;
  host_id?: string;
  hostname?: string;
  username?: string;
  login_type?: string;
  login_status?: string;
  login_timestamp?: string;
  remote_ip?: string;
  local_ip?: string;
  is_suspicious?: boolean;
  login_event_count?: number;
  [key: string]: unknown;
}

export function mapRawDiscoverLogin(
  raw: RawDiscoverLogin,
): DiscoverLoginDetails {
  return {
    id: raw.id,
    cid: raw.cid,
    accountId: raw.account_id,
    accountName: raw.account_name,
    hostId: raw.host_id,
    hostname: raw.hostname,
    username: raw.username,
    loginType: raw.login_type,
    loginStatus: raw.login_status,
    loginTimestamp: raw.login_timestamp,
    remoteIp: raw.remote_ip,
    localIp: raw.local_ip,
    isSuspicious: raw.is_suspicious,
    loginEventCount: raw.login_event_count,
    raw,
  };
}
