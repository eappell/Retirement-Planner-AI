import { runSimulation } from './services/simulationService';
import { PlanType, RetirementPlan } from './types';

const plan: RetirementPlan = {
  planType: PlanType.COUPLE,
  person1: {
    name: 'P1',
    currentAge: 65,
    retirementAge: 65,
    lifeExpectancy: 85,
    currentSalary: 120000,
    claimingAge: 67,
  },
  person2: {
    name: 'P2',
    currentAge: 60,
    retirementAge: 60,
    lifeExpectancy: 95,
    currentSalary: 120000,
    claimingAge: 67,
  },
  retirementAccounts: [
    { id: 'r1', owner: 'person1', name: '401k1', balance: 1000000, annualContribution: 0, match: 0, type: '401k' },
    { id: 'r2', owner: 'person2', name: '401k2', balance: 1000000, annualContribution: 0, match: 0, type: '401k' },
  ],
  investmentAccounts: [],
  pensions: [],
  otherIncomes: [],
  expensePeriods: [
    { id: 'e1', name: 'Living', monthlyAmount: 6000, startAge: 60, startAgeRef: 'person1', endAge: 95, endAgeRef: 'person2' }
  ],
  socialSecurity: { person1EstimatedBenefit: 3000, person2EstimatedBenefit: 3000 },
  state: 'California',
  inflationRate: 3,
  avgReturn: 6,
  annualWithdrawalRate: 4,
  dieWithZero: true,
  legacyAmount: 250000, // Leave Behind
};

console.log('Running leave-behind test (dieWithZero=true, legacyAmount=250k)');
const result = runSimulation(plan);
const last = result.yearlyProjections[result.yearlyProjections.length - 1];
console.log('Final net worth:', last.netWorth.toFixed(2));
console.log('Expected leave behind (legacyAmount):', plan.legacyAmount);
console.log('Difference (netWorth - legacy):', (last.netWorth - plan.legacyAmount).toFixed(2));

// print years where netIncome < expenses
result.yearlyProjections.forEach(p => {
  if (p.netIncome < p.expenses - 1) {
    console.log(`Shortfall ${p.year}: net ${p.netIncome.toFixed(2)} expenses ${p.expenses.toFixed(2)}`);
  }
});
