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

export interface MonteCarloWorkerResponse {
    type: 'progress' | 'complete';
    progress?: number;
    successRate?: number;
    outcomes?: number[];
}

self.onmessage = (e: MessageEvent<MonteCarloWorkerMessage>) => {
    const { type, plan, numSimulations, volatility } = e.data;

    if (type === 'start') {
        let successfulRuns = 0;
        const finalNetWorths: number[] = [];

        for (let i = 0; i < numSimulations; i++) {
            // Run the simulation with volatility
            const result = runSimulation(plan, volatility);
            const finalNetWorth = result.netWorthAtEndFuture;

            // Store the outcome and check for success
            finalNetWorths.push(finalNetWorth);
            if (finalNetWorth >= plan.legacyAmount) {
                successfulRuns++;
            }

            // Send progress updates every 10% or every 100 simulations (whichever is smaller)
            const progressInterval = Math.min(100, Math.floor(numSimulations / 10));
            if (i > 0 && (i % progressInterval === 0 || i === numSimulations - 1)) {
                const progress = ((i + 1) / numSimulations) * 100;
                self.postMessage({
                    type: 'progress',
                    progress,
                } as MonteCarloWorkerResponse);
            }
        }

        // Send final results
        self.postMessage({
            type: 'complete',
            successRate: (successfulRuns / numSimulations) * 100,
            outcomes: finalNetWorths,
        } as MonteCarloWorkerResponse);
    }
};
