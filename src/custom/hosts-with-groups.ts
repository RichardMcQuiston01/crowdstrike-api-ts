import type { HostsClient } from '../domains/hosts/hosts.client';
import type { HostGroupsClient } from '../domains/host-groups/host-groups.client';
import type {
  HostSearchParams,
  HostDetails,
} from '../domains/hosts/hosts.types';

export interface HostGroupSummary {
  id: string;
  name: string;
}

export interface HostWithGroups extends HostDetails {
  groups: HostGroupSummary[];
}

function extractGroupIds(host: HostDetails): string[] {
  const groups = host.raw['groups'];
  return Array.isArray(groups)
    ? groups.filter((id): id is string => typeof id === 'string')
    : [];
}

/**
 * Joins Hosts + HostGroups: CrowdStrike's device entity only embeds the
 * member group IDs, not their names, so this composite hydrates the
 * referenced groups in a second call and annotates each host with them.
 */
export class HostsWithGroupsComposite {
  constructor(
    private readonly hosts: HostsClient,
    private readonly hostGroups: HostGroupsClient,
  ) {}

  async search(params: HostSearchParams = {}): Promise<HostWithGroups[]> {
    const hosts = await this.hosts.searchWithDetails(params);
    if (hosts.length === 0) {
      return [];
    }

    const groupIds = new Set<string>();
    for (const host of hosts) {
      for (const id of extractGroupIds(host)) {
        groupIds.add(id);
      }
    }

    const namesById = new Map<string, string>();
    if (groupIds.size > 0) {
      const groups = await this.hostGroups.getDetails([...groupIds]);
      for (const group of groups) {
        namesById.set(group.id, group.name);
      }
    }

    return hosts.map((host) => ({
      ...host,
      groups: extractGroupIds(host).map((id) => ({
        id,
        name: namesById.get(id) ?? id,
      })),
    }));
  }
}
