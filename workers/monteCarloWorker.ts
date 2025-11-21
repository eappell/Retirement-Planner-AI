/**
 * Web Worker for running Monte Carlo simulations off the main thread
 * This prevents UI blocking during intensive calculations
 */

import { RetirementPlan } from '../types';
import { runSimulation } from '../services/simulationService';

export interface MonteCarloWorkerMessage {
    type: 'start';
    plan: RetirementPlan;
    numSimulations: number;
    volatility: number;
}

export interface PercentilePoint {
    year: number;
    age1?: number;
    p10: number;
    p50: number;
    p90: number;
}

export interface RunoutPoint {
    year: number;
    age1?: number;
    runoutPct: number;
}

export interface MonteCarloWorkerResponse {
    type: 'progress' | 'complete';
    progress?: number;
    successRate?: number;
    outcomes?: number[];
    // Aggregated series computed in-worker
    percentileSeries?: PercentilePoint[];
    runoutProbByYear?: RunoutPoint[];
    useFatTails?: boolean;
    fatTailDf?: number | undefined;
}

self.onmessage = (e: MessageEvent<MonteCarloWorkerMessage>) => {
    const { type, plan, numSimulations, volatility } = e.data;

    if (type === 'start') {
        let successfulRuns = 0;
        const finalNetWorths: number[] = [];

        // Collect per-simulation per-year net worth so we can compute percentiles by year
        const allSimYearlyNetWorths: number[][] = [];
        let yearsFingerprint: { year: number; age1?: number }[] | null = null;

        for (let i = 0; i < numSimulations; i++) {
            const result = runSimulation(plan, volatility);
            const yearly = result.yearlyProjections || [];

            if (!yearsFingerprint && yearly.length > 0) {
                yearsFingerprint = yearly.map(y => ({ year: y.year, age1: y.age1 }));
            }

            const simNetWorths = yearly.map(y => y.netWorth);
            if (simNetWorths.length > 0) {
                allSimYearlyNetWorths.push(simNetWorths);
            }

            const finalNetWorth = result.netWorthAtEndFuture;
            finalNetWorths.push(finalNetWorth);
            if (finalNetWorth >= plan.legacyAmount) {
                successfulRuns++;
            }

            // Progress updates
            const progressInterval = Math.min(100, Math.floor(numSimulations / 10) || 1);
            if (i > 0 && (i % progressInterval === 0 || i === numSimulations - 1)) {
                const progress = ((i + 1) / numSimulations) * 100;
                self.postMessage({ type: 'progress', progress } as MonteCarloWorkerResponse);
            }
        }

        // Compute percentile series and runout probabilities per year
        const percentileSeries: PercentilePoint[] = [];
        const runoutProbByYear: RunoutPoint[] = [];

        if (allSimYearlyNetWorths.length > 0 && yearsFingerprint) {
            const yearsCount = yearsFingerprint.length;
            for (let yi = 0; yi < yearsCount; yi++) {
                const values = allSimYearlyNetWorths.map(sim => sim[yi] ?? NaN).filter(v => isFinite(v));
                if (values.length === 0) continue;
                values.sort((a, b) => a - b);

                const idx = (p: number) => {
                    const pos = p * (values.length - 1);
                    const lo = Math.floor(pos);
                    const hi = Math.ceil(pos);
                    if (lo === hi) return values[lo];
                    const mix = pos - lo;
                    return values[lo] * (1 - mix) + values[hi] * mix;
                };

                const p10 = idx(0.10);
                const p50 = idx(0.50);
                const p90 = idx(0.90);

                const runoutCount = values.filter(v => v <= 0).length;
                const runoutPct = (runoutCount / values.length) * 100;

                percentileSeries.push({ year: yearsFingerprint[yi].year, age1: yearsFingerprint[yi].age1, p10, p50, p90 });
                runoutProbByYear.push({ year: yearsFingerprint[yi].year, age1: yearsFingerprint[yi].age1, runoutPct });
            }
        }

        // Send final results including aggregated series
        self.postMessage({
            type: 'complete',
            successRate: (successfulRuns / numSimulations) * 100,
            outcomes: finalNetWorths,
            percentileSeries,
            runoutProbByYear,
            useFatTails: plan.useFatTails,
            fatTailDf: plan.fatTailDf,
        } as MonteCarloWorkerResponse);
    }
};
