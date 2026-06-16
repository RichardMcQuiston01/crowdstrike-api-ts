import type {IntelIndicatorDetails} from './intel.types';

/** Raw wire shape of a threat intel indicator (DomainPublicIndicatorV3). */
export interface RawIntelIndicator {
  id?: string;
  indicator?: string;
  type?: string;
  malicious_confidence?: string;
  published_date?: number;
  last_updated?: number;
  deleted?: boolean;
  kill_chains?: string[];
  malware_families?: string[];
  actors?: string[];
  reports?: string[];
  targets?: string[];
  threat_types?: string[];
  vulnerabilities?: string[];
  domain_types?: string[];
  ip_address_types?: string[];
  labels?: unknown[];
  relations?: unknown[];
  [key: string]: unknown;
}

export function mapRawIntelIndicator(
  raw: RawIntelIndicator,
): IntelIndicatorDetails {
  return {
    id: raw.id,
    indicatorValue: raw.indicator,
    type: raw.type,
    maliciousConfidence: raw.malicious_confidence,
    publishedDate: raw.published_date,
    lastUpdated: raw.last_updated,
    deleted: raw.deleted,
    killChains: raw.kill_chains,
    malwareFamilies: raw.malware_families,
    actors: raw.actors,
    reports: raw.reports,
    targets: raw.targets,
    threatTypes: raw.threat_types,
    vulnerabilities: raw.vulnerabilities,
    domainTypes: raw.domain_types,
    ipAddressTypes: raw.ip_address_types,
    labels: raw.labels,
    relations: raw.relations,
    raw,
  };
}
