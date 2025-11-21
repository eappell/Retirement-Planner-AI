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

// Helper to get a random sample from a Student's t-distribution with given df,
// scaled to have the desired standard deviation (stdDev) and mean.
const randomStudentT = (mean: number, stdDev: number, df: number): number => {
    // If df <= 2 variance is infinite; fallback to normal
    if (!df || df <= 2) return randomNormal(mean, stdDev);

    // generate z ~ N(0,1)
    const z = randomNormal(0, 1);
    // generate v ~ Chi-square(df) by summing squares of df standard normals
    let v = 0;
    for (let i = 0; i < Math.floor(df); i++) {
        const n = randomNormal(0, 1);
        v += n * n;
    }
    // For non-integer df we approximate by adding fractional contribution
    const frac = df - Math.floor(df);
    if (frac > 0) {
        const n = randomNormal(0, 1);
        v += frac * (n * n);
    }

    const t = z / Math.sqrt(v / df);
    // Student-t variance = df / (df - 2) for df > 2
    const theoreticalStd = Math.sqrt(df / (df - 2));
    const scale = stdDev / theoreticalStd;
    return mean + t * scale;
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
        legacySummary: projections.length > 0 ? (projections[projections.length - 1].legacyDistributions || []) : [],
        remainingEstate: projections.length > 0 ? Math.max(0, projections[projections.length - 1].netWorth - (projections[projections.length - 1].legacyOutflow || 0)) : 0,
    };
};


export const runSimulation = (plan: RetirementPlan, volatility?: number): CalculationResult => {
    const isCouple = plan.planType === PlanType.COUPLE;
    const inflation = plan.inflationRate / 100;
    const withdrawalRate = plan.annualWithdrawalRate / 100;
    const avgReturn = plan.avgReturn / 100;
    const stdDev = volatility ? volatility / 100 : 0;

    // Simple asset-class defaults (annualized, fractions)
    const STOCK_MEAN_DEFAULT = 0.08; // 8% expected stock return
    const STOCK_STD_DEFAULT = 0.15; // 15% stock volatility
    const BOND_MEAN_DEFAULT = 0.03; // 3% expected bond return
    const BOND_STD_DEFAULT = 0.06; // 6% bond volatility

    const startAge = Math.min(plan.person1.currentAge, isCouple ? plan.person2.currentAge : Infinity);
    const endAge = Math.max(plan.person1.lifeExpectancy, isCouple ? plan.person2.lifeExpectancy : 0);
    const simulationYears = endAge - startAge;

    // inner simulation pass that respects a global die-with-zero scale
    const simulateWithScale = (scale: number) => {
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
            let totalGiftThisYear = 0;

            const currentYearReturn = volatility ? randomNormal(avgReturn, stdDev) : avgReturn;
            // Determine asset-class means and volatilities biased by plan.avgReturn and optionally by plan-level overrides
            // Compute portfolio-weighted stock pct using current balances as weights (fallback to simple average)
            const totalInvBal = investmentAccounts.reduce((s, a) => s + (a.balance || 0), 0);
            let portfolioStocksPct = 0;
            if (totalInvBal > 0) {
                const stocksWeight = investmentAccounts.reduce((s, a) => s + ((a.balance || 0) * ((a.percentStocks ?? 60) / 100)), 0);
                portfolioStocksPct = stocksWeight / totalInvBal;
            } else {
                // fallback: average percentStocks
                const n = investmentAccounts.length || 1;
                portfolioStocksPct = (investmentAccounts.reduce((s, a) => s + (a.percentStocks ?? 60), 0) / n) / 100;
            }

            const desiredAvg = plan.avgReturn / 100;
            const baseStock = (plan.stockMean !== undefined ? plan.stockMean / 100 : STOCK_MEAN_DEFAULT);
            const baseBond = (plan.bondMean !== undefined ? plan.bondMean / 100 : BOND_MEAN_DEFAULT);
            const portfolioBaseAvg = portfolioStocksPct * baseStock + (1 - portfolioStocksPct) * baseBond;
            const delta = desiredAvg - portfolioBaseAvg;
            const stockMean = baseStock + delta;
            const bondMean = baseBond + delta;

            const stockStd = (plan.stockStd !== undefined ? plan.stockStd / 100 : STOCK_STD_DEFAULT);
            const bondStd = (plan.bondStd !== undefined ? plan.bondStd / 100 : BOND_STD_DEFAULT);

            // Asset-class returns for this year (used to weight by allocations)
            // Sample asset-class returns; if fat tails enabled, use Student's t sampling
            const df = (plan.fatTailDf && plan.fatTailDf > 2) ? plan.fatTailDf : 4;
            const useT = !!plan.useFatTails;
            const stockSampleStd = volatility ? stdDev : stockStd;
            const bondSampleStd = volatility ? stdDev : bondStd;
            const stockReturn = volatility
                ? (useT ? randomStudentT(stockMean, stockSampleStd, df) : randomNormal(stockMean, stockSampleStd))
                : (useT ? randomStudentT(stockMean, stockStd, df) : stockMean);
            const bondReturn = volatility
                ? (useT ? randomStudentT(bondMean, bondSampleStd, df) : randomNormal(bondMean, bondSampleStd))
                : (useT ? randomStudentT(bondMean, bondStd, df) : bondMean);

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
                if (ownerAge < owner.retirementAge) {
                    const employerMatch = (owner.currentSalary * (acc.match / 100));
                    acc.balance += acc.annualContribution + employerMatch;
                }
                acc.balance *= (1 + currentYearReturn);
            });
            investmentAccounts.forEach(acc => {
                const owner = plan[acc.owner as keyof typeof plan] as Person;
                const ownerAge = acc.owner === 'person1' ? currentAge1 : currentAge2;
                if (ownerAge < owner.retirementAge) {
                    acc.balance += acc.annualContribution;
                }
                // Compute allocation-weighted return based on account-level percentStocks/percentBonds
                const stocksPct = (acc.percentStocks !== undefined) ? Number(acc.percentStocks) / 100 : 0.6;
                const bondsPct = (acc.percentBonds !== undefined) ? Number(acc.percentBonds) / 100 : (1 - stocksPct);
                const accountReturn = (stocksPct * stockReturn) + (bondsPct * bondReturn);
                acc.balance *= (1 + accountReturn);
            });

            const isP1Retired = currentAge1 >= plan.person1.retirementAge;
            const isP2Retired = isCouple && currentAge2 >= plan.person2.retirementAge;
            const inRetirement = isP1Retired || isP2Retired;

            if (inRetirement && (p1Alive || p2Alive)) {
                const ssInflationFactor = Math.pow(1 + inflation, year);
                const p1Benefit = plan.socialSecurity.person1EstimatedBenefit * 12 * ssInflationFactor;
                const p2Benefit = isCouple ? plan.socialSecurity.person2EstimatedBenefit * 12 * ssInflationFactor : 0;

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

                // Apply gifts scheduled for this year before computing withdrawals
                const gifts = (plan.gifts || []);
                totalGiftThisYear = 0;
                gifts.forEach(g => {
                    if (!g) return;
                    const ownerAge = g.owner === 'person2' ? currentAge2 : currentAge1;
                    const ownerAlive = g.owner === 'person2' ? p2Alive : p1Alive;
                    if (!ownerAlive) return;
                    if (g.isAnnual) {
                        if (typeof g.startAge !== 'number' || typeof g.endAge !== 'number') return;
                        if (ownerAge >= g.startAge && ownerAge <= g.endAge) {
                            totalGiftThisYear += (g.annualAmount || 0);
                        }
                    } else {
                        if (typeof g.age !== 'number') return;
                        if (ownerAge === g.age) {
                            totalGiftThisYear += (g.amount || 0);
                        }
                    }
                });

                if (totalGiftThisYear > 0) {
                    let remainingGift = totalGiftThisYear;
                    const investmentBalance = investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0);
                    if (investmentBalance > 0) {
                        const take = Math.min(remainingGift, investmentBalance);
                        const rate = take / investmentBalance;
                        investmentAccounts.forEach(acc => acc.balance *= (1 - rate));
                        remainingGift -= take;
                    }
                    if (remainingGift > 0) {
                        const retirementBalance = retirementAccounts.reduce((sum, acc) => sum + acc.balance, 0);
                        if (retirementBalance > 0) {
                            const take = Math.min(remainingGift, retirementBalance);
                            const rate = take / retirementBalance;
                            retirementAccounts.forEach(acc => acc.balance *= (1 - rate));
                            remainingGift -= take;
                        }
                    }
                    // If remainingGift still > 0, accounts are already zeroed as much as possible
                }

                const totalAssets = [...investmentAccounts, ...retirementAccounts].reduce((sum, acc) => sum + acc.balance, 0);

                let plannedAnnualWithdrawal = 0;
                let pvLegacyForThisYear = 0;

                if (plan.dieWithZero) {
                    let yearsRemaining = 1;
                    const y1 = p1Alive ? (plan.person1.lifeExpectancy - currentAge1 + 1) : 0;
                    const y2 = p2Alive ? (plan.person2.lifeExpectancy - currentAge2 + 1) : 0;
                    yearsRemaining = Math.max(1, y1, y2);

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

                    let dieWithZeroWithdrawal = 0;
                    if (totalAssets > 0 && yearsRemaining > 0) {
                        const nominalRate = avgReturn;
                        const pvLegacy = plan.legacyAmount / Math.pow(1 + nominalRate, yearsRemaining);
                        pvLegacyForThisYear = pvLegacy;
                        const spendableAssets = Math.max(0, totalAssets - pvLegacy);

                        if (spendableAssets > 0) {
                            const realRate = (1 + nominalRate) / (1 + inflation) - 1;
                            if (Math.abs(realRate) > 0.0001) {
                                const numerator = realRate * Math.pow(1 + realRate, yearsRemaining);
                                const denominator = Math.pow(1 + realRate, yearsRemaining) - 1;
                                dieWithZeroWithdrawal = spendableAssets * (numerator / denominator);
                            } else {
                                dieWithZeroWithdrawal = spendableAssets / yearsRemaining;
                            }
                        }
                    }

                    // apply global scale to die-with-zero withdrawals to allow back-solving
                    plannedAnnualWithdrawal = Math.max(minNeededForExpenses, dieWithZeroWithdrawal * scale);
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

                let calculatedWithdrawal = Math.max(plannedAnnualWithdrawal, totalRmd);
                calculatedWithdrawal = Math.min(calculatedWithdrawal, totalAssets);

                const fixedIncome = incomeFromPensions + incomeFromSS + incomeFromOther;
                const taxableFixedIncome = taxableIncomeFromPensions + taxableIncomeFromOther + incomeFromSS;

                let iterationWithdrawal = calculatedWithdrawal;
                const maxWithdrawable = Math.max(0, totalAssets - pvLegacyForThisYear);
                let iterations = 0;
                const maxIterations = 20;

                while (iterations < maxIterations && iterationWithdrawal < totalAssets) {
                    const totalTaxableIncome = taxableFixedIncome + iterationWithdrawal;
                    const projectedTaxes = calculateTaxes(totalTaxableIncome, plan.state, filingStatus);
                    const projectedNetIncome = fixedIncome + iterationWithdrawal - projectedTaxes.federalTax - projectedTaxes.stateTax;

                    const shortfall = inflatedExpenses - projectedNetIncome;
                    if (shortfall <= 1) break;

                    const testIncome = totalTaxableIncome + 1000;
                    const testTaxes = calculateTaxes(testIncome, plan.state, filingStatus);
                    const marginalTax = (testTaxes.federalTax + testTaxes.stateTax) - (projectedTaxes.federalTax + projectedTaxes.stateTax);
                    const marginalRate = Math.max(0.15, Math.min(0.90, marginalTax / 1000));

                    const additionalGross = shortfall / (1 - marginalRate);
                    iterationWithdrawal = Math.min(iterationWithdrawal + additionalGross, totalAssets);
                    iterations++;
                }

                if (pvLegacyForThisYear > 0) iterationWithdrawal = Math.min(iterationWithdrawal, maxWithdrawable);

                annualWithdrawal = isNaN(iterationWithdrawal) ? 0 : iterationWithdrawal;

                if (annualWithdrawal > 0) {
                    let remainingToWithdraw = annualWithdrawal;
                    const investmentBalance = investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0);
                    if (investmentBalance > 0) {
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
                gifts: totalGiftThisYear || 0,
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

        const finalNetWorth = yearlyProjections.length > 0 ? yearlyProjections[yearlyProjections.length - 1].netWorth : 0;
        // Apply legacy disbursements at final year (simple approach)
        if (plan.legacyDisbursements && plan.legacyDisbursements.length > 0) {
            const distributions: { beneficiary: string; amount: number }[] = [];
            let totalDistributed = 0;
            plan.legacyDisbursements.forEach(ld => {
                const amt = Math.round(finalNetWorth * (ld.percentage / 100));
                distributions.push({ beneficiary: ld.beneficiary, amount: amt });
                totalDistributed += amt;
            });
            const lastIdx = yearlyProjections.length - 1;
            if (lastIdx >= 0) {
                yearlyProjections[lastIdx].legacyOutflow = totalDistributed;
                yearlyProjections[lastIdx].legacyDistributions = distributions;
                yearlyProjections[lastIdx].netWorth = Math.max(0, yearlyProjections[lastIdx].netWorth - totalDistributed);
            }
        }

        return { yearlyProjections, finalNetWorth };
    };

    // If dieWithZero + legacy is requested, back-solve by scaling die-with-zero withdrawals until legacy preserved
    if (plan.dieWithZero && plan.legacyAmount && plan.legacyAmount > 0) {
        // Binary search on scale (0..1) to find the largest withdrawals scale that still preserves legacy
        let low = 0.0;
        let high = 1.0;
        let bestProjections: YearlyProjection[] = [];
        for (let i = 0; i < 20; i++) {
            const mid = (low + high) / 2;
            const res = simulateWithScale(mid);
            if (res.finalNetWorth >= plan.legacyAmount) {
                // scaling mid still preserves legacy -> we can allow larger withdrawals
                bestProjections = res.yearlyProjections;
                low = mid;
            } else {
                // too aggressive withdrawals, reduce scale
                high = mid;
            }
        }
        // If we never found a scale that preserves legacy, use the most conservative run (low)
        if (bestProjections.length === 0) {
            const res = simulateWithScale(low);
            return calculateSummary(res.yearlyProjections, plan);
        }
        return calculateSummary(bestProjections, plan);
    }

    // Default: single pass
    const single = simulateWithScale(1.0);
    return calculateSummary(single.yearlyProjections, plan);
};