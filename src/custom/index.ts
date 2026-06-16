import type {HostsClient} from '../domains/hosts/hosts.client';
import type {HostGroupsClient} from '../domains/host-groups/host-groups.client';
import type {CasesClient} from '../domains/cases/cases.client';
import type {AlertsClient} from '../domains/alerts/alerts.client';
import {HostsWithGroupsComposite} from './hosts-with-groups';
import {CaseReportComposite} from './case-report';

export * from './hosts-with-groups';
export * from './case-report';

export interface CustomEndpointsDeps {
  hosts: HostsClient;
  hostGroups: HostGroupsClient;
  cases: CasesClient;
  alerts: AlertsClient;
}

/**
 * Aggregates composite endpoints that join two or more domain clients.
 * A function belongs here only if it spans multiple domains or implements a
 * workflow with no single corresponding CrowdStrike REST endpoint; anything
 * touching a single domain's own endpoints stays a method on that domain's
 * client instead.
 */
export class CustomEndpoints {
  readonly hostsWithGroups: HostsWithGroupsComposite;
  readonly caseReport: CaseReportComposite;

  constructor(deps: CustomEndpointsDeps) {
    this.hostsWithGroups = new HostsWithGroupsComposite(
      deps.hosts,
      deps.hostGroups,
    );
    this.caseReport = new CaseReportComposite(deps.cases, deps.alerts);
  }
}
