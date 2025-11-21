import { describe, it, expect } from 'vitest';
import { buildExport, parseUpload } from '../utils/exportImport';

describe('export/import helpers', () => {
  it('buildExport includes scenariosState and appSettings', () => {
    const ss = { activeScenarioId: 's1', scenarios: { s1: { id: 's1', name: 'A', plan: {} } } } as any;
    const defaults = { stockMean: 8, stockStd: 15, bondMean: 3, bondStd: 6 };
    const out = buildExport(ss, defaults);
    expect(out.scenariosState).toBe(ss);
    expect(out.appSettings).toBeDefined();
    expect(out.appSettings.assetAssumptionDefaults).toEqual(defaults);
  });

  it('parseUpload recognizes wrapped and legacy formats', () => {
    const wrapped = { scenariosState: { activeScenarioId: 's1', scenarios: {} }, appSettings: { assetAssumptionDefaults: { stockMean: 8, stockStd: 15, bondMean: 3, bondStd: 6 } } };
    const p1 = parseUpload(wrapped);
    expect(p1.type).toBe('wrapped');
    const legacy = { activeScenarioId: 's1', scenarios: {} };
    const p2 = parseUpload(legacy);
    expect(p2.type).toBe('legacy');
  });
});
