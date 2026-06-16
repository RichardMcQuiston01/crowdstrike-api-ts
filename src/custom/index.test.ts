import {describe, it, expect} from 'bun:test';
import {CustomEndpoints} from './index';
import {HostsWithGroupsComposite} from './hosts-with-groups';
import {CaseReportComposite} from './case-report';
import type {HostsClient} from '../domains/hosts/hosts.client';
import type {HostGroupsClient} from '../domains/host-groups/host-groups.client';
import type {CasesClient} from '../domains/cases/cases.client';
import type {AlertsClient} from '../domains/alerts/alerts.client';

describe('CustomEndpoints', () => {
  it('wires up every composite endpoint', () => {
    const custom = new CustomEndpoints({
      hosts: {} as unknown as HostsClient,
      hostGroups: {} as unknown as HostGroupsClient,
      cases: {} as unknown as CasesClient,
      alerts: {} as unknown as AlertsClient,
    });

    expect(custom.hostsWithGroups).toBeInstanceOf(HostsWithGroupsComposite);
    expect(custom.caseReport).toBeInstanceOf(CaseReportComposite);
  });
});
