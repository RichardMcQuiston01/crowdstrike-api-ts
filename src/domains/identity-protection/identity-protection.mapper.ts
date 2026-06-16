import type {IdentitySensorDetails} from './identity-protection.types';

/** Raw wire shape of an identity protection sensor record (InternalSensorStatus). */
export interface RawIdentitySensor {
  cid: string;
  device_id: string;
  hostname?: string;
  agent_version?: string;
  local_ip?: string;
  machine_domain?: string;
  os_version?: string;
  status?: string;
  status_causes?: string[];
  idp_policy_id?: string;
  idp_policy_name?: string;
  heartbeat_time?: number;
  ti_enabled?: string;
  directory_auditing?: string;
  group_policy_object?: string;
  kerberos_config?: string;
  ldap_config?: string;
  ldaps_config?: string;
  new_enforcement_mode?: string;
  ntlm_config?: string;
  rdp_to_dc_config?: string;
  smb_to_dc_config?: string;
  [key: string]: unknown;
}

export function mapRawIdentitySensor(
  raw: RawIdentitySensor,
): IdentitySensorDetails {
  return {
    cid: raw.cid,
    deviceId: raw.device_id,
    hostname: raw.hostname,
    agentVersion: raw.agent_version,
    localIp: raw.local_ip,
    machineDomain: raw.machine_domain,
    osVersion: raw.os_version,
    status: raw.status,
    statusCauses: raw.status_causes,
    idpPolicyId: raw.idp_policy_id,
    idpPolicyName: raw.idp_policy_name,
    heartbeatTime: raw.heartbeat_time,
    tiEnabled: raw.ti_enabled,
    directoryAuditing: raw.directory_auditing,
    groupPolicyObject: raw.group_policy_object,
    kerberosConfig: raw.kerberos_config,
    ldapConfig: raw.ldap_config,
    ldapsConfig: raw.ldaps_config,
    newEnforcementMode: raw.new_enforcement_mode,
    ntlmConfig: raw.ntlm_config,
    rdpToDcConfig: raw.rdp_to_dc_config,
    smbToDcConfig: raw.smb_to_dc_config,
    raw,
  };
}
