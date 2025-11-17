import { RetirementPlan, CalculationResult, YearlyProjection, PlanType, FilingStatus, RetirementAccount, InvestmentAccount, Person } from '../types';
import { RMD_START_AGE, RMD_UNIFORM_LIFETIME_TABLE } from '../constants';
import { calculateTaxes } from './taxService';

// Helper function to get a random number from a normal distribution (Box-Muller transform)
const randomNormal = (mean: number, stdDev: number): number => {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
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
    const filingStatus = isCouple ? FilingStatus.MARRIED_FILING_JOINTLY : FilingStatus.SINGLE;
    const inflation = plan.inflationRate / 100;
    const withdrawalRate = plan.annualWithdrawalRate / 100;
    const avgReturn = plan.avgReturn / 100;
    const stdDev = volatility ? volatility / 100 : 0;

    const startAge = Math.min(plan.person1.currentAge, isCouple ? plan.person2.currentAge : Infinity);
    const endAge = Math.max(plan.person1.lifeExpectancy, isCouple ? plan.person2.lifeExpectancy : 0);
    const simulationYears = endAge - startAge;

    let retirementAccounts = JSON.parse(JSON.stringify(plan.retirementAccounts)) as RetirementAccount[];
    let investmentAccounts = JSON.parse(JSON.stringify(plan.investmentAccounts)) as InvestmentAccount[];
    
    const yearlyProjections: YearlyProjection[] = [];
    
    let p1PrevYearRmdBalance = 0;
    let p2PrevYearRmdBalance = 0;
    
    for (let year = 0; year <= simulationYears; year++) {
        const currentAge1 = plan.person1.currentAge + year;
        const currentAge2 = isCouple ? plan.person2.currentAge + year : 0;
        const p1Alive = currentAge1 <= plan.person1.lifeExpectancy;
        const p2Alive = isCouple && currentAge2 <= plan.person2.lifeExpectancy;
        
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
                 const finalLifeExpectancy = Math.max(plan.person1.lifeExpectancy, isCouple ? plan.person2.lifeExpectancy : 0);
                 const finalCurrentAge = Math.max(p1Alive ? currentAge1 : -1, p2Alive ? currentAge2 : -1);
                 const yearsRemaining = Math.max(1, finalLifeExpectancy - finalCurrentAge);

                 if (totalAssets > plan.legacyAmount && yearsRemaining > 0) {
                     const rate = currentYearReturn; 
                     // Present value of the legacy amount
                     const pvLegacy = plan.legacyAmount / Math.pow(1 + rate, yearsRemaining);
                     const spendableAssets = totalAssets - pvLegacy;
                     
                     if (rate !== 0) {
                         // Annuity Due Formula: C = P * r / (1 - (1+r)^-n) / (1+r)
                         // This calculates the payment (C) from a present value (P)
                         const pmt = spendableAssets * (rate / (1 - Math.pow(1 + rate, -yearsRemaining))) / (1 + rate);
                         plannedAnnualWithdrawal = pmt;
                     } else {
                         // Simplified case if rate is zero (to avoid division by zero)
                         plannedAnnualWithdrawal = spendableAssets / yearsRemaining;
                     }
                 } else {
                    plannedAnnualWithdrawal = 0;
                 }
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
                    const marginalTaxRate = Math.max(0, taxOnExtraAmount / 1000);
                    neededForExpenses = (marginalTaxRate < 1) ? netShortfall / (1 - marginalTaxRate) : netShortfall * 2;
                }
                plannedAnnualWithdrawal = Math.max(neededForExpenses, fixedRateWithdrawal);
            }

            annualWithdrawal = Math.max(plannedAnnualWithdrawal, totalRmd);
            annualWithdrawal = Math.min(annualWithdrawal, totalAssets);
            annualWithdrawal = isNaN(annualWithdrawal) ? 0 : annualWithdrawal;

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