export interface VulnerabilitySearchParams {
  filter?: string;
  limit?: number;
  offset?: number;
  sort?: string;
}

export interface VulnerabilitySearchResult {
  vulnerabilities: VulnerabilityDetails[];
  pagination: {offset: number; limit: number; total: number};
}

/** Friendlier, camelCased shape of a container vulnerability record. */
export interface VulnerabilityDetails {
  cveId: string;
  severity: string;
  cvssScore: number;
  description: string;
  exploitedStatusString?: string;
  exploitFound: boolean;
  imagesImpacted: number;
  containersImpacted: number;
  packagesImpacted: number;
  remediationAvailable: boolean;
  publishedDate?: string;
  raw: Record<string, unknown>;
}

export interface GetVulnerabilityInfoParams {
  cveId: string;
  limit?: number;
  offset?: number;
}
