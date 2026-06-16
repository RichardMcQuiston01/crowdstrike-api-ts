import type {VulnerabilityDetails} from './container-vulnerabilities.types';

/** Raw wire shape of a container vulnerability record (ModelsAPIVulnerabilityCombined). */
export interface RawVulnerability {
  cve_id: string;
  severity: string;
  cvss_score: number;
  description: string;
  exploited_status_string?: string;
  exploit_found: boolean;
  images_impacted: number;
  containers_impacted: number;
  packages_impacted: number;
  remediation_available: boolean;
  published_date?: string;
  [key: string]: unknown;
}

export function mapRawVulnerability(
  raw: RawVulnerability,
): VulnerabilityDetails {
  return {
    cveId: raw.cve_id,
    severity: raw.severity,
    cvssScore: raw.cvss_score,
    description: raw.description,
    exploitedStatusString: raw.exploited_status_string,
    exploitFound: raw.exploit_found,
    imagesImpacted: raw.images_impacted,
    containersImpacted: raw.containers_impacted,
    packagesImpacted: raw.packages_impacted,
    remediationAvailable: raw.remediation_available,
    publishedDate: raw.published_date,
    raw,
  };
}
