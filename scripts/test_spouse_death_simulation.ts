import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { runSimulation } from '../services/simulationService';
import { RetirementPlan, PlanType } from '../types';

// Build a minimal test plan where person2 dies immediately (lifeExpectancy == currentAge)
const testPlan: any = {
    planType: PlanType.COUPLE,
    inflationRate: 2.5,
    annualWithdrawalRate: 4,
    avgReturn: 5,
    stockMean: 8,
    stockStd: 15,
    bondMean: 3,
    bondStd: 6,
    useFatTails: false,
    fatTailDf: 4,
    state: 'CA',
    dieWithZero: false,
    legacyAmount: 0,
    person1: { name: 'Alice', currentAge: 65, retirementAge: 67, lifeExpectancy: 95, claimingAge: 67, currentSalary: 100000 },
    person2: { name: 'Bob', currentAge: 66, retirementAge: 67, lifeExpectancy: 66, claimingAge: 67, currentSalary: 50000 },
    retirementAccounts: [],
    investmentAccounts: [{ id: 'inv-1', owner: 'person1', name: 'Broker', balance: 100000, annualContribution: 0, percentStocks: 60, percentBonds: 40 }],
    pensions: [],
    socialSecurity: { person1EstimatedBenefit: 2000, person2EstimatedBenefit: 1500 },
    otherIncomes: [],
    expensePeriods: [],
    gifts: [],
    legacyDisbursements: [],
};

console.log('Running simulation for spouse-death scenario...');
const res = runSimulation(testPlan as RetirementPlan);

const projections = res.yearlyProjections || [];
console.log('Years returned:', projections.length);

// Check for NaN/Infinity in relevant numeric fields
const bad = [] as any[];
projections.forEach((p, i) => {
    ['grossIncome','netIncome','surplus','federalTax','stateTax','expenses','withdrawal','netWorth'].forEach(k => {
        const v = (p as any)[k];
        if (!Number.isFinite(v)) bad.push({ year: p.year, field: k, value: v });
    });
});

if (bad.length === 0) {
    console.log('OK: No NaN/Infinity values found in projections.');
} else {
    console.error('Found invalid numeric values:', bad.slice(0,10));
}

// Write a small report
fs.writeFileSync(path.join(__dirname, 'spouse_death_report.json'), JSON.stringify({ years: projections.length, invalids: bad }, null, 2));
console.log('Report written to scripts/spouse_death_report.json');
