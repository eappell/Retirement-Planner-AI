import React from 'react';
import { CalculationResult } from '../types';
import { IndicatorCard } from './IndicatorCard';

interface ResultsPanelProps {
    results: CalculationResult | null;
    isLoading: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, isLoading }) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sticky top-[64px] z-10 bg-brand-background py-4 shadow-sm -mx-8 px-8">
            <IndicatorCard 
                title="Avg. Monthly Net Income" 
                value={results && !isLoading ? formatCurrency(results.avgMonthlyNetIncomeFuture) : '---'}
                subValue={results && !isLoading ? `(${formatCurrency(results.avgMonthlyNetIncomeToday)} today's $)` : ''}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm-5-5a2 2 0 114 0 2 2 0 01-4 0z" /></svg>}
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
};