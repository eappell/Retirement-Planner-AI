import React, { useEffect, useState } from 'react';
import { NumberInput } from './FormControls';
import { RetirementPlan } from '../types';

interface Props {
  onSaveDefaults: (d: { stockMean: number; stockStd: number; bondMean: number; bondStd: number; useFatTails?: boolean; fatTailDf?: number }) => void;
  onClose: () => void;
  plan?: RetirementPlan | null;
}

const AppSettingsMenu: React.FC<Props> = ({ onSaveDefaults, onClose, plan = null }) => {
  const [stockMean, setStockMean] = useState<number>(8);
  const [stockStd, setStockStd] = useState<number>(15);
  const [bondMean, setBondMean] = useState<number>(3);
  const [bondStd, setBondStd] = useState<number>(6);
  const [useFatTails, setUseFatTails] = useState<boolean>(true);
  const [fatTailDf, setFatTailDf] = useState<number>(4);

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
        <h3 className="text-lg font-semibold text-brand-text-primary">App Settings</h3>
        <p className="text-sm text-gray-600">Edit application defaults for asset-class assumptions.</p>

        <NumberInput label="Stocks: Expected Return" suffix="%" value={stockMean} onChange={e => setStockMean(Number(e.target.value))} />
        <NumberInput label="Stocks: Volatility (std dev)" suffix="%" value={stockStd} onChange={e => setStockStd(Number(e.target.value))} />
        <NumberInput label="Bonds: Expected Return" suffix="%" value={bondMean} onChange={e => setBondMean(Number(e.target.value))} />
        <NumberInput label="Bonds: Volatility (std dev)" suffix="%" value={bondStd} onChange={e => setBondStd(Number(e.target.value))} />

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <input id="menu-use-fat" type="checkbox" checked={useFatTails} onChange={e => setUseFatTails(e.target.checked)} className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary mt-1" />
          </div>
          <div className="flex-1">
            <label htmlFor="menu-use-fat" className="text-sm font-medium">Default: Use fat-tailed returns</label>
            <p className="text-xs text-gray-500 mt-1">When enabled, returns are sampled from a fat‑tailed distribution, so projections will include a small randomized variation each time you run them.</p>
          </div>
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
