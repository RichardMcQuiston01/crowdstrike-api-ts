export interface IdentitySensorSearchParams {
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface IdentitySensorIdSearchResult {
  ids: string[];
  pagination: {offset: number; limit: number; total: number};
}

export interface IdentitySensorDetails {
  cid: string;
  deviceId: string;
  hostname?: string;
  agentVersion?: string;
  localIp?: string;
  machineDomain?: string;
  osVersion?: string;
  status?: string;
  statusCauses?: string[];
  idpPolicyId?: string;
  idpPolicyName?: string;
  heartbeatTime?: number;
  tiEnabled?: string;
  directoryAuditing?: string;
  groupPolicyObject?: string;
  kerberosConfig?: string;
  ldapConfig?: string;
  ldapsConfig?: string;
  newEnforcementMode?: string;
  ntlmConfig?: string;
  rdpToDcConfig?: string;
  smbToDcConfig?: string;
  raw: Record<string, unknown>;
}

/**
 * Response shape of the Identity Protection GraphQL passthrough. The actual
 * `data` shape depends entirely on the caller's query, so it's left generic.
 */
export interface IdentityProtectionGraphQLResponse<T = unknown> {
  data?: T;
  errors?: unknown[];
}
