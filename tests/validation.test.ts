import { describe, it, expect } from 'vitest';
import { validateAssetDefaults } from '../utils/assetValidation';

describe('validateAssetDefaults', () => {
  it('returns no issues for reasonable defaults', () => {
    const d = { stockMean: 8, bondMean: 3, stockStd: 15, bondStd: 6 };
    const issues = validateAssetDefaults(d);
    expect(issues).toHaveLength(0);
  });

  it('flags when stockMean < bondMean', () => {
    const d = { stockMean: 2, bondMean: 3, stockStd: 10, bondStd: 5 };
    const issues = validateAssetDefaults(d);
    expect(issues).toContain('Stock mean is lower than bond mean (unusual assumption)');
  });

  it('flags invalid types and ranges', () => {
    const d = { stockMean: 'foo', bondMean: null, stockStd: -5, bondStd: 200 } as any;
    const issues = validateAssetDefaults(d);
    expect(issues.length).toBeGreaterThan(0);
  });
});
