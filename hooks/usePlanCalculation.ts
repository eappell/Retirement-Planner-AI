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
    const [aiProvider, setAiProvider] = useState<string | null>(null);

    const getInsights = useCallback(async (plan: RetirementPlan, results: CalculationResult) => {
        // Prefer explicit env var; default to the local proxy on port 3000 for dev
        const configuredProxy = (import.meta as any).env?.VITE_AI_PROXY_URL || null;
        const defaultProxy = 'http://localhost:3000';
        // Prefer same-origin first so deployed apps that expose /api/insights
        // via their platform (or reverse proxy) work without extra config.
        // NOTE: keep `originApi` as the origin (no trailing `/api`) because
        // `tryFetch` appends `/api/insights` and `/insights` itself. Using
        // origin + '/api' here caused duplicate `/api/api/insights` requests.
        const originApi = window.location.origin.replace(/\/$/, '');
        const candidates: string[] = [originApi];
        if (configuredProxy) candidates.push(configuredProxy.replace(/\/$/, ''));
        // Only include the localhost fallback when the frontend is running
        // on localhost. Browsers will block deployed origins from reaching
        // private address-space endpoints like localhost (Private Network Access).
        if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            candidates.push(defaultProxy);
        }

        let lastError: Error | null = null;

            // If embedded, prefer asking the parent portal to fetch insights via its secure proxy.
            if (window.self !== window.top) {
                try {
                    const requestId = `insights_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
                    const payload = { type: 'REQUEST_INSIGHTS', requestId, plan, result };
                    // Promise that resolves when parent replies with INSIGHTS_RESPONSE
                    const responseFromParent = await new Promise<string | null>((resolve, reject) => {
                        const timer = setTimeout(() => {
                            window.removeEventListener('message', listener);
                            resolve(null);
                        }, 6000);

                        const listener = (event: MessageEvent) => {
                            try {
                                const data = event.data || {};
                                if (data && data.type === 'INSIGHTS_RESPONSE' && data.requestId === requestId) {
                                    clearTimeout(timer);
                                    window.removeEventListener('message', listener);
                                    if (data.error) return resolve(null);
                                    return resolve(data.text || null);
                                }
                            } catch (e) { /* ignore */ }
                        };

                        window.addEventListener('message', listener);
                        // send request to parent portal
                        try { window.parent.postMessage(payload, '*'); } catch (e) { window.removeEventListener('message', listener); clearTimeout(timer); return reject(e); }
                    }).catch(() => null);

                    if (responseFromParent) {
                        setAiProvider('portal-proxy');
                        setAiInsights(responseFromParent);
                        setIsAiLoading(false);
                        return;
                    }
                } catch (e) {
                    console.warn('Portal proxy postMessage failed, falling back to local proxies', e);
                }
            }
        try {
            setIsAiLoading(true);
            setAiInsights('');

            const tryFetch = async (baseUrl: string) => {
                const base = baseUrl.replace(/\/$/, '');
                // Try /api/insights first (server uses this route), then /insights
                const urlsToTry = [`${base}/api/insights`, `${base}/insights`];
                let lastErr: any = null;
                for (const url of urlsToTry) {
                    try {
                        const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan, result: results }),
                        });
                        if (!resp.ok) {
                            const text = await resp.text().catch(() => null);
                            throw new Error(text || `AI proxy error: ${resp.status}`);
                        }
                        const data = await resp.json();
                        // Read provider header if present
                        const providerHeader = resp.headers.get('x-ai-provider') || resp.headers.get('X-AI-Provider');
                        if (providerHeader) setAiProvider(String(providerHeader));
                        return data.text || 'No insights returned.';
                    } catch (e) {
                        lastErr = e;
                        // try next url
                    }
                }
                throw lastErr || new Error('All urls failed');
            };

            let resultText: string | null = null;
            for (const base of candidates) {
                try {
                    // console.debug to help with diagnosing environment-specific failures
                    console.debug('[getInsights] trying AI proxy at', base);
                    resultText = await tryFetch(base);
                    console.debug('[getInsights] success from', base);
                    // Attempt to report the query; don't block the user on failures
                    (async () => {
                        try {
                            const reportUrl = `${base.replace(/\/$/, '')}/report`;
                            await fetch(reportUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ eventType: 'query', application: 'retirement-planner', metadata: { timestamp: new Date().toISOString() } }),
                            });
                        } catch (proxyErr) {
                            try {
                                const trackEvent = httpsCallable(functions, 'trackEvent');
                                await trackEvent({ eventType: 'query', application: 'retirement-planner', metadata: { timestamp: new Date().toISOString() } });
                            } catch (err) {
                                console.warn('Failed to report AI query to portal:', err, proxyErr);
                            }
                        }
                    })();
                    break;
                } catch (err: any) {
                    console.warn('[getInsights] proxy at', base, 'failed:', err && (err.message || err));
                    lastError = err instanceof Error ? err : new Error(String(err));
                    // continue to next candidate
                }
            }

            if (!resultText) {
                console.error('All AI proxy attempts failed.', lastError);
                setAiInsights('AI Insights are currently unavailable. Please try again later.');
            } else {
                setAiInsights(resultText);
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
        setAiProvider(null);
    }, []);

    return {
        isAiLoading,
        aiInsights,
        aiProvider,
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
