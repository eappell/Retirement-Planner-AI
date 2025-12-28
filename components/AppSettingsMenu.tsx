import React, { useEffect, useState } from 'react';
import { NumberInput } from './FormControls';
import { RetirementPlan } from '../types';

interface Props {
  onSaveDefaults: (d: { stockMean: number; stockStd: number; bondMean: number; bondStd: number; useFatTails?: boolean; fatTailDf?: number }) => void;
  onClose: () => void;
  plan?: RetirementPlan | null;
}

const AppSettingsMenu: React.FC<Props> = ({ onSaveDefaults, onClose, plan = null }) => {
  const [fatTooltipOpen, setFatTooltipOpen] = useState(false);

  // Populate initial values from plan when opening for clarity (menu is now informational)


  useEffect(() => {
    try {
      const raw = localStorage.getItem('assetAssumptionDefaults');
      if (raw) {
        const parsed = JSON.parse(raw);
        setStockMean(parsed.stockMean ?? (plan?.stockMean ?? 8));
        setStockStd(parsed.stockStd ?? (plan?.stockStd ?? 15));
        setBondMean(parsed.bondMean ?? (plan?.bondMean ?? 3));
        setBondStd(parsed.bondStd ?? (plan?.bondStd ?? 6));
        setUseFatTails(parsed.useFatTails ?? (plan?.useFatTails ?? true));
        setFatTailDf(parsed.fatTailDf ?? (plan?.fatTailDf ?? 4));
        return;
      }
      if (plan) {
        setStockMean(plan.stockMean ?? 8);
        setStockStd(plan.stockStd ?? 15);
        setBondMean(plan.bondMean ?? 3);
        setBondStd(plan.bondStd ?? 6);
        setUseFatTails(plan.useFatTails ?? true);
        setFatTailDf(plan.fatTailDf ?? 4);
      }
    } catch (e) {
      // ignore
    }
  }, [plan]);

  return (
    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30 p-4">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-brand-text-primary">Advanced Market Assumptions</h3>
        <p className="text-sm text-gray-600">Advanced Market Assumptions are now edited in the <strong>Plan Information</strong> section of the form (so they can be set per scenario).</p>

        <div className="mt-2 text-sm text-gray-700">
          <div><strong>Stocks:</strong> {typeof plan?.stockMean !== 'undefined' ? `${plan?.stockMean}% (vol ${plan?.stockStd ?? '—'}%)` : '—'}</div>
          <div className="mt-1"><strong>Bonds:</strong> {typeof plan?.bondMean !== 'undefined' ? `${plan?.bondMean}% (vol ${plan?.bondStd ?? '—'}%)` : '—'}</div>
          <div className="mt-1"><strong>Fat-tailed returns:</strong> {typeof plan?.useFatTails !== 'undefined' ? (plan?.useFatTails ? `Enabled (df ${plan?.fatTailDf ?? '—'})` : 'Disabled') : '—'}</div>
        </div>          <span
            className="relative inline-flex ml-2"
            onMouseEnter={() => setFatTooltipOpen(true)}
            onMouseLeave={() => setFatTooltipOpen(false)}
            onFocus={() => setFatTooltipOpen(true)}
            onBlur={() => setFatTooltipOpen(false)}
            tabIndex={-1}
          >
            <span className="text-gray-400 hover:text-gray-600 focus:text-gray-700" aria-hidden="true" tabIndex={0}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
            </span>
            <div role="tooltip" className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-100 text-gray-900 text-[0.95rem] p-2.5 rounded shadow border border-gray-200 ${fatTooltipOpen ? 'block' : 'hidden'} z-10`}>
              <div className="font-medium">Fat-Tailed Returns</div>
              <div className="mt-1 text-sm">When enabled, returns are sampled from a fat‑tailed distribution, so projections will include rarer, larger market moves ("fat tails"). Lower "Tail degrees of freedom" makes extreme gains or losses more likely. Note: enabling fat‑tailed sampling introduces a small randomized variation in projections — results may differ slightly each time you run them.</div>
            </div>
          </span>
        </div>

        <NumberInput label="Default fat-tail df" value={fatTailDf} onChange={e => setFatTailDf(Number(e.target.value))} />

        <div className="mt-2 flex items-center justify-end space-x-2">
          <button type="button" className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200" onClick={() => {
            try { localStorage.removeItem('assetAssumptionDefaults'); } catch (e) { /* ignore */ }
            onSaveDefaults({ stockMean: 8, stockStd: 15, bondMean: 3, bondStd: 6, useFatTails: true, fatTailDf: 4 });
            onClose();
          }}>Clear</button>
          <button type="button" className="px-3 py-1.5 rounded-md bg-brand-primary text-white hover:opacity-95" onClick={() => {
            const d = { stockMean: (plan as any)?.stockMean ?? 8, stockStd: (plan as any)?.stockStd ?? 15, bondMean: (plan as any)?.bondMean ?? 3, bondStd: (plan as any)?.bondStd ?? 6, useFatTails: plan?.useFatTails ?? true, fatTailDf: plan?.fatTailDf ?? 4 };
            try { localStorage.setItem('assetAssumptionDefaults', JSON.stringify(d)); } catch (e) { /* ignore */ }
            onSaveDefaults(d);
            onClose();
          }}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AppSettingsMenu;
