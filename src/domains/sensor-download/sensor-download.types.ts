export interface SensorInstallerSearchParams {
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface SensorInstallerIdSearchResult {
  /** Sensor installers are identified by their sha256 hash. */
  ids: string[];
  pagination: { offset: number; limit: number; total: number };
}

export interface SensorInstallerSearchResult {
  installers: SensorInstallerDetails[];
  pagination: { offset: number; limit: number; total: number };
}

export interface SensorInstallerDetails {
  sha256: string;
  name: string;
  description: string;
  version: string;
  platform: string;
  os: string;
  osVersion: string;
  fileType: string;
  fileSize: number;
  architectures?: string[];
  isLts?: boolean;
  ltsExpiryDate?: string;
  releaseDate: string;
  raw: Record<string, unknown>;
}
