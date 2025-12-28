import React, { useMemo, useContext } from 'react';
import { CalculationResult, RetirementPlan } from '../types';
import { IndicatorCard } from './IndicatorCard';
import { BanknotesIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { ThemeContext } from '../contexts/ThemeContext';

interface ResultsPanelProps {
    results: CalculationResult | null;
    isLoading: boolean;
    plan?: RetirementPlan | null;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = React.memo(({ results, isLoading, plan }) => {
    const themeCtx = useContext(ThemeContext);
    const theme = themeCtx?.theme ?? 'light';
    const surplusColorClass = theme === 'dark' ? 'bg-indigo-500' : 'bg-teal-500';
    const formatCurrency = useMemo(
        () => (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value),
        []
    );
    
    return (<>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 bg-brand-background py-4 shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <IndicatorCard 
                title="Avg. Monthly Net Income" 
                value={results && !isLoading ? formatCurrency(results.avgMonthlyNetIncomeFuture) : '---'}
                subValue={results && !isLoading ? `(${formatCurrency(results.avgMonthlyNetIncomeToday)} today's $)` : ''}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="1" y="6" width="22" height="12" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 9.5v5M10 9a1 1 0 012 0 1 1 0 01-2 0M14 15a1 1 0 01-2 0 1 1 0 012 0" /></svg>}
                colorClass="bg-green-500"
            />
                <IndicatorCard
                title="Avg. Monthly Surplus"
                value={results && !isLoading ? formatCurrency(results.avgMonthlySurplusFuture) : '---'}
                subValue={results && !isLoading ? `(${formatCurrency(results.avgMonthlySurplusToday)} today's $)` : ''}
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                }
                colorClass={surplusColorClass}
            />
                <IndicatorCard 
                title="Final Net Worth" 
                value={results && !isLoading ? formatCurrency(results.netWorthAtEndFuture) : '---'}
                subValue={results && !isLoading ? `(${formatCurrency(results.netWorthAtEnd)} today's $)` : ''}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                colorClass="bg-indigo-500"
            />
                <IndicatorCard
                title="Avg Annual Income"
                value={results && !isLoading ? (results.yearlyProjections && results.yearlyProjections.length > 0 ? formatCurrency(Math.round(results.yearlyProjections.reduce((a,b) => a + b.grossIncome, 0) / results.yearlyProjections.length)) : '---') : '---'}
                subValue={results && !isLoading ? (results.yearlyProjections && results.yearlyProjections.length > 0 ? `(avg over ${results.yearlyProjections.length} years)` : '') : ''}
                icon={<BanknotesIcon className="h-6 w-6 text-white" />}
                colorClass="bg-yellow-500"
            />
                <IndicatorCard
                title="Taxes"
                value={
                    results && !isLoading ? (
                        <div className="flex flex-col text-sm">
                            <div>Federal: <span className="font-bold">{results.federalTaxRate.toFixed(1)}%</span></div>
                            <div>State: <span className="font-bold">{results.stateTaxRate.toFixed(1)}%</span></div>
                        </div>
                    ) : '---'
                }
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <ellipse cx="12" cy="4.5" rx="6" ry="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 4.5v2.5c0 1.1 2.7 2 6 2s6-.9 6-2V4.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <ellipse cx="12" cy="9.5" rx="6" ry="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 9.5v2.5c0 1.1 2.7 2 6 2s6-.9 6-2V9.5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        <ellipse cx="12" cy="14.5" rx="6" ry="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                }
                colorClass="bg-red-500"
            />
        </div>
        {plan?.useFatTails && (
            <div className="mt-2 px-4 sm:px-6 lg:px-8">
                <p className="text-xs text-gray-500">Note: Fat-tailed sampling is enabled — amounts may be randomized slightly each time projections are computed.</p>
            </div>
        )}
        <hr className="my-4" />
    </>);
});