import type { CasesClient } from '../domains/cases/cases.client';
import type { AlertsClient } from '../domains/alerts/alerts.client';
import type { CaseDetails } from '../domains/cases/cases.types';
import type { AlertDetails } from '../domains/alerts/alerts.types';

export interface CaseReport {
  case: CaseDetails;
  alerts: AlertDetails[];
  /** Total number of alerts CrowdStrike reports for this case. */
  totalAlerts: number;
  /** True when the alert list was cut short (see ALERT_QUERY_WINDOW). */
  alertsTruncated: boolean;
}

/** Documented per-request maximum for the alert query and details endpoints. */
const ALERT_PAGE_SIZE = 1000;
/** The alert query endpoint rejects offset + limit beyond this window. */
const ALERT_QUERY_WINDOW = 10_000;

/** Escapes a value for use inside a single-quoted FQL string literal. */
function escapeFqlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
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

    const filter = `case_id:'${escapeFqlString(caseId)}'`;
    const compositeIds: string[] = [];
    let totalAlerts = 0;
    for (;;) {
      const page = await this.alerts.search({
        filter,
        offset: compositeIds.length,
        limit: Math.min(
          ALERT_PAGE_SIZE,
          ALERT_QUERY_WINDOW - compositeIds.length,
        ),
      });
      compositeIds.push(...page.compositeIds);
      totalAlerts = page.pagination.total;
      if (
        page.compositeIds.length === 0 ||
        compositeIds.length >= totalAlerts ||
        compositeIds.length >= ALERT_QUERY_WINDOW
      ) {
        break;
      }
    }

    const alerts: AlertDetails[] = [];
    for (let i = 0; i < compositeIds.length; i += ALERT_PAGE_SIZE) {
      alerts.push(
        ...(await this.alerts.getDetails(
          compositeIds.slice(i, i + ALERT_PAGE_SIZE),
        )),
      );
    }

    return {
      case: caseDetails,
      alerts,
      totalAlerts,
      alertsTruncated: compositeIds.length < totalAlerts,
    };
  }
}
