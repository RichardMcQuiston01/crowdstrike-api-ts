import { describe, it, expect, mock } from 'bun:test';
import { CaseReportComposite } from './case-report';
import type { CasesClient } from '../domains/cases/cases.client';
import type { AlertsClient } from '../domains/alerts/alerts.client';
import type { CaseDetails } from '../domains/cases/cases.types';
import type { AlertDetails } from '../domains/alerts/alerts.types';

function fakeCase(overrides: Partial<CaseDetails> = {}): CaseDetails {
  return {
    id: 'case-1',
    cid: 'cid-1',
    name: 'Suspicious PowerShell activity',
    description: 'desc',
    status: 'open',
    severity: 80,
    referenceId: 'CS-1001',
    createdTimestamp: '2026-06-01T00:00:00Z',
    updatedTimestamp: '2026-06-01T00:00:00Z',
    startTimestamp: '2026-06-01T00:00:00Z',
    endTimestamp: '2026-06-01T00:00:00Z',
    version: 1,
    raw: {},
    ...overrides,
  };
}

function fakeAlert(compositeId: string): AlertDetails {
  return { compositeId, severity: 80, status: 'new', raw: {} };
}

describe('CaseReportComposite', () => {
  it('fetches the case and joins in alerts filtered by case_id', async () => {
    const getDetails = mock(async () => [fakeCase()]);
    const search = mock(async () => ({
      compositeIds: ['alert-1', 'alert-2'],
      pagination: { offset: 0, limit: 100, total: 2 },
    }));
    const getAlertDetails = mock(async () => [
      fakeAlert('alert-1'),
      fakeAlert('alert-2'),
    ]);
    const composite = new CaseReportComposite(
      { getDetails } as unknown as CasesClient,
      { search, getDetails: getAlertDetails } as unknown as AlertsClient,
    );

    const report = await composite.get('case-1');

    expect(getDetails).toHaveBeenCalledWith(['case-1']);
    expect(search).toHaveBeenCalledWith({
      filter: "case_id:'case-1'",
      offset: 0,
      limit: 1000,
    });
    expect(getAlertDetails).toHaveBeenCalledWith(['alert-1', 'alert-2']);
    expect(report.case).toEqual(fakeCase());
    expect(report.alerts).toEqual([fakeAlert('alert-1'), fakeAlert('alert-2')]);
    expect(report.totalAlerts).toBe(2);
    expect(report.alertsTruncated).toBe(false);
  });

  it('walks every page of alert ids and hydrates them all', async () => {
    const allIds = Array.from({ length: 1500 }, (_, i) => `alert-${i}`);
    const search = mock(
      async (params: { offset?: number; limit?: number }) => ({
        compositeIds: allIds.slice(
          params.offset ?? 0,
          (params.offset ?? 0) + (params.limit ?? 0),
        ),
        pagination: {
          offset: params.offset ?? 0,
          limit: params.limit ?? 0,
          total: allIds.length,
        },
      }),
    );
    const getAlertDetails = mock(async (ids: string[]) => ids.map(fakeAlert));
    const composite = new CaseReportComposite(
      { getDetails: mock(async () => [fakeCase()]) } as unknown as CasesClient,
      { search, getDetails: getAlertDetails } as unknown as AlertsClient,
    );

    const report = await composite.get('case-1');

    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[1][0]).toMatchObject({ offset: 1000 });
    expect(getAlertDetails).toHaveBeenCalledTimes(2);
    expect(report.alerts).toHaveLength(1500);
    expect(report.totalAlerts).toBe(1500);
    expect(report.alertsTruncated).toBe(false);
  });

  it('flags truncation when the query window is exhausted before the total', async () => {
    const search = mock(
      async (params: { offset?: number; limit?: number }) => ({
        compositeIds: Array.from(
          { length: params.limit ?? 0 },
          (_, i) => `alert-${(params.offset ?? 0) + i}`,
        ),
        pagination: {
          offset: params.offset ?? 0,
          limit: params.limit ?? 0,
          total: 12_000,
        },
      }),
    );
    const composite = new CaseReportComposite(
      { getDetails: mock(async () => [fakeCase()]) } as unknown as CasesClient,
      {
        search,
        getDetails: mock(async (ids: string[]) => ids.map(fakeAlert)),
      } as unknown as AlertsClient,
    );

    const report = await composite.get('case-1');

    expect(report.alerts).toHaveLength(10_000);
    expect(report.totalAlerts).toBe(12_000);
    expect(report.alertsTruncated).toBe(true);
  });

  it('returns an empty alerts array without hydrating when none match', async () => {
    const getDetails = mock(async () => [fakeCase()]);
    const search = mock(async () => ({
      compositeIds: [],
      pagination: { offset: 0, limit: 100, total: 0 },
    }));
    const getAlertDetails = mock(async () => []);
    const composite = new CaseReportComposite(
      { getDetails } as unknown as CasesClient,
      { search, getDetails: getAlertDetails } as unknown as AlertsClient,
    );

    const report = await composite.get('case-1');

    expect(report.alerts).toEqual([]);
    expect(getAlertDetails).not.toHaveBeenCalled();
  });

  it('throws if the case does not exist', async () => {
    const getDetails = mock(async () => []);
    const search = mock(async () => ({
      compositeIds: [],
      pagination: { offset: 0, limit: 100, total: 0 },
    }));
    const composite = new CaseReportComposite(
      { getDetails } as unknown as CasesClient,
      { search } as unknown as AlertsClient,
    );

    await expect(composite.get('missing-case')).rejects.toThrow(
      'Case not found: missing-case',
    );
  });

  it('escapes quotes and backslashes so the case id stays one FQL literal', async () => {
    const maliciousId = "abc' + case_id:* + '";
    const getDetails = mock(async () => [fakeCase({ id: maliciousId })]);
    const search = mock<AlertsClient['search']>(async () => ({
      compositeIds: [],
      pagination: { offset: 0, limit: 100, total: 0 },
    }));
    const composite = new CaseReportComposite(
      { getDetails } as unknown as CasesClient,
      { search, getDetails: mock(async () => []) } as unknown as AlertsClient,
    );

    await composite.get(maliciousId);
    await composite.get('a\\b');

    expect(search.mock.calls[0][0]).toMatchObject({
      filter: "case_id:'abc\\' + case_id:* + \\''",
    });
    expect(search.mock.calls[1][0]).toMatchObject({
      filter: "case_id:'a\\\\b'",
    });
  });
});
