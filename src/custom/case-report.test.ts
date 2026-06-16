import {describe, it, expect, mock} from 'bun:test';
import {CaseReportComposite} from './case-report';
import type {CasesClient} from '../domains/cases/cases.client';
import type {AlertsClient} from '../domains/alerts/alerts.client';
import type {CaseDetails} from '../domains/cases/cases.types';
import type {AlertDetails} from '../domains/alerts/alerts.types';

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
  return {compositeId, severity: 80, status: 'new', raw: {}};
}

describe('CaseReportComposite', () => {
  it('fetches the case and joins in alerts filtered by case_id', async () => {
    const getDetails = mock(async () => [fakeCase()]);
    const search = mock(async () => ({
      compositeIds: ['alert-1', 'alert-2'],
      pagination: {offset: 0, limit: 100, total: 2},
    }));
    const getAlertDetails = mock(async () => [
      fakeAlert('alert-1'),
      fakeAlert('alert-2'),
    ]);
    const composite = new CaseReportComposite(
      {getDetails} as unknown as CasesClient,
      {search, getDetails: getAlertDetails} as unknown as AlertsClient,
    );

    const report = await composite.get('case-1');

    expect(getDetails).toHaveBeenCalledWith(['case-1']);
    expect(search).toHaveBeenCalledWith({filter: "case_id:'case-1'"});
    expect(getAlertDetails).toHaveBeenCalledWith(['alert-1', 'alert-2']);
    expect(report.case).toEqual(fakeCase());
    expect(report.alerts).toEqual([fakeAlert('alert-1'), fakeAlert('alert-2')]);
  });

  it('returns an empty alerts array without hydrating when none match', async () => {
    const getDetails = mock(async () => [fakeCase()]);
    const search = mock(async () => ({
      compositeIds: [],
      pagination: {offset: 0, limit: 100, total: 0},
    }));
    const getAlertDetails = mock(async () => []);
    const composite = new CaseReportComposite(
      {getDetails} as unknown as CasesClient,
      {search, getDetails: getAlertDetails} as unknown as AlertsClient,
    );

    const report = await composite.get('case-1');

    expect(report.alerts).toEqual([]);
    expect(getAlertDetails).not.toHaveBeenCalled();
  });

  it('throws if the case does not exist', async () => {
    const getDetails = mock(async () => []);
    const search = mock(async () => ({
      compositeIds: [],
      pagination: {offset: 0, limit: 100, total: 0},
    }));
    const composite = new CaseReportComposite(
      {getDetails} as unknown as CasesClient,
      {search} as unknown as AlertsClient,
    );

    await expect(composite.get('missing-case')).rejects.toThrow(
      'Case not found: missing-case',
    );
  });
});
