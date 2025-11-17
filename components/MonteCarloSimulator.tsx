import React, { useState } from 'react';
import { MonteCarloResult } from '../types';

interface MonteCarloSimulatorProps {
    onRunSimulation: (numSimulations: number, volatility: number) => void;
    results: MonteCarloResult | null;
    isLoading: boolean;
}

const formatCurrencyShort = (value: number) => {
    if (value === undefined || !isFinite(value)) return 'N/A';
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
};


export const MonteCarloSimulator: React.FC<MonteCarloSimulatorProps> = ({ onRunSimulation, results, isLoading }) => {
    const [numSimulations, setNumSimulations] = useState(1000);
    const [volatility, setVolatility] = useState(15);

    const handleRunClick = () => {
        onRunSimulation(numSimulations, volatility);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-brand-text-secondary">Simulations</label>
                    <select value={numSimulations} onChange={e => setNumSimulations(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-transparent bg-white text-sm">
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                        <option value={1000}>1,000</option>
                        <option value={5000}>5,000</option>
                        <option value={10000}>10,000</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-brand-text-secondary">Market Volatility (Std. Dev.)</label>
                    <div className="flex items-center">
                        <input type="number" value={volatility} onChange={e => setVolatility(Number(e.target.value))} className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-transparent bg-white text-sm" />
                        <span className="text-gray-500 ml-2">%</span>
                    </div>
                </div>
                <button onClick={handleRunClick} disabled={isLoading} className="px-4 py-2 bg-brand-primary text-white rounded-md disabled:bg-gray-400 h-9">
                    {isLoading ? 'Running...' : 'Run Simulation'}
                </button>
            </div>
            {results && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                        <p className="text-5xl font-bold text-green-600">{results.successRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-2 text-center">Percentage of simulations where you did not run out of money.</p>
                    </div>
                    
                    {(() => {
                        const validOutcomes = results.outcomes.filter(v => isFinite(v));
                        if (validOutcomes.length === 0) return null;

                        const sortedOutcomes = [...validOutcomes].sort((a, b) => a - b);
                        const pessimisticValue = sortedOutcomes[Math.floor(sortedOutcomes.length * 0.10)];
                        const medianValue = sortedOutcomes[Math.floor(sortedOutcomes.length * 0.50)];
                        const optimisticValue = sortedOutcomes[Math.floor(sortedOutcomes.length * 0.90)];

                        return (
                            <div className="md:col-span-2 bg-gray-50 p-6 rounded-lg flex flex-col justify-center">
                                <h4 className="font-semibold text-center mb-4 text-gray-700">Range of Final Net Worth Outcomes</h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-sm font-medium text-red-600">Pessimistic (10%)</p>
                                        <p className="font-bold text-xl text-red-800 mt-1">{formatCurrencyShort(pessimisticValue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Median (50%)</p>
                                        <p className="font-bold text-xl text-gray-800 mt-1">{formatCurrencyShort(medianValue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-green-600">Optimistic (90%)</p>
                                        <p className="font-bold text-xl text-green-800 mt-1">{formatCurrencyShort(optimisticValue)}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center mt-4">Shows the 10th, 50th, and 90th percentile outcomes from all simulations.</p>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};