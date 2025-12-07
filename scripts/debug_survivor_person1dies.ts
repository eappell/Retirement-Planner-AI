import { runSimulation } from '../services/simulationService';
import { RetirementPlan, PlanType } from '../types';

const plan: RetirementPlan = {
  name: 'Debug Person1 Dies',
  planType: PlanType.COUPLE,
  state: 'CA',
  inflationRate: 2.5,
  avgReturn: 5,
  annualWithdrawalRate: 4,
  dieWithZero: false,
  legacyAmount: 0,
  useBalancesForSurvivorIncome: true,
  person1: {
    name: 'DeceasedOwner',
    currentAge: 87,
    retirementAge: 65,
    lifeExpectancy: 87, // dies immediately (after this year)
    currentSalary: 0,
    claimingAge: 67
  },
  person2: {
    name: 'Survivor',
    currentAge: 84,
    retirementAge: 65,
    lifeExpectancy: 95,
    currentSalary: 0,
    claimingAge: 67
  },
  socialSecurity: { person1EstimatedBenefit: 0, person2EstimatedBenefit: 0 },
  pensions: [],
  otherIncomes: [],
  expensePeriods: [],
  oneTimeExpenses: [],
  gifts: [],
  legacyDisbursements: [],
  retirementAccounts: [
    { id: 'r1', owner: 'person1', name: 'P1 401k', type: '401k', balance: 1500000, annualContribution: 0, match: 0 }
  ],
  investmentAccounts: [
    { id: 'i1', owner: 'person1', name: 'P1 Invest', balance: 500000, annualContribution: 0, percentStocks: 60, percentBonds: 40 }
  ]
};

const res = runSimulation(plan);
const years = res.yearlyProjections;

// Print a slice around the death (age1 beyond lifeExpectancy)
const slice = years.slice(0, 12).map(y => ({ year: y.year, age1: y.age1, age2: y.age2, withdrawal: y.withdrawal, grossIncome: y.grossIncome, netIncome: y.netIncome, investmentBalance: y.investmentBalance, retirementBalance: y.retirementBalance }));
console.log(JSON.stringify(slice, null, 2));

// Save to file
import fs from 'fs';
fs.writeFileSync('scripts/debug_person1dies_output.json', JSON.stringify({ slice }, null, 2));
console.log('Wrote scripts/debug_person1dies_output.json');
