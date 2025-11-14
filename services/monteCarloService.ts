
import { RetirementPlan } from '../types';

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
        let retirementAccounts = JSON.parse(JSON.stringify(plan.retirementAccounts));
        let investmentAccounts = JSON.parse(JSON.stringify(plan.investmentAccounts));

        const isCouple = plan.planType === 'Couple';
        const startAge = Math.min(plan.person1.currentAge, isCouple ? plan.person2.currentAge : Infinity);
        const endAge = Math.max(plan.person1.lifeExpectancy, isCouple ? plan.person2.lifeExpectancy : 0);
        const simulationYears = endAge - startAge;
        
        for (let year = 0; year <= simulationYears; year++) {
             const currentAge1 = plan.person1.currentAge + year;
             const currentAge2 = isCouple ? plan.person2.currentAge + year : 0;
             const p1Alive = currentAge1 <= plan.person1.lifeExpectancy;
             const p2Alive = isCouple && currentAge2 <= plan.person2.lifeExpectancy;

            // Asset Growth with volatility
            retirementAccounts.forEach(acc => {
                const randomReturn = randomNormal(acc.avgReturn / 100, stdDev);
                const owner = plan[acc.owner as keyof typeof plan] as any;
                const ownerAge = acc.owner === 'person1' ? currentAge1 : currentAge2;
                if(ownerAge < owner.retirementAge) {
                    const employerMatch = (owner.currentSalary * (acc.match / 100));
                    acc.balance += acc.annualContribution + employerMatch;
                }
                acc.balance *= (1 + randomReturn);
            });

            investmentAccounts.forEach(acc => {
                const randomReturn = randomNormal(acc.avgReturn / 100, stdDev);
                 const owner = plan[acc.owner as keyof typeof plan] as any;
                const ownerAge = acc.owner === 'person1' ? currentAge1 : currentAge2;
                if(ownerAge < owner.retirementAge) {
                    acc.balance += acc.annualContribution;
                }
                acc.balance *= (1 + randomReturn);
            });

            // Simplified withdrawal logic for speed
            const isP1Retired = currentAge1 >= plan.person1.retirementAge;
            const isP2Retired = isCouple && currentAge2 >= plan.person2.retirementAge;
            const inRetirement = isP1Retired || isP2Retired;

            if (inRetirement && (p1Alive || p2Alive)) {
                 let fixedIncome = 0;
                 // Simplified SS and Pensions for MC simulation speed
                 if (currentAge1 >= plan.person1.claimingAge) fixedIncome += plan.socialSecurity.person1EstimatedBenefit * 12;
                 if (isCouple && currentAge2 >= plan.person2.claimingAge) fixedIncome += plan.socialSecurity.person2EstimatedBenefit * 12;
                 
                 plan.pensions.forEach(p => {
                    const ownerAge = p.owner === 'person1' ? currentAge1 : currentAge2;
                    if (ownerAge >= p.startAge) fixedIncome += p.monthlyBenefit * 12;
                 });

                 let annualExpenses = 0;
                 plan.expensePeriods.forEach(exp => {
                    const startPersonAge = exp.startAgeRef === 'person1' ? currentAge1 : currentAge2;
                    const endPersonAge = exp.endAgeRef === 'person1' ? currentAge1 : currentAge2;
                    if (startPersonAge >= exp.startAge && endPersonAge <= exp.endAge) {
                        annualExpenses += exp.monthlyAmount * 12;
                    }
                 });
                 const inflatedExpenses = annualExpenses * Math.pow(1 + plan.inflationRate / 100, year);

                 const shortfall = Math.max(0, inflatedExpenses - fixedIncome);
                 
                 let totalAssets = [...investmentAccounts, ...retirementAccounts].reduce((sum, acc) => sum + acc.balance, 0);
                 const withdrawalAmount = Math.min(shortfall, totalAssets);

                 if (withdrawalAmount > 0) {
                     let remainingToWithdraw = withdrawalAmount;
                     const investmentBalance = investmentAccounts.reduce((s,a) => s + a.balance, 0);
                     if (investmentBalance > 0) {
                         const invWithdraw = Math.min(remainingToWithdraw, investmentBalance);
                         const rate = invWithdraw / investmentBalance;
                         investmentAccounts.forEach(acc => acc.balance *= (1 - rate));
                         remainingToWithdraw -= invWithdraw;
                     }
                     if (remainingToWithdraw > 0) {
                         const retirementBalance = retirementAccounts.reduce((s,a) => s + a.balance, 0);
                         if (retirementBalance > 0) {
                             const retWithdraw = Math.min(remainingToWithdraw, retirementBalance);
                             const rate = retWithdraw / retirementBalance;
                             retirementAccounts.forEach(acc => acc.balance *= (1 - rate));
                         }
                     }
                 }
            }
        }
        
        const finalNetWorth = [...retirementAccounts, ...investmentAccounts].reduce((sum, acc) => sum + acc.balance, 0);
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
