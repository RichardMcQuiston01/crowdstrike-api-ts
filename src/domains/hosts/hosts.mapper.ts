import type { HostDetails } from './hosts.types';

/** Raw wire shape of a CrowdStrike device entity (DeviceapiDeviceSwagger). */
export interface RawDevice {
  device_id: string;
  cid: string;
  hostname?: string;
  local_ip?: string;
  external_ip?: string;
  os_version?: string;
  platform_name?: string;
  agent_version?: string;
  status?: string;
  last_seen?: string;
  first_seen?: string;
  tags?: string[];
  [key: string]: unknown;
}

export function mapRawDeviceToHostDetails(raw: RawDevice): HostDetails {
  return {
    deviceId: raw.device_id,
    cid: raw.cid,
    hostname: raw.hostname,
    localIp: raw.local_ip,
    externalIp: raw.external_ip,
    osVersion: raw.os_version,
    platformName: raw.platform_name,
    agentVersion: raw.agent_version,
    status: raw.status,
    lastSeen: raw.last_seen,
    firstSeen: raw.first_seen,
    tags: raw.tags,
    raw,
  };
}
