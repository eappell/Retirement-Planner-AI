import { RetirementPlan } from '../types';
import { runSimulation } from './simulationService';

// FIX: Make the function async and await the `runSimulation` call, as it returns a Promise.
// The function's return type is also updated to be a Promise.
export const runMonteCarloSimulation = async (
    plan: RetirementPlan,
    numSimulations: number,
    volatility: number
): Promise<{ successRate: number; outcomes: number[] }> => {
    let successfulRuns = 0;
    const finalNetWorths: number[] = [];

    for (let i = 0; i < numSimulations; i++) {
        // Run the main simulation, passing the volatility parameter.
        // The simulation engine will handle applying random returns for each year.
        const result = await runSimulation(plan, volatility);

        const finalNetWorth = result.netWorthAtEndFuture;

        // Store the outcome and check for success
        finalNetWorths.push(finalNetWorth);
        if (finalNetWorth >= plan.legacyAmount) {
            successfulRuns++;
        }
    }
    
    return {
        successRate: (successfulRuns / numSimulations) * 100,
        outcomes: finalNetWorths,
    };
};
