import { RetirementPlan } from '../types';
import { runSimulation } from './simulationService';

export const runMonteCarloSimulation = (
    plan: RetirementPlan,
    numSimulations: number,
    volatility: number
): { successRate: number; outcomes: number[] } => {
    let successfulRuns = 0;
    const finalNetWorths: number[] = [];
    // We'll collect per-year net worth across all simulations so we can compute
    // percentile series (e.g., 10th/50th/90th) and runout probabilities by year.
    const allSimYearlyNetWorths: number[][] = [];
    let yearsFingerprint: { year: number; age1?: number }[] | null = null;

    for (let i = 0; i < numSimulations; i++) {
        const result = runSimulation(plan, volatility);
        const yearly = result.yearlyProjections || [];

        // Capture years/ages from the first simulation to map indexes to calendar years
        if (!yearsFingerprint && yearly.length > 0) {
            yearsFingerprint = yearly.map(y => ({ year: y.year, age1: y.age1 }));
        }

        // push net worth series for this simulation
        const simNetWorths = yearly.map(y => y.netWorth);
        if (simNetWorths.length > 0) {
            allSimYearlyNetWorths.push(simNetWorths);
        }

        const finalNetWorth = result.netWorthAtEndFuture;
        finalNetWorths.push(finalNetWorth);
        if (finalNetWorth >= plan.legacyAmount) {
            successfulRuns++;
        }
    }

    // Build percentile series per year
    const percentileSeries: Array<{ year: number; age1?: number; p10: number; p50: number; p90: number }> = [];
    const runoutProbByYear: Array<{ year: number; age1?: number; runoutPct: number }> = [];

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

    return {
        successRate: (successfulRuns / numSimulations) * 100,
        outcomes: finalNetWorths,
        useFatTails: plan.useFatTails,
        fatTailDf: plan.fatTailDf,
        percentileSeries,
        runoutProbByYear,
    } as any;
};