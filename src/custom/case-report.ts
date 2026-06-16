import type {CasesClient} from '../domains/cases/cases.client';
import type {AlertsClient} from '../domains/alerts/alerts.client';
import type {CaseDetails} from '../domains/cases/cases.types';
import type {AlertDetails} from '../domains/alerts/alerts.types';

export interface CaseReport {
  case: CaseDetails;
  alerts: AlertDetails[];
}

/**
 * Joins Cases + Alerts: CrowdStrike has no single endpoint that returns a
 * case together with its associated alerts, so this composite fetches the
 * case and then queries alerts filtered by `case_id` in a second round trip.
 */
export class CaseReportComposite {
  constructor(
    private readonly cases: CasesClient,
    private readonly alerts: AlertsClient,
  ) {}

  async get(caseId: string): Promise<CaseReport> {
    const [caseDetails] = await this.cases.getDetails([caseId]);
    if (!caseDetails) {
      throw new Error(`Case not found: ${caseId}`);
    }

    const {compositeIds} = await this.alerts.search({
      filter: `case_id:'${caseId}'`,
    });
    const alerts =
      compositeIds.length === 0
        ? []
        : await this.alerts.getDetails(compositeIds);

    return {case: caseDetails, alerts};
  }
}
