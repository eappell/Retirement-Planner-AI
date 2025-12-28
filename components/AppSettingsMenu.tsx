import React, { useEffect, useState } from 'react';
import { NumberInput } from './FormControls';
import { RetirementPlan } from '../types';

interface Props {
  onSaveDefaults: (d: { stockMean: number; stockStd: number; bondMean: number; bondStd: number; useFatTails?: boolean; fatTailDf?: number }) => void;
  onApplyDefaults?: (d: { useFatTails?: boolean }) => void;
  onClose: () => void;
  plan?: RetirementPlan | null;
}

const AppSettingsMenu: React.FC<Props> = ({ onSaveDefaults, onApplyDefaults, onClose, plan = null }) => {
  const [stockMean, setStockMean] = useState<number>(8);
  const [stockStd, setStockStd] = useState<number>(15);
  const [bondMean, setBondMean] = useState<number>(3);
  const [bondStd, setBondStd] = useState<number>(6);
  const [useFatTails, setUseFatTails] = useState<boolean>(true);
  const [fatTailDf, setFatTailDf] = useState<number>(4);
  const [fatTooltipOpen, setFatTooltipOpen] = useState(false);

  // When the user toggles the fat-tail checkbox, notify parent via onApplyDefaults (no toast/close)
  // This replaces the previous auto-save on mount which closed the menu unexpectedly.


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
        <p className="text-sm text-gray-600">Edit application defaults for asset-class assumptions.</p>

        <NumberInput label="Stocks: Expected Return" suffix="%" value={stockMean} onChange={e => setStockMean(Number(e.target.value))} />
        <NumberInput label="Stocks: Volatility (std dev)" suffix="%" value={stockStd} onChange={e => setStockStd(Number(e.target.value))} />
        <NumberInput label="Bonds: Expected Return" suffix="%" value={bondMean} onChange={e => setBondMean(Number(e.target.value))} />
        <NumberInput label="Bonds: Volatility (std dev)" suffix="%" value={bondStd} onChange={e => setBondStd(Number(e.target.value))} />

        <div className="flex items-center space-x-3">
          <input id="menu-use-fat" type="checkbox" checked={useFatTails} onChange={e => {
            const v = e.target.checked;
            setUseFatTails(v);
            try { if (typeof onApplyDefaults === 'function') onApplyDefaults({ useFatTails: v }); } catch (e) { /* ignore */ }
          }} className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary" />
          <label htmlFor="menu-use-fat" className="text-sm font-medium">Default: Use fat-tailed returns</label>
          <span
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
            onSaveDefaults({ stockMean: 8, stockStd: 15, bondMean: 3, bondStd: 6 });
            onClose();
          }}>Clear</button>
          <button type="button" className="px-3 py-1.5 rounded-md bg-brand-primary text-white hover:opacity-95" onClick={() => {
            const d = { stockMean, stockStd, bondMean, bondStd, useFatTails, fatTailDf };
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
