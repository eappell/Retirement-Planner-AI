import { RetirementPlan, CalculationResult, YearlyProjection, PlanType, FilingStatus, RetirementAccount, InvestmentAccount, Person } from '../types';
import { RMD_START_AGE, RMD_UNIFORM_LIFETIME_TABLE } from '../constants';
import { calculateTaxes } from './taxService';


export const runSimulation = (plan: RetirementPlan): CalculationResult => {
    const isCouple = plan.planType === PlanType.COUPLE;
    const filingStatus = isCouple ? FilingStatus.MARRIED_FILING_JOINTLY : FilingStatus.SINGLE;
    const inflation = plan.inflationRate / 100;
    const withdrawalRate = plan.annualWithdrawalRate / 100;
    const avgReturn = plan.avgReturn / 100;

    const startAge = Math.min(plan.person1.currentAge, isCouple ? plan.person2.currentAge : Infinity);
    const endAge = Math.max(plan.person1.lifeExpectancy, isCouple ? plan.person2.lifeExpectancy : 0);
    const simulationYears = endAge - startAge;

    let retirementAccounts = JSON.parse(JSON.stringify(plan.retirementAccounts)) as RetirementAccount[];
    let investmentAccounts = JSON.parse(JSON.stringify(plan.investmentAccounts)) as InvestmentAccount[];
    
    const yearlyProjections: YearlyProjection[] = [];
    const retirementNetIncomes = [];
    const retirementGrossIncomes = [];
    const retirementFederalTaxes = [];
    const retirementStateTtaxes = [];

    let p1PrevYearRmdBalance = 0;
    let p2PrevYearRmdBalance = 0;
    
    for (let year = 0; year <= simulationYears; year++) {
        const currentAge1 = plan.person1.currentAge + year;
        const currentAge2 = isCouple ? plan.person2.currentAge + year : 0;
        const p1Alive = currentAge1 <= plan.person1.lifeExpectancy;
        const p2Alive = isCouple && currentAge2 <= plan.person2.lifeExpectancy;
        
        let incomeFromPensions = 0;
        let incomeFromSS = 0;
        let incomeFromOther = 0;
        let annualWithdrawal = 0;
        let inflatedExpenses = 0;
        let annualGrossIncome = 0;
        let federalTax = 0;
        let stateTax = 0;
        let netAnnualIncome = 0;
        let totalRmd = 0;

        // --- RMD Calculation (based on previous year's balance) ---
        if (p1Alive && currentAge1 >= RMD_START_AGE) {
            const rmdFactor = RMD_UNIFORM_LIFETIME_TABLE[currentAge1] || 1;
            totalRmd += (p1PrevYearRmdBalance / rmdFactor) || 0;
        }
        if (p2Alive && currentAge2 >= RMD_START_AGE) {
            const rmdFactor = RMD_UNIFORM_LIFETIME_TABLE[currentAge2] || 1;
            totalRmd += (p2PrevYearRmdBalance / rmdFactor) || 0;
        }

        // --- Asset Growth ---
        retirementAccounts.forEach(acc => {
            const owner = plan[acc.owner as keyof typeof plan] as Person;
            const ownerAge = acc.owner === 'person1' ? currentAge1 : currentAge2;
            if(ownerAge < owner.retirementAge) {
                const employerMatch = (owner.currentSalary * (acc.match / 100));
                acc.balance += acc.annualContribution + employerMatch;
            }
            acc.balance *= (1 + avgReturn);
        });
        investmentAccounts.forEach(acc => {
            const owner = plan[acc.owner as keyof typeof plan] as Person;
            const ownerAge = acc.owner === 'person1' ? currentAge1 : currentAge2;
            if(ownerAge < owner.retirementAge) {
                acc.balance += acc.annualContribution;
            }
            acc.balance *= (1 + avgReturn);
        });
        
        // --- Retirement Phase ---
        const isP1Retired = currentAge1 >= plan.person1.retirementAge;
        const isP2Retired = isCouple && currentAge2 >= plan.person2.retirementAge;
        const inRetirement = isP1Retired || isP2Retired;

        if (inRetirement && (p1Alive || p2Alive)) {
             // Social Security with Survivor Benefits
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
            
            // Pensions with Survivor Benefits
            plan.pensions.forEach(p => {
                const owner = plan[p.owner as keyof typeof plan] as Person;
                const ownerAge = p.owner === 'person1' ? currentAge1 : currentAge2;
                const isOwnerAlive = p.owner === 'person1' ? p1Alive : p2Alive;
                const benefit = (p.monthlyBenefit * Math.pow(1 + p.cola / 100, Math.max(0, ownerAge - p.startAge))) * 12;

                if (isOwnerAlive && ownerAge >= p.startAge) {
                    incomeFromPensions += benefit;
                } else if (isCouple && !isOwnerAlive) {
                    const spouseAge = p.owner === 'person1' ? currentAge2 : currentAge1;
                    const isSpouseAlive = p.owner === 'person1' ? p2Alive : p1Alive;
                    if (isSpouseAlive && spouseAge >= p.startAge) {
                         incomeFromPensions += benefit * (p.survivorBenefit / 100);
                    }
                }
            });
            
            // Other Incomes
            plan.otherIncomes.forEach(i => {
                const ownerAge = i.owner === 'person1' ? currentAge1 : currentAge2;
                const isOwnerAlive = i.owner === 'person1' ? p1Alive : p2Alive;
                if (isOwnerAlive && ownerAge >= i.startAge && ownerAge <= i.endAge) {
                    incomeFromOther += (i.monthlyAmount * Math.pow(1 + i.cola / 100, ownerAge - i.startAge)) * 12;
                }
            });

            // Expenses
            let annualExpenses = 0;
            plan.expensePeriods.forEach(exp => {
                const startPersonAge = exp.startAgeRef === 'person1' ? currentAge1 : currentAge2;
                const endPersonAge = exp.endAgeRef === 'person1' ? currentAge1 : currentAge2;
                if (startPersonAge >= exp.startAge && endPersonAge <= exp.endAge) {
                    annualExpenses += exp.monthlyAmount * 12;
                }
            });
            inflatedExpenses = annualExpenses * Math.pow(1 + inflation, year);
            
            // Withdrawals
            const totalAssets = [...investmentAccounts, ...retirementAccounts].reduce((sum, acc) => sum + acc.balance, 0);
            let plannedAnnualWithdrawal = 0;

            if (plan.dieWithZero) {
                const finalAge = isCouple ? Math.max(plan.person1.lifeExpectancy, plan.person2.lifeExpectancy) : plan.person1.lifeExpectancy;
                const currentMaxAge = isCouple ? Math.max(currentAge1, currentAge2) : currentAge1;
                const yearsRemaining = Math.max(1, finalAge - currentMaxAge);

                if (totalAssets > plan.legacyAmount && yearsRemaining > 0) {
                    const totalRetirementBalance = retirementAccounts.reduce((s, a) => s + a.balance, 0);
                    const totalInvestmentBalance = investmentAccounts.reduce((s, a) => s + a.balance, 0);
                    
                    const weightedRetirementReturn = avgReturn;
                    const weightedInvestmentReturn = avgReturn;
                    
                    const avgReturnForAnnuity = totalAssets > 0 ? (totalRetirementBalance * weightedRetirementReturn + totalInvestmentBalance * weightedInvestmentReturn) / totalAssets : 0;
                    
                    const r = avgReturnForAnnuity;
                    let legacyPV = plan.legacyAmount;
                    // Prevent division by zero if avg return is -100%
                    if (1 + r > 0) {
                       legacyPV = plan.legacyAmount / Math.pow(1 + r, yearsRemaining);
                    }
                    const spendableAssets = totalAssets - legacyPV;

                    if (spendableAssets > 0) {
                         if (r > 0 && r !== Infinity && !isNaN(r)) {
                            plannedAnnualWithdrawal = (spendableAssets * (r * Math.pow(1 + r, yearsRemaining)) / (Math.pow(1 + r, yearsRemaining) - 1)) || 0;
                        } else {
                            plannedAnnualWithdrawal = spendableAssets / yearsRemaining;
                        }
                    }
                }

            } else {
                const fixedIncome = incomeFromPensions + incomeFromSS + incomeFromOther;
                const withdrawalFromRate = totalAssets * withdrawalRate;

                // Start with a baseline withdrawal based on the user's defined rate
                let tempWithdrawal = withdrawalFromRate;
                let tempGrossIncome = fixedIncome + tempWithdrawal;
                let tempTaxes = calculateTaxes(tempGrossIncome, plan.state, filingStatus);
                let tempNetIncome = tempGrossIncome - (tempTaxes.federalTax + tempTaxes.stateTax);
                
                let additionalWithdrawal = 0;
                // If the baseline net income doesn't cover expenses, we need to withdraw more
                if (tempNetIncome < inflatedExpenses) {
                    const netShortfall = inflatedExpenses - tempNetIncome;

                    // To get an after-tax amount of `netShortfall`, we must withdraw a larger pre-tax amount.
                    // We can estimate the marginal tax rate to "gross up" the required amount.
                    const incomeForMarginalRateCheck = tempGrossIncome + 1000;
                    const taxesAtHigherIncome = calculateTaxes(incomeForMarginalRateCheck, plan.state, filingStatus);
                    const taxOnExtraAmount = (taxesAtHigherIncome.federalTax + taxesAtHigherIncome.stateTax) - (tempTaxes.federalTax + tempTaxes.stateTax);
                    const marginalTaxRate = taxOnExtraAmount / 1000;
                    
                    // Gross up the shortfall, with a failsafe for a 100% tax rate.
                    if (marginalTaxRate < 1) {
                        additionalWithdrawal = netShortfall / (1 - marginalTaxRate);
                    } else {
                        additionalWithdrawal = netShortfall; // Failsafe
                    }
                }

                plannedAnnualWithdrawal = withdrawalFromRate + additionalWithdrawal;
            }

            annualWithdrawal = Math.max(plannedAnnualWithdrawal, totalRmd);
            annualWithdrawal = Math.min(annualWithdrawal, totalAssets);
            // Ensure withdrawal is a valid number
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

            annualGrossIncome = incomeFromPensions + incomeFromSS + incomeFromOther + annualWithdrawal;
            const finalTaxes = calculateTaxes(annualGrossIncome, plan.state, filingStatus);
            federalTax = finalTaxes.federalTax;
            stateTax = finalTaxes.stateTax;
            netAnnualIncome = annualGrossIncome - federalTax - stateTax;

            retirementNetIncomes.push(netAnnualIncome);
            retirementGrossIncomes.push(annualGrossIncome);
            retirementFederalTaxes.push(federalTax);
            retirementStateTtaxes.push(stateTax);
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
    
    const retirementStartYear = Math.min(plan.person1.retirementAge, isCouple ? plan.person2.retirementAge : Infinity) - startAge;
    const yearsInRetirement = simulationYears - retirementStartYear;
    const finalNetWorth = yearlyProjections.length > 0 ? yearlyProjections[yearlyProjections.length - 1].netWorth : 0;
    
    const avgAnnualNetIncomeFuture = retirementNetIncomes.length > 0 ? retirementNetIncomes.reduce((a, b) => a + b, 0) / retirementNetIncomes.length : 0;
    const netIncomesInTodaysDollars = retirementNetIncomes.map((income, i) => income / Math.pow(1 + inflation, retirementStartYear + i));
    const avgAnnualNetIncomeToday = netIncomesInTodaysDollars.length > 0 ? netIncomesInTodaysDollars.reduce((a, b) => a + b, 0) / netIncomesInTodaysDollars.length : 0;
    const netWorthInTodaysDollars = finalNetWorth / Math.pow(1 + inflation, simulationYears);

    const avgGrossIncome = retirementGrossIncomes.length > 0 ? retirementGrossIncomes.reduce((a, b) => a + b, 0) / retirementGrossIncomes.length : 0;
    const avgFederalTax = retirementFederalTaxes.length > 0 ? retirementFederalTaxes.reduce((a, b) => a + b, 0) / retirementFederalTaxes.length : 0;
    const avgStateTax = retirementStateTtaxes.length > 0 ? retirementStateTtaxes.reduce((a, b) => a + b, 0) / retirementStateTtaxes.length : 0;

    const finalResults: CalculationResult = {
        avgMonthlyNetIncomeToday: avgAnnualNetIncomeToday / 12,
        avgMonthlyNetIncomeFuture: avgAnnualNetIncomeFuture / 12,
        netWorthAtEnd: netWorthInTodaysDollars,
        netWorthAtEndFuture: finalNetWorth,
        federalTaxRate: avgGrossIncome > 0 ? (avgFederalTax / avgGrossIncome) * 100 : 0,
        stateTaxRate: avgGrossIncome > 0 ? (avgStateTax / avgGrossIncome) * 100 : 0,
        yearsInRetirement,
        yearlyProjections: yearlyProjections,
    };
    
    return finalResults;
};