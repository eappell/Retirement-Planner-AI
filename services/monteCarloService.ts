import { RetirementPlan } from '../types';
import { runSimulation } from './simulationService'; // Import the main simulation engine

// Helper function to get a random number from a normal distribution (Box-Muller transform)
const randomNormal = (mean: number, stdDev: number): number => {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random(); //Converting [0,1) to (0,1)
    while (u2 === 0) u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
};

export const runMonteCarloSimulation = (
    plan: RetirementPlan,
    numSimulations: number,
    volatility: number
): { successRate: number; outcomes: number[] } => {
    let successfulRuns = 0;
    const finalNetWorths: number[] = [];
    const stdDev = volatility / 100;

    for (let i = 0; i < numSimulations; i++) {
        // Create a deep copy of the plan for this simulation run
        const simPlan = JSON.parse(JSON.stringify(plan));

        // Apply market volatility to the global average return for this specific run
        const randomReturn = randomNormal(plan.avgReturn / 100, stdDev);
        simPlan.avgReturn = randomReturn * 100;

        // Run the complete, original simulation with the modified returns
        const result = runSimulation(simPlan);

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