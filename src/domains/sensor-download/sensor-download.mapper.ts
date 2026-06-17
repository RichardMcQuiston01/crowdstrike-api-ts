import type { SensorInstallerDetails } from './sensor-download.types';

/** Raw wire shape of a sensor installer record (DomainSensorInstallerV3). */
export interface RawSensorInstaller {
  sha256: string;
  name: string;
  description: string;
  version: string;
  platform: string;
  os: string;
  os_version: string;
  file_type: string;
  file_size: number;
  architectures?: string[];
  is_lts?: boolean;
  lts_expiry_date?: string;
  release_date: string;
  [key: string]: unknown;
}

export function mapRawSensorInstaller(
  raw: RawSensorInstaller,
): SensorInstallerDetails {
  return {
    sha256: raw.sha256,
    name: raw.name,
    description: raw.description,
    version: raw.version,
    platform: raw.platform,
    os: raw.os,
    osVersion: raw.os_version,
    fileType: raw.file_type,
    fileSize: raw.file_size,
    architectures: raw.architectures,
    isLts: raw.is_lts,
    ltsExpiryDate: raw.lts_expiry_date,
    releaseDate: raw.release_date,
    raw,
  };
}
