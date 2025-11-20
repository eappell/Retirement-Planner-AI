import React, { useState, useEffect } from 'react';
import { NumberInput } from './FormControls';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveDefaults: (d: { stockMean: number; stockStd: number; bondMean: number; bondStd: number }) => void;
}

const AppSettingsModal: React.FC<Props> = ({ isOpen, onClose, onSaveDefaults }) => {
  const [stockMean, setStockMean] = useState<number>(8);
  const [stockStd, setStockStd] = useState<number>(15);
  const [bondMean, setBondMean] = useState<number>(3);
  const [bondStd, setBondStd] = useState<number>(6);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('assetAssumptionDefaults');
      if (raw) {
        const parsed = JSON.parse(raw);
        setStockMean(parsed.stockMean ?? 8);
        setStockStd(parsed.stockStd ?? 15);
        setBondMean(parsed.bondMean ?? 3);
        setBondStd(parsed.bondStd ?? 6);
      }
    } catch (e) {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md z-50 p-6">
        <h3 className="text-lg font-semibold mb-4">App Settings</h3>
        <p className="text-sm text-gray-600 mb-4">Edit application defaults for asset-class assumptions.</p>
        <div className="grid grid-cols-1 gap-3">
          <NumberInput label="Stocks: Expected Return" suffix="%" value={stockMean} onChange={e => setStockMean(Number(e.target.value))} />
          <NumberInput label="Stocks: Volatility (std dev)" suffix="%" value={stockStd} onChange={e => setStockStd(Number(e.target.value))} />
          <NumberInput label="Bonds: Expected Return" suffix="%" value={bondMean} onChange={e => setBondMean(Number(e.target.value))} />
          <NumberInput label="Bonds: Volatility (std dev)" suffix="%" value={bondStd} onChange={e => setBondStd(Number(e.target.value))} />
        </div>

        <div className="mt-4 flex items-center justify-end space-x-2">
          <button type="button" className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200" onClick={() => {
            try { localStorage.removeItem('assetAssumptionDefaults'); } catch (e) { /* ignore */ }
            onSaveDefaults({ stockMean: 8, stockStd: 15, bondMean: 3, bondStd: 6 });
            onClose();
          }}>Clear Defaults</button>
          <button type="button" className="px-3 py-1.5 rounded-md bg-brand-primary text-white hover:opacity-95" onClick={() => {
            const d = { stockMean, stockStd, bondMean, bondStd };
            try { localStorage.setItem('assetAssumptionDefaults', JSON.stringify(d)); } catch (e) { /* ignore */ }
            onSaveDefaults(d);
            onClose();
          }}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AppSettingsModal;
