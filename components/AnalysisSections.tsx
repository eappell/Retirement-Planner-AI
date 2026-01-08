import React from 'react';
import { RetirementPlan, CalculationResult, YearlyProjection, MonteCarloResult, PlanType } from '../types';
import { InputSection } from './InputSection';
import { SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { DynamicCharts } from './DynamicCharts';
import { MonteCarloSimulator } from './MonteCarloSimulator';
import { ProjectionTable } from './ProjectionTable';
import { PremiumGate } from './PremiumGate';

interface AnalysisSectionsProps {
    plan: RetirementPlan;
    results: CalculationResult | null;
    isLoading: boolean;
    error: string | null;
    aiInsights: string;
    isAiLoading: boolean;
    aiProvider?: string | null;
    handleGetInsights: () => void;
    projectionData: YearlyProjection[];
    monteCarloResults: MonteCarloResult | null;
    isMcLoading: boolean;
    handleRunSimulation: (numSimulations: number, volatility: number) => void;
    isPremium?: boolean;
    isEmbedded?: boolean;
}

const markdownToHtml = (text: string): string => {
    if (!text) return '';
    const lines = text.split('\n');
    let htmlOutput = '';
    let inList = false;

    for (const line of lines) {
        let processedLine = line;
        
        // Handle bold text first
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Check for headings
        if (processedLine.startsWith('## ')) {
            if (inList) {
                htmlOutput += '</ul>\n';
                inList = false;
            }
            htmlOutput += `<h3>${processedLine.substring(3)}</h3>\n`;
        } 
        else if (processedLine.startsWith('### ')) {
            if (inList) {
                htmlOutput += '</ul>\n';
                inList = false;
            }
            htmlOutput += `<h3>${processedLine.substring(4)}</h3>\n`;
        }
        // Check for list items
        else if (processedLine.startsWith('* ') || processedLine.startsWith('- ')) {
            if (!inList) {
                htmlOutput += '<ul>\n';
                inList = true;
            }
            htmlOutput += `<li>${processedLine.substring(2)}</li>\n`;
        } 
        // Handle empty lines (as paragraph breaks)
        else if (processedLine.trim() === '') {
            if (inList) {
                htmlOutput += '</ul>\n';
                inList = false;
            }
        } 
        // Handle paragraphs
        else {
            if (inList) {
                htmlOutput += '</ul>\n';
                inList = false;
            }
            htmlOutput += `<p>${processedLine}</p>\n`;
        }
    }

    // Close any list that might still be open at the end
    if (inList) {
        htmlOutput += '</ul>\n';
    }

    return htmlOutput;
};


export const AnalysisSections: React.FC<AnalysisSectionsProps> = ({
    plan,
    results,
    isLoading,
    error,
    aiInsights,
    isAiLoading,
    handleGetInsights,
    projectionData,
    monteCarloResults,
    isMcLoading,
    handleRunSimulation,
    isPremium = false,
    isEmbedded = false,
    aiProvider = null,
}) => {
    
    const isCouple = plan.planType === PlanType.COUPLE;
    
    const filteredProjections = projectionData.filter(p => {
        if (isCouple) {
            return p.age1 >= plan.person1.retirementAge || (p.age2 !== undefined && p.age2 >= plan.person2.retirementAge);
        }
        return p.age1 >= plan.person1.retirementAge;
    });

    return (
        <>
            {isLoading && (
                <div className="my-6">
                    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md text-center">
                        <svg className="animate-spin h-8 w-8 text-brand-primary mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-lg font-semibold text-brand-text-primary">Calculating...</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="my-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow" role="alert">
                    <p className="font-bold">An Error Occurred</p>
                    <p>{error}</p>
                </div>
            )}
            
            <InputSection title="AI Powered Insights" subtitle="Get personalized tips based on your plan." titleColorClass="text-purple-600">
                <div className="col-span-full">
                <PremiumGate 
                    isAllowed={isPremium} 
                    featureName="AI-Powered Insights"
                    message="Unlock AI-powered retirement planning insights with Premium. Get personalized recommendations based on your unique financial situation."
                    showUpgradeButton={isEmbedded}
                >
                    <button 
                        onClick={handleGetInsights} 
                        disabled={isAiLoading || !results || !!aiInsights} 
                        className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-gray-400 inline-flex items-center"
                        title={aiInsights ? 'AI Insight already generated for this scenario' : undefined}
                    >
                        <SparklesIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                        {isAiLoading ? 'Analyzing...' : aiInsights ? 'AI Insight Generated' : 'Generate AI Insights'}
                    </button>
                    {aiInsights && (
                        <div className="mt-4 p-4 border rounded-md dark:border-purple-700">
                            <div className="prose prose-sm max-w-none ai-insights dark:prose-invert" dangerouslySetInnerHTML={{__html: markdownToHtml(aiInsights)}}></div>
                        </div>
                    )}
                </PremiumGate>
                </div>
            </InputSection>

            <InputSection title="Charts & Analysis" subtitle="Visualize your retirement projections." titleColorClass="text-yellow-600">
            <div className="col-span-full">
                { !isLoading && !error && results && <DynamicCharts projectionData={projectionData} plan={plan} /> }
            </div>
            </InputSection>

            <InputSection
                title={<span className="inline-flex items-center space-x-2"><ChartBarIcon className="h-6 w-6 mr-2 text-emerald-600" /><span>Monte Carlo Simulation</span><span className="relative inline-flex group">
                    <span className="text-gray-400 hover:text-gray-600 focus:text-gray-700" aria-hidden="true" tabIndex={-1}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
                    </span>
                    <div role="tooltip" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-100 text-gray-900 text-[0.95rem] p-2.5 text-left rounded shadow border border-gray-200 hidden group-hover:block z-10 font-normal">
                        <div>Monte Carlo Simulation</div>
                        <div className="mt-1 text-sm">Run many randomized market-return simulations to estimate a distribution of possible outcomes for your plan. Increase the number of simulations or volatility to stress-test resilience against market swings.</div>
                    </div>
                </span></span>}
                subtitle="Stress-test your plan against market volatility."
                titleColorClass="text-emerald-600"
            >
            <div className="col-span-full">
                <PremiumGate 
                    isAllowed={isPremium} 
                    featureName="Monte Carlo Simulation"
                    message="Unlock advanced Monte Carlo simulations with Premium. Test your retirement plan against thousands of market scenarios to understand the probability of success."
                    showUpgradeButton={isEmbedded}
                >
                    <MonteCarloSimulator
                        onRunSimulation={handleRunSimulation}
                        results={monteCarloResults}
                        isLoading={isMcLoading}
                        plan={plan}
                    />
                </PremiumGate>
            </div>
        </InputSection>

            { !isLoading && !error && filteredProjections.length > 0 && (
            <InputSection title="Annual Projection" subtitle="A year-by-year breakdown of your monthly retirement income and finances." titleColorClass="text-gray-600" gridCols={1}>
                <div className="col-span-full">
                    <ProjectionTable data={filteredProjections} plan={plan} />
                </div>
            </InputSection>
            )}
        </>
    );
};