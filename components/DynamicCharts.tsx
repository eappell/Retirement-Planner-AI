import React, { useState, useMemo } from 'react';
import { YearlyProjection, RetirementPlan, Person } from '../types';
import { cloneArray } from '../utils/deepClone';
import './DynamicCharts.css';

interface DynamicChartsProps {
  projectionData: YearlyProjection[];
  plan: RetirementPlan;
}

const formatCurrencyShort = (value: number) => {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
};

// --- New Scenario Chart ---
interface ScenarioData {
    year: number;
    pessimistic: number;
    average: number;
    optimistic: number;
}

// A simplified simulation to generate scenario data for the chart
const generateScenarioData = (plan: RetirementPlan): ScenarioData[] => {
    const scenarios = [-0.02, 0, 0.02]; // Pessimistic, Average, Optimistic adjustments
    const results: number[][] = [[], [], []];

    const isCouple = plan.planType === 'Couple';
    const startAge = Math.min(plan.person1.currentAge, isCouple ? plan.person2.currentAge : Infinity);
    const endAge = Math.max(plan.person1.lifeExpectancy, isCouple ? plan.person2.lifeExpectancy : 0);
    const simulationYears = endAge - startAge;

    // Asset-class defaults
    const STOCK_MEAN_DEFAULT = 0.08;
    const BOND_MEAN_DEFAULT = 0.03;

    scenarios.forEach((adjustment, index) => {
        let retirementAccounts = cloneArray(plan.retirementAccounts);
        let investmentAccounts = cloneArray(plan.investmentAccounts);
        
        for (let year = 0; year <= simulationYears; year++) {
            const currentAge1 = plan.person1.currentAge + year;
            const currentAge2 = isCouple ? plan.person2.currentAge + year : 0;
            const isP1Retired = currentAge1 >= plan.person1.retirementAge;
            const isP2Retired = isCouple && currentAge2 >= plan.person2.retirementAge;

            // Grow assets
            retirementAccounts.forEach(acc => {
                const owner = plan[acc.owner as keyof typeof plan] as Person;
                const ownerAge = acc.owner === 'person1' ? currentAge1 : currentAge2;
                if(ownerAge < owner.retirementAge) {
                     const employerMatch = (owner.currentSalary * (acc.match / 100));
                     acc.balance += acc.annualContribution + employerMatch;
                }
                acc.balance *= (1 + (plan.avgReturn / 100) + adjustment);
            });
            // For investment accounts, compute portfolio-weighted bias from plan.avgReturn and optional plan overrides
            const totalInvBal = investmentAccounts.reduce((s, a) => s + (a.balance || 0), 0);
            let portfolioStocksPct = 0;
            if (totalInvBal > 0) {
                const stocksWeight = investmentAccounts.reduce((s, a) => s + ((a.balance || 0) * ((a.percentStocks ?? 60) / 100)), 0);
                portfolioStocksPct = stocksWeight / totalInvBal;
            } else {
                const n = investmentAccounts.length || 1;
                portfolioStocksPct = (investmentAccounts.reduce((s, a) => s + (a.percentStocks ?? 60), 0) / n) / 100;
            }
            const baseStock = (plan.stockMean !== undefined ? plan.stockMean / 100 : STOCK_MEAN_DEFAULT);
            const baseBond = (plan.bondMean !== undefined ? plan.bondMean / 100 : BOND_MEAN_DEFAULT);
            const portfolioBaseAvg = portfolioStocksPct * baseStock + (1 - portfolioStocksPct) * baseBond;
            const desiredAvg = plan.avgReturn / 100;
            const delta = desiredAvg - portfolioBaseAvg;
            const stockReturn = baseStock + delta + adjustment;
            const bondReturn = baseBond + delta + adjustment;
            investmentAccounts.forEach(acc => {
                const owner = plan[acc.owner as keyof typeof plan] as Person;
                const ownerAge = acc.owner === 'person1' ? currentAge1 : currentAge2;
                if(ownerAge < owner.retirementAge) {
                    acc.balance += acc.annualContribution;
                }
                const stocksPct = (acc.percentStocks !== undefined) ? Number(acc.percentStocks) / 100 : 0.6;
                const bondsPct = (acc.percentBonds !== undefined) ? Number(acc.percentBonds) / 100 : (1 - stocksPct);
                const accountReturn = stocksPct * stockReturn + bondsPct * bondReturn;
                acc.balance *= (1 + accountReturn);
            });
            
            // Simplified withdrawal
            if(isP1Retired || isP2Retired) {
                const totalAssets = [...retirementAccounts, ...investmentAccounts].reduce((s, a) => s + a.balance, 0);
                const withdrawalAmount = totalAssets * (plan.annualWithdrawalRate / 100);
                 if (withdrawalAmount > 0 && totalAssets > 0) {
                     const rate = Math.min(1, withdrawalAmount / totalAssets);
                     retirementAccounts.forEach(a => a.balance *= (1 - rate));
                     investmentAccounts.forEach(a => a.balance *= (1 - rate));
                 }
            }

            const currentNetWorth = [...retirementAccounts, ...investmentAccounts].reduce((s, a) => s + a.balance, 0);
            results[index].push(currentNetWorth);
        }
    });

    return Array.from({ length: simulationYears + 1 }, (_, i) => ({
        year: new Date().getFullYear() + i,
        pessimistic: results[0][i],
        average: results[1][i],
        optimistic: results[2][i],
    }));
};


// --- The Components ---

const NetWorthScenarioChart: React.FC<{ scenarioData: ScenarioData[]; giftsByYear?: Record<number, number> }> = ({ scenarioData, giftsByYear }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; data: ScenarioData } | null>(null);

    if (scenarioData.length < 2) return null;

    // Compact chart sizing for a tighter layout
    const width = 420;
    const height = 180;
    const padding = { top: 16, right: 12, bottom: 26, left: 50 };

    const maxNetWorth = Math.max(...scenarioData.map(d => d.optimistic));
    const minYear = scenarioData[0].year;
    const maxYear = scenarioData[scenarioData.length - 1].year;

    const xScale = (year: number) => padding.left + (year - minYear) / (maxYear - minYear) * (width - padding.left - padding.right);
    const yScale = (value: number) => height - padding.bottom - (value / maxNetWorth) * (height - padding.top - padding.bottom);

    const createPath = (dataKey: keyof Omit<ScenarioData, 'year'>) => 
        scenarioData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.year)} ${yScale(d[dataKey])}`).join(' ');

    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect.width) return; // Avoid division by zero if element isn't rendered yet

        // The SVG is scaled via viewBox. We need to convert mouse coordinates (screen pixels)
        // into the SVG's internal coordinate system.
        const svgX = (e.clientX - rect.left) * (width / rect.width);

        // Calculate the index based on the position within the chart's drawing area.
        const chartAreaWidth = width - padding.left - padding.right;
        const positionInChart = svgX - padding.left;

        // Calculate the ratio (0 to 1) of how far the mouse is across the chart and clamp it.
        const ratio = Math.max(0, Math.min(1, positionInChart / chartAreaWidth));
        
        // Find the closest data point based on the ratio.
        const yearIndex = Math.round(ratio * (scenarioData.length - 1));
        const dataPoint = scenarioData[yearIndex];
        
        if (dataPoint) {
            // Use original mouse coordinates for the tooltip popup to keep it near the cursor.
            setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, data: dataPoint });
        }
    };
    
    return (
        <div>
            <h4 className="font-semibold text-center mb-2 text-sm">Projected Net Worth Scenarios</h4>
            <div className="relative">
                 <svg viewBox={`0 0 ${width} ${height}`} className="w-full networth-chart">
                    {/* Y Axis */}
                    <g className="text-xs text-gray-500">
                        {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                            const value = maxNetWorth * tick;
                            const y = yScale(value);
                            return (
                                <g key={tick}>
                                    <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e5e7eb" />
                                    <text x={padding.left - 8} y={y + 4} textAnchor="end">{formatCurrencyShort(value)}</text>
                                </g>
                            );
                        })}
                    </g>
                    {/* X Axis */}
                    <g className="text-xs text-gray-500">
                        {scenarioData.filter((_, i) => i % Math.ceil(scenarioData.length / 5) === 0).map(d => {
                            const x = xScale(d.year);
                            return (
                                <text key={d.year} x={x} y={height - padding.bottom + 15} textAnchor="middle">{d.year}</text>
                            );
                        })}
                    </g>

                    {/* Lines */}
                    <path d={createPath('pessimistic')} fill="none" stroke="#fca5a5" strokeWidth="1.5" strokeDasharray="4" />
                    <path d={createPath('average')} fill="none" stroke="#6366f1" strokeWidth="1.8" />
                    <path d={createPath('optimistic')} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4" />

                    {/* Interactive overlay */}
                    <rect 
                        x={padding.left}
                        y={padding.top}
                        width={width - padding.left - padding.right}
                        height={height - padding.top - padding.bottom}
                        fill="transparent"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setTooltip(null)}
                    />

                    {/* Tooltip */}
                    {tooltip && (
                         <g transform={`translate(${xScale(tooltip.data.year)}, 0)`}>
                            <line y1={padding.top} y2={height - padding.bottom} stroke="#9ca3af" strokeDasharray="4" />
                            <circle cx="0" cy={yScale(tooltip.data.pessimistic)} r="4" fill="#fca5a5" />
                            <circle cx="0" cy={yScale(tooltip.data.average)} r="4" fill="#6366f1" />
                            <circle cx="0" cy={yScale(tooltip.data.optimistic)} r="4" fill="#22c55e" />
                        </g>
                    )}
                </svg>
                 {tooltip && (
                    <div className="tooltip-popup" style={{ left: `${tooltip.x + 10}px`, top: `${tooltip.y - 40}px` }}>
                        <p className="font-bold mb-1">{tooltip.data.year}</p>
                        <p className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>Optimistic: {formatCurrencyShort(tooltip.data.optimistic)}</p>
                        <p className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>Average: {formatCurrencyShort(tooltip.data.average)}</p>
                        <p className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-2"></span>Pessimistic: {formatCurrencyShort(tooltip.data.pessimistic)}</p>
                        {giftsByYear && (giftsByYear[tooltip.data.year] || 0) > 0 && (
                            <p className="flex items-center"><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2"></span>Gifts: {formatCurrencyShort(giftsByYear[tooltip.data.year] || 0)}</p>
                        )}
                    </div>
                )}
            </div>
            <div className="flex justify-center space-x-4 text-xs mt-2">
                <span className="flex items-center"><div className="w-8 h-0.5 bg-green-500/50 border-y border-dashed border-green-500 mr-2"></div>Optimistic (+2%)</span>
                <span className="flex items-center"><div className="w-8 h-0.5 bg-indigo-500 mr-2"></div>Average</span>
                <span className="flex items-center"><div className="w-8 h-0.5 bg-red-400/50 border-y border-dashed border-red-400 mr-2"></div>Pessimistic (-2%)</span>
            </div>
        </div>
    );
};

// --- Compact Average Area Chart (lightweight, no external deps) ---
const AverageAreaChart: React.FC<{ scenarioData: ScenarioData[] }> = ({ scenarioData }) => {
    if (!scenarioData || scenarioData.length < 2) return null;

    const w = 420;
    const h = 120;
    const pad = { top: 8, right: 8, bottom: 20, left: 36 };

    const maxVal = Math.max(...scenarioData.map(d => d.average));
    const minYear = scenarioData[0].year;
    const maxYear = scenarioData[scenarioData.length - 1].year;

    const x = (year: number) => pad.left + (year - minYear) / (maxYear - minYear) * (w - pad.left - pad.right);
    const y = (val: number) => h - pad.bottom - (val / maxVal) * (h - pad.top - pad.bottom);

    const linePath = scenarioData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.year)} ${y(d.average)}`).join(' ');
    const areaPath = `${scenarioData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.year)} ${y(d.average)}`).join(' ')} L ${x(maxYear)} ${h - pad.bottom} L ${x(minYear)} ${h - pad.bottom} Z`;

    const [tooltip, setTooltip] = React.useState<{ x: number; y: number; data: ScenarioData } | null>(null);

    const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (!rect.width) return;
        const svgX = (e.clientX - rect.left) * (w / rect.width);
        const chartAreaWidth = w - pad.left - pad.right;
        const positionInChart = svgX - pad.left;
        const ratio = Math.max(0, Math.min(1, positionInChart / chartAreaWidth));
        const yearIndex = Math.round(ratio * (scenarioData.length - 1));
        const dataPoint = scenarioData[yearIndex];
        if (dataPoint) {
            setTooltip({ x: (e.clientX - rect.left), y: (e.clientY - rect.top), data: dataPoint });
        }
    };

    return (
        <div className="relative">
            <h4 className="font-semibold text-center mb-2 text-sm">Avg Net Worth Trend (Area)</h4>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full small-area-chart">
                <defs>
                    <linearGradient id="avgGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                {/* area */}
                <path d={areaPath} fill="url(#avgGrad)" stroke="none" />
                {/* line */}
                <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={1.5} />

                {/* X axis labels */}
                {scenarioData.filter((_, i) => i % Math.ceil(scenarioData.length / 4) === 0).map(d => (
                    <text key={d.year} x={x(d.year)} y={h - pad.bottom + 14} textAnchor="middle" className="text-xs text-gray-500">{d.year}</text>
                ))}

                {/* interactive overlay */}
                <rect
                    x={pad.left}
                    y={pad.top}
                    width={w - pad.left - pad.right}
                    height={h - pad.top - pad.bottom}
                    fill="transparent"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setTooltip(null)}
                />

                {/* marker */}
                {tooltip && (
                    <g transform={`translate(${x(tooltip.data.year)}, 0)`}> 
                        <line y1={pad.top} y2={h - pad.bottom} stroke="#9ca3af" strokeDasharray="4" />
                        <circle cx={0} cy={y(tooltip.data.average)} r={3} fill="#6366f1" />
                    </g>
                )}
            </svg>

            {tooltip && (
                <div
                    className="tooltip-popup chart-tooltip"
                    style={{ ['--tp-x' as any]: `${tooltip.x + 10}px`, ['--tp-y' as any]: `${tooltip.y - 40}px` }}
                >
                    <p className="font-bold mb-1">{tooltip.data.year}</p>
                    <p>Avg Net Worth: {formatCurrencyShort(tooltip.data.average)}</p>
                </div>
            )}
        </div>
    );
};

// --- Income Breakdown Chart ---
const IncomeBreakdownChart: React.FC<{ projectionData: YearlyProjection[] }> = ({ projectionData }) => {
    
    const firstRetirementYearData = projectionData.find(p => p.grossIncome > 0);
    if (!firstRetirementYearData) return <p>No retirement income to display.</p>;
    
    const incomeSources = [
        { label: 'Withdrawals', value: firstRetirementYearData.withdrawal || 0, color: '#6366f1' },
        { label: 'Social Security', value: firstRetirementYearData.socialSecurityIncome || 0, color: '#3b82f6' },
        { label: 'Pensions', value: firstRetirementYearData.pensionIncome || 0, color: '#0ea5e9' },
        { label: 'Other Income', value: firstRetirementYearData.otherIncome || 0, color: '#14b8a6' },
        { label: 'Gifts', value: firstRetirementYearData.gifts || 0, color: '#fbbf24' },
    ].filter(s => s.value > 0);

    const totalIncome = incomeSources.reduce((sum, s) => sum + s.value, 0);
    if (totalIncome === 0) return null;

    return (
        <div>
            <h4 className="font-semibold text-center mb-2 text-brand-text-primary">Income Breakdown (First Year of Retirement)</h4>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 flex overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                {incomeSources.map(source => (
                    <div 
                        key={source.label}
                        className="transition-all duration-500"
                        style={{ 
                            width: `${(source.value / totalIncome) * 100}%`, 
                            minWidth: '2px',
                            backgroundColor: source.color
                        }}
                        title={`${source.label}: ${formatCurrencyShort(source.value)}`}
                    ></div>
                ))}
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs mt-2 text-brand-text-secondary">
                {incomeSources.map(source => (
                     <span key={source.label} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: source.color }}></div>
                        {source.label} ({((source.value / totalIncome) * 100).toFixed(0)}%)
                    </span>
                ))}
            </div>
        </div>
    );
};


// --- Main Component ---
export const DynamicCharts: React.FC<DynamicChartsProps> = ({ projectionData, plan }) => {
    const scenarioData = useMemo(() => generateScenarioData(plan), [plan]);
    const giftsByYear = useMemo(() => {
        return projectionData.reduce((map: Record<number, number>, p) => {
            if (p.year !== undefined) map[p.year] = (map[p.year] || 0) + (p.gifts || 0);
            return map;
        }, {} as Record<number, number>);
    }, [projectionData]);
    
    const retirementProjections = projectionData.filter(p => {
        if (plan.planType === 'Couple') {
            return p.age1 >= plan.person1.retirementAge || (p.age2 !== undefined && p.age2 >= plan.person2.retirementAge);
        }
        return p.age1 >= plan.person1.retirementAge;
    });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="col-span-1">
                <NetWorthScenarioChart scenarioData={scenarioData} giftsByYear={giftsByYear} />
            </div>
            <div className="col-span-1">
                <AverageAreaChart scenarioData={scenarioData} />
            </div>
            <div className="col-span-1 sm:col-span-2">
                <IncomeBreakdownChart projectionData={retirementProjections} />
            </div>
        </div>
    );
};