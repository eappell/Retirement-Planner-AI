import React, { useMemo } from 'react';
import { CalculationResult } from '../types';
import { IndicatorCard } from './IndicatorCard';

interface ResultsPanelProps {
    results: CalculationResult | null;
    isLoading: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = React.memo(({ results, isLoading }) => {
    const formatCurrency = useMemo(
        () => (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value),
        []
    );
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-brand-background py-4 shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <IndicatorCard 
                title="Avg. Monthly Net Income" 
                value={results && !isLoading ? formatCurrency(results.avgMonthlyNetIncomeFuture) : '---'}
                subValue={results && !isLoading ? `(${formatCurrency(results.avgMonthlyNetIncomeToday)} today's $)` : ''}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="1" y="6" width="22" height="12" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 9.5v5M10 9a1 1 0 012 0 1 1 0 01-2 0M14 15a1 1 0 01-2 0 1 1 0 012 0" /></svg>}
                colorClass="bg-green-500"
            />
                <IndicatorCard 
                title="Final Net Worth" 
                value={results && !isLoading ? formatCurrency(results.netWorthAtEndFuture) : '---'}
                subValue={results && !isLoading ? `(${formatCurrency(results.netWorthAtEnd)} today's $)` : ''}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                colorClass="bg-indigo-500"
            />
                <IndicatorCard 
                title="Federal Tax Rate" 
                value={results && !isLoading ? `${results.federalTaxRate.toFixed(1)}%` : '---'}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.002 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.002 0M18 7l3 9m-3-9l-6-2" /></svg>}
                colorClass="bg-red-500"
            />
                <IndicatorCard 
                title="State Tax Rate" 
                value={results && !isLoading ? `${results.stateTaxRate.toFixed(1)}%` : '---'}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                colorClass="bg-yellow-500"
            />
        </div>
    );
});