import React, { useState } from 'react';
import { MonteCarloResult, RetirementPlan } from '../types';
import './DynamicCharts.css';

interface MonteCarloSimulatorProps {
    onRunSimulation: (numSimulations: number, volatility: number) => void;
    results: MonteCarloResult | null;
    isLoading: boolean;
    plan?: RetirementPlan;
}

const formatCurrencyShort = (value: number) => {
    if (value === undefined || !isFinite(value)) return 'N/A';
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
};


export const MonteCarloSimulator: React.FC<MonteCarloSimulatorProps> = ({ onRunSimulation, results, isLoading, plan }) => {
    const [numSimulations, setNumSimulations] = useState(1000);
    const [volatility, setVolatility] = useState(15);

    const handleRunClick = () => {
        onRunSimulation(numSimulations, volatility);
    };

    return (
        <div className="space-y-4">
            {results && results.useFatTails && (
                <div
                    className="flex items-center space-x-2"
                    title={"Fat-tail sampling increases the probability of large market moves (positive and negative). Lower df => fatter tails; interpret success rates with that in mind."}
                    aria-label={`Fat tails enabled, df=${results.fatTailDf ?? 4}`}>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">Fat tails</span>
                    <span className="text-xs text-gray-600">df={results.fatTailDf ?? 4}</span>
                </div>
            )}
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
                                        <p className="text-sm font-medium text-red-600">10th Percentile</p>
                                        <p className="text-xs text-gray-500 mb-1">Worst Case</p>
                                        <p className="font-bold text-xl text-red-800 mt-1">{formatCurrencyShort(pessimisticValue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">50th Percentile</p>
                                        <p className="text-xs text-gray-500 mb-1">Median</p>
                                        <p className="font-bold text-xl text-gray-800 mt-1">{formatCurrencyShort(medianValue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-green-600">90th Percentile</p>
                                        <p className="text-xs text-gray-500 mb-1">Best Case</p>
                                        <p className="font-bold text-xl text-green-800 mt-1">{formatCurrencyShort(optimisticValue)}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center mt-4">Distribution of final net worth across {validOutcomes.length} simulations with {volatility}% market volatility.</p>
                            </div>
                        );
                    })()}
                {/* Monte Carlo percentiles over time chart */}
                {results && results.percentileSeries && results.percentileSeries.length > 0 && (
                    <div className="md:col-span-3 mt-4 bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="font-semibold mb-2">Monte Carlo Percentiles Over Time</h4>
                        <MonteCarloChart series={results.percentileSeries} runout={results.runoutProbByYear} plan={plan} />
                    </div>
                )}
                </div>
            )}
        </div>
    );
};

// --- Small inline Monte Carlo Chart component ---
const MonteCarloChart: React.FC<{ series: Array<{ year: number; age1?: number; p10: number; p50: number; p90: number }>; runout?: Array<{ year: number; age1?: number; runoutPct: number }>; plan?: RetirementPlan }> = ({ series, runout, plan }) => {
    if (!series || series.length < 2) return null;

    const width = 680;
    const height = 220;
    const pad = { top: 20, right: 20, bottom: 30, left: 60 };

    const maxVal = Math.max(...series.map(s => s.p90));
    const x = (i: number) => pad.left + (i / (series.length - 1)) * (width - pad.left - pad.right);
    const y = (v: number) => height - pad.bottom - (v / maxVal) * (height - pad.top - pad.bottom);

    const areaPath = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(s.p90)}`).join(' ') +
        ` L ${x(series.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
    const p10Path = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(s.p10)}`).join(' ');
    const p50Path = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(s.p50)}`).join(' ');
    const p90Path = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(s.p90)}`).join(' ');

    // Find first age where runout probability >= 50%
    let firstRunoutYear: { year?: number; age1?: number } | null = null;
    if (runout) {
        const hit = runout.find(r => r.runoutPct >= 50);
        if (hit) firstRunoutYear = { year: hit.year, age1: hit.age1 };
    }

    const [tooltip, setTooltip] = React.useState<{ x: number; y: number; idx: number; data: { year: number; p10: number; p50: number; p90: number; runoutPct?: number; age1?: number } } | null>(null);

    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect.width) return;
        const svgX = (e.clientX - rect.left) * (width / rect.width);
        const chartAreaWidth = width - pad.left - pad.right;
        const pos = svgX - pad.left;
        const ratio = Math.max(0, Math.min(1, pos / chartAreaWidth));
        const idx = Math.round(ratio * (series.length - 1));
        const s = series[idx];
        const run = runout ? runout[idx] : undefined;
        if (s) {
            setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, idx, data: { year: s.year, p10: s.p10, p50: s.p50, p90: s.p90, runoutPct: run?.runoutPct, age1: s.age1 } });
        }
    };

    return (
        <div className="overflow-x-auto relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
                <defs>
                    <linearGradient id="mcArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#86efac" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#86efac" stopOpacity={0.02} />
                    </linearGradient>
                </defs>

                {/* Axis Y ticks */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => {
                    const val = maxVal * t;
                    const yy = y(val);
                    return (
                        <g key={t} className="text-xs text-gray-500">
                            <line x1={pad.left} x2={width - pad.right} y1={yy} y2={yy} stroke="#f3f4f6" />
                            <text x={pad.left - 8} y={yy + 4} textAnchor="end">{formatCurrencyShort(val)}</text>
                        </g>
                    );
                })}

                {/* p10-p90 shaded area */}
                <path d={areaPath} fill="url(#mcArea)" stroke="none" />

                {/* percentile lines */}
                <path d={p10Path} fill="none" stroke="#f97373" strokeWidth={1.2} strokeDasharray="4" />
                <path d={p50Path} fill="none" stroke="#6366f1" strokeWidth={1.6} />
                <path d={p90Path} fill="none" stroke="#16a34a" strokeWidth={1.2} strokeDasharray="4" />

                {/* X axis labels (years) */}
                {series.map((s, i) => ({ s, i })).filter(({ i }) => i % Math.ceil(series.length / 6) === 0).map(({ s, i }) => (
                    <text key={i} x={x(i)} y={height - pad.bottom + 16} textAnchor="middle" className="text-xs text-gray-500">{s.year}</text>
                ))}

                {/* interactive overlay for hover */}
                <rect
                    x={pad.left}
                    y={pad.top}
                    width={width - pad.left - pad.right}
                    height={height - pad.top - pad.bottom}
                    fill="transparent"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setTooltip(null)}
                />

                {/* tooltip marker */}
                {tooltip && (
                    <g transform={`translate(${x(tooltip.idx)},0)`}> 
                        <line y1={pad.top} y2={height - pad.bottom} stroke="#9ca3af" strokeDasharray="4" />
                        <circle cx={0} cy={y(tooltip.data.p50)} r={4} fill="#6366f1" />
                    </g>
                )}

                {/* runout marker */}
                {firstRunoutYear && (
                    (() => {
                        const idx = series.findIndex(s => s.year === firstRunoutYear!.year);
                        if (idx >= 0) {
                            const xx = x(idx);
                            return (
                                <g key="runout-marker">
                                    <line x1={xx} x2={xx} y1={pad.top} y2={height - pad.bottom} stroke="#ef4444" strokeDasharray="4" />
                                    <text x={xx + 6} y={pad.top + 12} className="text-xs text-red-600">50% runout</text>
                                    {firstRunoutYear!.age1 !== undefined && (
                                        <text x={xx + 6} y={pad.top + 26} className="text-xs text-red-600">age {firstRunoutYear!.age1}</text>
                                    )}
                                </g>
                            );
                        }
                        return null;
                    })()
                )}
            </svg>

            {tooltip && (
                <div
                    className="tooltip-popup"
                    style={{ left: `${tooltip.x + 10}px`, top: `${Math.max(8, tooltip.y - 80)}px` }}
                >
                    <p className="font-bold mb-1">{tooltip.data.year} {tooltip.data.age1 !== undefined ? `(age ${tooltip.data.age1})` : ''}</p>
                    <p className="text-xs">10th: {formatCurrencyShort(tooltip.data.p10)}</p>
                    <p className="text-xs">50th: {formatCurrencyShort(tooltip.data.p50)}</p>
                    <p className="text-xs">90th: {formatCurrencyShort(tooltip.data.p90)}</p>
                    {tooltip.data.runoutPct !== undefined && (
                        <p className="text-xs mt-1 text-red-600">Runout: {tooltip.data.runoutPct.toFixed(1)}%</p>
                    )}
                </div>
            )}
        </div>
    );
};