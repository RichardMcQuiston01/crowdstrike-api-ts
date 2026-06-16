import {describe, it, expect, mock} from 'bun:test';
import {HostsWithGroupsComposite} from './hosts-with-groups';
import type {HostsClient} from '../domains/hosts/hosts.client';
import type {HostGroupsClient} from '../domains/host-groups/host-groups.client';
import type {HostDetails} from '../domains/hosts/hosts.types';
import type {HostGroupDetails} from '../domains/host-groups/host-groups.types';

function fakeHost(overrides: Partial<HostDetails> = {}): HostDetails {
  return {
    deviceId: 'host-1',
    cid: 'cid-1',
    raw: {groups: ['group-1', 'group-2']},
    ...overrides,
  };
}

function fakeGroup(id: string, name: string): HostGroupDetails {
  return {id, name, raw: {}};
}

describe('HostsWithGroupsComposite', () => {
  it('annotates each host with the names of its member groups', async () => {
    const searchWithDetails = mock(async () => [fakeHost()]);
    const getDetails = mock(async () => [
      fakeGroup('group-1', 'Finance'),
      fakeGroup('group-2', 'Laptops'),
    ]);
    const composite = new HostsWithGroupsComposite(
      {searchWithDetails} as unknown as HostsClient,
      {getDetails} as unknown as HostGroupsClient,
    );

    const result = await composite.search({filter: "platform_name:'Windows'"});

    expect(getDetails).toHaveBeenCalledWith(['group-1', 'group-2']);
    expect(result).toEqual([
      {
        ...fakeHost(),
        groups: [
          {id: 'group-1', name: 'Finance'},
          {id: 'group-2', name: 'Laptops'},
        ],
      },
    ]);
  });

  it('falls back to the group ID as the name if the group lookup omits it', async () => {
    const searchWithDetails = mock(async () => [
      fakeHost({raw: {groups: ['group-missing']}}),
    ]);
    const getDetails = mock(async () => []);
    const composite = new HostsWithGroupsComposite(
      {searchWithDetails} as unknown as HostsClient,
      {getDetails} as unknown as HostGroupsClient,
    );

    const result = await composite.search();

    expect(result[0].groups).toEqual([
      {id: 'group-missing', name: 'group-missing'},
    ]);
  });

  it('returns an empty array without calling host-groups when no hosts match', async () => {
    const searchWithDetails = mock(async () => []);
    const getDetails = mock(async () => []);
    const composite = new HostsWithGroupsComposite(
      {searchWithDetails} as unknown as HostsClient,
      {getDetails} as unknown as HostGroupsClient,
    );

    const result = await composite.search();

    expect(result).toEqual([]);
    expect(getDetails).not.toHaveBeenCalled();
  });

  it('skips the group lookup entirely when no host has any group membership', async () => {
    const searchWithDetails = mock(async () => [fakeHost({raw: {}})]);
    const getDetails = mock(async () => []);
    const composite = new HostsWithGroupsComposite(
      {searchWithDetails} as unknown as HostsClient,
      {getDetails} as unknown as HostGroupsClient,
    );

    const result = await composite.search();

    expect(result).toEqual([{...fakeHost({raw: {}}), groups: []}]);
    expect(getDetails).not.toHaveBeenCalled();
  });
});
