import { useState, useCallback, useEffect } from 'react';
import { functions, httpsCallable } from '../services/firebaseClient';
import { RetirementPlan, CalculationResult, YearlyProjection } from '../types';
import { runSimulation } from '../services/simulationService';
// AI requests are proxied through the server-side API at /api/insights
import { estimateSocialSecurityBenefit } from '../services/socialSecurityService';

/**
 * Custom hook for managing retirement plan calculations
 * Handles simulation runs, AI insights, and related state
 */
export const usePlanCalculation = (plan: RetirementPlan | undefined) => {
    const [results, setResults] = useState<CalculationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projectionData, setProjectionData] = useState<YearlyProjection[]>([]);

    const calculatePlan = useCallback(() => {
        if (!plan) return;
        setIsLoading(true);
        setError(null);
        setResults(null);
        setProjectionData([]);
        
        try {
            const simulationResults = runSimulation(plan);
            setResults(simulationResults);
            setProjectionData(simulationResults.yearlyProjections);
        } catch (err: any) {
            console.error("Calculation failed:", err);
            setError(err.message || "An unknown error occurred during calculation.");
        } finally {
            setIsLoading(false);
        }
    }, [plan]);

    return {
        results,
        isLoading,
        error,
        projectionData,
        calculatePlan,
        setResults,
        setError,
    };
};

/**
 * Custom hook for managing AI insights
 */
export const useAIInsights = () => {
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState<string>('');

    const getInsights = useCallback(async (plan: RetirementPlan, results: CalculationResult) => {
        try {
            setIsAiLoading(true);
            setAiInsights('');
            // Send plan+results to the server-side AI proxy
            try {
                const resp = await fetch('/api/insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan, result: results }),
                });
                if (!resp.ok) {
                    const text = await resp.text();
                    throw new Error(text || `AI proxy error: ${resp.status}`);
                }
                const data = await resp.json();
                setAiInsights(data.text || 'No insights returned.');
                // Report AI query to portal
                try {
                    const trackEvent = httpsCallable(functions, 'trackEvent');
                    await trackEvent({
                        eventType: 'query',
                        application: 'retirement-planner',
                        metadata: {
                            timestamp: new Date().toISOString(),
                        },
                    });
                } catch (err) {
                    // Non-blocking
                    console.warn('Failed to report AI query to portal:', err);
                }
            } catch (err: any) {
                console.error('AI proxy call failed:', err);
                setAiInsights('AI Insights are currently unavailable. Please try again later.');
            }
        } catch (error) {
            console.error('Error getting AI insights:', error);
            setAiInsights('Failed to generate insights. Please try again.');
        } finally {
            setIsAiLoading(false);
        }
    }, []);

    const clearInsights = useCallback(() => {
        setAiInsights('');
    }, []);

    return {
        isAiLoading,
        aiInsights,
        getInsights,
        clearInsights,
    };
};

/**
 * Custom hook for auto-calculating social security benefits
 */
export const useSocialSecurityCalculation = (
    plan: RetirementPlan | undefined,
    updateActivePlan: (updater: (prevPlan: RetirementPlan) => RetirementPlan) => void
) => {
    useEffect(() => {
        if (!plan) return;
        const p1Benefit = estimateSocialSecurityBenefit(plan.person1.currentSalary, plan.person1.claimingAge);
        const p2Benefit = estimateSocialSecurityBenefit(plan.person2.currentSalary, plan.person2.claimingAge);
        updateActivePlan(prev => ({
            ...prev,
            socialSecurity: { person1EstimatedBenefit: p1Benefit, person2EstimatedBenefit: p2Benefit }
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plan?.person1.currentSalary, plan?.person1.claimingAge, plan?.person2.currentSalary, plan?.person2.claimingAge]);
};
