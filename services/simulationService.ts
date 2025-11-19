import { RetirementPlan, CalculationResult, YearlyProjection, PlanType, FilingStatus, RetirementAccount, InvestmentAccount, Person } from '../types';
import { RMD_START_AGE, RMD_UNIFORM_LIFETIME_TABLE } from '../constants';
import { calculateTaxes } from './taxService';
import { cloneArray } from '../utils/deepClone';

// Helper function to get a random number from a normal distribution (Box-Muller transform)
const randomNormal = (mean: number, stdDev: number): number => {
    let u1 = 0, u2 = 0;
    // Generate random values, ensuring they're not zero
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    // Box-Muller transform to convert uniform random to normal distribution
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
};

// Helper to calculate summary statistics from a projection array
const calculateSummary = (projections: YearlyProjection[], plan: RetirementPlan): CalculationResult => {
    const isCouple = plan.planType === PlanType.COUPLE;
    const inflation = plan.inflationRate / 100;

    const retirementStartYearIndex = projections.findIndex(p => {
        if (isCouple) return p.age1 >= plan.person1.retirementAge || (p.age2 !== undefined && p.age2 >= plan.person2.retirementAge);
        return p.age1 >= plan.person1.retirementAge;
    });

    if (retirementStartYearIndex === -1) {
        // Handle case where retirement never starts in the projection
        const finalNetWorth = projections.length > 0 ? projections[projections.length - 1].netWorth : 0;
        return {
            avgMonthlyNetIncomeToday: 0, avgMonthlyNetIncomeFuture: 0,
            netWorthAtEnd: finalNetWorth / Math.pow(1 + inflation, projections.length),
            netWorthAtEndFuture: finalNetWorth, federalTaxRate: 0, stateTaxRate: 0, yearsInRetirement: 0,
            yearlyProjections: projections,
        };
    }
    
    const retirementProjections = projections.slice(retirementStartYearIndex);
    const retirementNetIncomes = retirementProjections.map(p => p.netIncome);
    const retirementGrossIncomes = retirementProjections.map(p => p.grossIncome);
    const retirementFederalTaxes = retirementProjections.map(p => p.federalTax);
    const retirementStateTtaxes = retirementProjections.map(p => p.stateTax);
    
    const yearsInRetirement = retirementProjections.length;
    const finalNetWorth = projections.length > 0 ? projections[projections.length - 1].netWorth : 0;
    
    const avgAnnualNetIncomeFuture = retirementNetIncomes.length > 0 ? retirementNetIncomes.reduce((a, b) => a + b, 0) / retirementNetIncomes.length : 0;
    
    const netIncomesInTodaysDollars = retirementNetIncomes.map((income, i) => income / Math.pow(1 + inflation, retirementStartYearIndex + i));
    const avgAnnualNetIncomeToday = netIncomesInTodaysDollars.length > 0 ? netIncomesInTodaysDollars.reduce((a, b) => a + b, 0) / netIncomesInTodaysDollars.length : 0;
    
    const netWorthInTodaysDollars = finalNetWorth / Math.pow(1 + inflation, projections.length - 1);

    const avgGrossIncome = retirementGrossIncomes.length > 0 ? retirementGrossIncomes.reduce((a, b) => a + b, 0) / retirementGrossIncomes.length : 0;
    const avgFederalTax = retirementFederalTaxes.length > 0 ? retirementFederalTaxes.reduce((a, b) => a + b, 0) / retirementFederalTaxes.length : 0;
    const avgStateTax = retirementStateTtaxes.length > 0 ? retirementStateTtaxes.reduce((a, b) => a + b, 0) / retirementStateTtaxes.length : 0;

    return {
        avgMonthlyNetIncomeToday: avgAnnualNetIncomeToday / 12,
        avgMonthlyNetIncomeFuture: avgAnnualNetIncomeFuture / 12,
        netWorthAtEnd: netWorthInTodaysDollars,
        netWorthAtEndFuture: finalNetWorth,
        federalTaxRate: avgGrossIncome > 0 ? (avgFederalTax / avgGrossIncome) * 100 : 0,
        stateTaxRate: avgGrossIncome > 0 ? (avgStateTax / avgGrossIncome) * 100 : 0,
        yearsInRetirement,
        yearlyProjections: projections,
    };
};


export const runSimulation = (plan: RetirementPlan, volatility?: number): CalculationResult => {
    const isCouple = plan.planType === PlanType.COUPLE;
    // Note: filingStatus will be determined per year based on who is alive
    const inflation = plan.inflationRate / 100;
    const withdrawalRate = plan.annualWithdrawalRate / 100;
    const avgReturn = plan.avgReturn / 100;
    const stdDev = volatility ? volatility / 100 : 0;

    const startAge = Math.min(plan.person1.currentAge, isCouple ? plan.person2.currentAge : Infinity);
    const endAge = Math.max(plan.person1.lifeExpectancy, isCouple ? plan.person2.lifeExpectancy : 0);
    const simulationYears = endAge - startAge;

    let retirementAccounts = cloneArray(plan.retirementAccounts);
    let investmentAccounts = cloneArray(plan.investmentAccounts);
    
    const yearlyProjections: YearlyProjection[] = [];
    
    let p1PrevYearRmdBalance = 0;
    let p2PrevYearRmdBalance = 0;
    
    for (let year = 0; year <= simulationYears; year++) {
        const currentAge1 = plan.person1.currentAge + year;
        const currentAge2 = isCouple ? plan.person2.currentAge + year : 0;
        const p1Alive = currentAge1 <= plan.person1.lifeExpectancy;
        const p2Alive = isCouple && currentAge2 <= plan.person2.lifeExpectancy;
        
        // Determine filing status based on who is alive this year
        const filingStatus = (isCouple && p1Alive && p2Alive) 
            ? FilingStatus.MARRIED_FILING_JOINTLY 
            : FilingStatus.SINGLE;
        
        let incomeFromPensions = 0;
        let taxableIncomeFromPensions = 0;
        let incomeFromSS = 0;
        let incomeFromOther = 0;
        let taxableIncomeFromOther = 0;
        let annualWithdrawal = 0;
        let inflatedExpenses = 0;
        let annualGrossIncome = 0;
        let federalTax = 0;
        let stateTax = 0;
        let netAnnualIncome = 0;
        let totalRmd = 0;
        
        const currentYearReturn = volatility ? randomNormal(avgReturn, stdDev) : avgReturn;

        if (p1Alive && currentAge1 >= RMD_START_AGE) {
            const rmdFactor = RMD_UNIFORM_LIFETIME_TABLE[currentAge1] || 1;
            totalRmd += (p1PrevYearRmdBalance / rmdFactor) || 0;
        }
        if (p2Alive && currentAge2 >= RMD_START_AGE) {
            const rmdFactor = RMD_UNIFORM_LIFETIME_TABLE[currentAge2] || 1;
            totalRmd += (p2PrevYearRmdBalance / rmdFactor) || 0;
        }

        retirementAccounts.forEach(acc => {
            const owner = plan[acc.owner as keyof typeof plan] as Person;
            const ownerAge = acc.owner === 'person1' ? currentAge1 : currentAge2;
            if(ownerAge < owner.retirementAge) {
                const employerMatch = (owner.currentSalary * (acc.match / 100));
                acc.balance += acc.annualContribution + employerMatch;
            }
            acc.balance *= (1 + currentYearReturn);
        });
        investmentAccounts.forEach(acc => {
            const owner = plan[acc.owner as keyof typeof plan] as Person;
            const ownerAge = acc.owner === 'person1' ? currentAge1 : currentAge2;
            if(ownerAge < owner.retirementAge) {
                acc.balance += acc.annualContribution;
            }
            acc.balance *= (1 + currentYearReturn);
        });
        
        const isP1Retired = currentAge1 >= plan.person1.retirementAge;
        const isP2Retired = isCouple && currentAge2 >= plan.person2.retirementAge;
        const inRetirement = isP1Retired || isP2Retired;

        if (inRetirement && (p1Alive || p2Alive)) {
            const p1Benefit = plan.socialSecurity.person1EstimatedBenefit * 12;
            const p2Benefit = isCouple ? plan.socialSecurity.person2EstimatedBenefit * 12 : 0;
            const p1Receiving = currentAge1 >= plan.person1.claimingAge;
            const p2Receiving = isCouple && currentAge2 >= plan.person2.claimingAge;

            if (p1Alive && (!isCouple || p2Alive)) {
                if (p1Receiving) incomeFromSS += p1Benefit;
                if (isCouple && p2Receiving) incomeFromSS += p2Benefit;
            } else if (p1Alive && isCouple && !p2Alive) {
                if (p1Receiving) incomeFromSS += Math.max(p1Benefit, p2Benefit);
            } else if (isCouple && !p1Alive && p2Alive) {
                if (p2Receiving) incomeFromSS += Math.max(p1Benefit, p2Benefit);
            }
            
            plan.pensions.forEach(p => {
                const owner = plan[p.owner as keyof typeof plan] as Person;
                const ownerAge = p.owner === 'person1' ? currentAge1 : currentAge2;
                const isOwnerAlive = p.owner === 'person1' ? p1Alive : p2Alive;
                const benefit = (p.monthlyBenefit * Math.pow(1 + p.cola / 100, Math.max(0, ownerAge - p.startAge))) * 12;

                if (isOwnerAlive && ownerAge >= p.startAge) {
                    incomeFromPensions += benefit;
                    if (p.taxable !== false) taxableIncomeFromPensions += benefit;
                } else if (isCouple && !isOwnerAlive) {
                    const spouseAge = p.owner === 'person1' ? currentAge2 : currentAge1;
                    const isSpouseAlive = p.owner === 'person1' ? p2Alive : p1Alive;
                    if (isSpouseAlive && spouseAge >= p.startAge) {
                         const survivorBenefit = benefit * (p.survivorBenefit / 100);
                         incomeFromPensions += survivorBenefit;
                         if (p.taxable !== false) taxableIncomeFromPensions += survivorBenefit;
                    }
                }
            });
            
            plan.otherIncomes.forEach(i => {
                const ownerAge = i.owner === 'person1' ? currentAge1 : currentAge2;
                const isOwnerAlive = i.owner === 'person1' ? p1Alive : p2Alive;
                if (isOwnerAlive && ownerAge >= i.startAge && ownerAge <= i.endAge) {
                    const incomeAmount = (i.monthlyAmount * Math.pow(1 + i.cola / 100, ownerAge - i.startAge)) * 12;
                    incomeFromOther += incomeAmount;
                    if (i.taxable !== false) taxableIncomeFromOther += incomeAmount;
                }
            });

            let annualExpenses = 0;
            plan.expensePeriods.forEach(exp => {
                const startPersonAge = exp.startAgeRef === 'person1' ? currentAge1 : currentAge2;
                const endPersonAge = exp.endAgeRef === 'person1' ? currentAge1 : currentAge2;
                if (startPersonAge >= exp.startAge && endPersonAge <= exp.endAge) {
                    annualExpenses += exp.monthlyAmount * 12;
                }
            });
            inflatedExpenses = annualExpenses * Math.pow(1 + inflation, year);
            
            const totalAssets = [...investmentAccounts, ...retirementAccounts].reduce((sum, acc) => sum + acc.balance, 0);
            
            let plannedAnnualWithdrawal = 0;

            if (plan.dieWithZero) {
                 // Calculate years remaining based on the longest-living person still alive
                 let yearsRemaining = 1;
                 if (p1Alive && p2Alive) {
                     // Both alive: use the maximum life expectancy
                     const finalLifeExpectancy = Math.max(plan.person1.lifeExpectancy, plan.person2.lifeExpectancy);
                     const oldestCurrentAge = Math.max(currentAge1, currentAge2);
                     yearsRemaining = Math.max(1, finalLifeExpectancy - oldestCurrentAge);
                 } else if (p1Alive) {
                     // Only person1 alive
                     yearsRemaining = Math.max(1, plan.person1.lifeExpectancy - currentAge1);
                 } else if (p2Alive) {
                     // Only person2 alive
                     yearsRemaining = Math.max(1, plan.person2.lifeExpectancy - currentAge2);
                 }

                 // Calculate minimum withdrawal needed to cover expenses
                 const fixedIncome = incomeFromPensions + incomeFromSS + incomeFromOther;
                 const taxableFixedIncome = taxableIncomeFromPensions + taxableIncomeFromOther + incomeFromSS;
                 const taxesOnFixedIncome = calculateTaxes(taxableFixedIncome, plan.state, filingStatus);
                 const netFixedIncome = fixedIncome - (taxesOnFixedIncome.federalTax + taxesOnFixedIncome.stateTax);

                 let minNeededForExpenses = 0;
                 if (netFixedIncome < inflatedExpenses) {
                     const netShortfall = inflatedExpenses - netFixedIncome;
                     const incomeForMarginalRateCheck = taxableFixedIncome + 1000;
                     const taxesAtHigherIncome = calculateTaxes(incomeForMarginalRateCheck, plan.state, filingStatus);
                     const taxOnExtraAmount = (taxesAtHigherIncome.federalTax + taxesAtHigherIncome.stateTax) - (taxesOnFixedIncome.federalTax + taxesOnFixedIncome.stateTax);
                     const marginalTaxRate = Math.max(0, Math.min(0.99, taxOnExtraAmount / 1000));
                     minNeededForExpenses = netShortfall / (1 - marginalTaxRate);
                 }

                 // Calculate "die with zero" withdrawal to deplete assets evenly
                 let dieWithZeroWithdrawal = 0;
                 if (totalAssets > plan.legacyAmount && yearsRemaining > 0) {
                     // Use the plan's average return, not the current year's volatile return
                     const rate = avgReturn; 
                     
                     // Present value of the legacy amount we want to leave behind
                     const pvLegacy = plan.legacyAmount / Math.pow(1 + rate, yearsRemaining);
                     const spendableAssets = Math.max(0, totalAssets - pvLegacy);
                     
                     if (rate !== 0 && spendableAssets > 0) {
                         // PMT formula for ordinary annuity: PMT = PV * [r(1+r)^n] / [(1+r)^n - 1]
                         const numerator = rate * Math.pow(1 + rate, yearsRemaining);
                         const denominator = Math.pow(1 + rate, yearsRemaining) - 1;
                         dieWithZeroWithdrawal = spendableAssets * (numerator / denominator);
                     } else if (spendableAssets > 0) {
                         dieWithZeroWithdrawal = spendableAssets / yearsRemaining;
                     }
                 }

                 // Use the maximum to ensure expenses are always covered
                 // while still depleting assets by life expectancy
                 plannedAnnualWithdrawal = Math.max(minNeededForExpenses, dieWithZeroWithdrawal);
            } else {
                const fixedRateWithdrawal = totalAssets * withdrawalRate;
                const fixedIncome = incomeFromPensions + incomeFromSS + incomeFromOther;
                const taxableFixedIncome = taxableIncomeFromPensions + taxableIncomeFromOther + incomeFromSS;
                const taxesOnFixedIncome = calculateTaxes(taxableFixedIncome, plan.state, filingStatus);
                const netFixedIncome = fixedIncome - (taxesOnFixedIncome.federalTax + taxesOnFixedIncome.stateTax);

                let neededForExpenses = 0;
                if (netFixedIncome < inflatedExpenses) {
                    const netShortfall = inflatedExpenses - netFixedIncome;
                    const incomeForMarginalRateCheck = taxableFixedIncome + 1000;
                    const taxesAtHigherIncome = calculateTaxes(incomeForMarginalRateCheck, plan.state, filingStatus);
                    const taxOnExtraAmount = (taxesAtHigherIncome.federalTax + taxesAtHigherIncome.stateTax) - (taxesOnFixedIncome.federalTax + taxesOnFixedIncome.stateTax);
                    const marginalTaxRate = Math.max(0, Math.min(0.99, taxOnExtraAmount / 1000));
                    neededForExpenses = netShortfall / (1 - marginalTaxRate);
                }
                plannedAnnualWithdrawal = Math.max(neededForExpenses, fixedRateWithdrawal);
            }

            // Ensure RMD requirements are met
            let initialWithdrawal = Math.max(plannedAnnualWithdrawal, totalRmd);
            initialWithdrawal = Math.min(initialWithdrawal, totalAssets);
            
            // Final check: verify expenses will be covered after all taxes
            // This is critical for couple scenarios where filing status changes
            const fixedIncome = incomeFromPensions + incomeFromSS + incomeFromOther;
            const taxableFixedIncome = taxableIncomeFromPensions + taxableIncomeFromOther + incomeFromSS;
            const totalTaxableIncome = taxableFixedIncome + initialWithdrawal;
            const projectedTaxes = calculateTaxes(totalTaxableIncome, plan.state, filingStatus);
            const projectedNetIncome = fixedIncome + initialWithdrawal - projectedTaxes.federalTax - projectedTaxes.stateTax;
            
            if (projectedNetIncome < inflatedExpenses && initialWithdrawal < totalAssets) {
                // We're still short - need to withdraw more to cover the gap
                const additionalNetNeeded = inflatedExpenses - projectedNetIncome;
                // Use a more conservative estimate for additional withdrawal needed
                const conservativeMarginalRate = 0.3; // Assume 30% combined marginal rate
                const additionalGrossNeeded = additionalNetNeeded / (1 - conservativeMarginalRate);
                initialWithdrawal = Math.min(initialWithdrawal + additionalGrossNeeded, totalAssets);
            }
            
            annualWithdrawal = isNaN(initialWithdrawal) ? 0 : initialWithdrawal;

            if (annualWithdrawal > 0) {
                let remainingToWithdraw = annualWithdrawal;
                const investmentBalance = investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0);
                if(investmentBalance > 0){
                    const investmentWithdrawal = Math.min(remainingToWithdraw, investmentBalance);
                    const rate = investmentWithdrawal / investmentBalance;
                    investmentAccounts.forEach(acc => acc.balance *= (1 - rate));
                    remainingToWithdraw -= investmentWithdrawal;
                }
                if (remainingToWithdraw > 0) {
                    const retirementBalance = retirementAccounts.reduce((sum, acc) => sum + acc.balance, 0);
                    if (retirementBalance > 0) {
                        const retirementWithdrawal = Math.min(remainingToWithdraw, retirementBalance);
                        const rate = retirementWithdrawal / retirementBalance;
                        retirementAccounts.forEach(acc => acc.balance *= (1 - rate));
                    }
                }
            }

            const taxableGrossIncome = taxableIncomeFromPensions + taxableIncomeFromOther + incomeFromSS + annualWithdrawal;
            const totalGrossIncome = incomeFromPensions + incomeFromOther + incomeFromSS + annualWithdrawal;

            const finalTaxes = calculateTaxes(taxableGrossIncome, plan.state, filingStatus);
            federalTax = finalTaxes.federalTax;
            stateTax = finalTaxes.stateTax;
            netAnnualIncome = totalGrossIncome - federalTax - stateTax;
            annualGrossIncome = totalGrossIncome;
        }

         yearlyProjections.push({
            year: new Date().getFullYear() + year,
            age1: currentAge1,
            age2: isCouple ? currentAge2 : undefined,
            investmentBalance: investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0),
            retirementBalance: retirementAccounts.reduce((sum, acc) => sum + acc.balance, 0),
            pensionIncome: incomeFromPensions,
            socialSecurityIncome: incomeFromSS,
            otherIncome: incomeFromOther,
            withdrawal: annualWithdrawal,
            grossIncome: annualGrossIncome,
            expenses: inflatedExpenses,
            federalTax: federalTax,
            stateTax: stateTax,
            netIncome: netAnnualIncome,
            surplus: netAnnualIncome - inflatedExpenses,
            netWorth: [...investmentAccounts, ...retirementAccounts].reduce((sum, acc) => sum + acc.balance, 0),
            rmd: totalRmd,
        });

        p1PrevYearRmdBalance = retirementAccounts
            .filter(acc => acc.owner === 'person1' && acc.type !== 'Roth IRA')
            .reduce((sum, acc) => sum + acc.balance, 0);
        if (isCouple) {
            p2PrevYearRmdBalance = retirementAccounts
                .filter(acc => acc.owner === 'person2' && acc.type !== 'Roth IRA')
                .reduce((sum, acc) => sum + acc.balance, 0);
        }
    }
    
    return calculateSummary(yearlyProjections, plan);
};