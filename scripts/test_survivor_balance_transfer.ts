import { runSimulation } from '../services/simulationService';
import { RetirementPlan, PlanType } from '../types';
import fs from 'fs';

// Minimal couple plan where person2 dies immediately and has balances
const plan: RetirementPlan = {
  id: 'test-survivor-balance',
  name: 'Survivor Balance Transfer Test',
  planType: PlanType.COUPLE,
  state: 'CA',
  inflationRate: 2.5,
  avgReturn: 5,
  annualWithdrawalRate: 4,
  dieWithZero: false,
  legacyAmount: 0,
  useBalancesForSurvivorIncome: true,
  person1: {
    name: 'Survivor',
    currentAge: 65,
    retirementAge: 65,
    lifeExpectancy: 95,
    currentSalary: 0,
    claimingAge: 67
  },
  person2: {
    name: 'Deceased',
    currentAge: 65,
    retirementAge: 65,
    lifeExpectancy: 65, // dies immediately (age <= lifeExpectancy means alive; set end so next year dead)
    currentSalary: 0,
    claimingAge: 67
  },
  socialSecurity: {
    person1EstimatedBenefit: 0,
    person2EstimatedBenefit: 0
  },
  pensions: [],
  otherIncomes: [],
  expensePeriods: [],
  oneTimeExpenses: [],
  gifts: [],
  legacyDisbursements: [],
  retirementAccounts: [
    { id: 'r1', owner: 'person2', name: 'P2 401k', type: '401k', balance: 200000, annualContribution: 0, match: 0 }
  ],
  investmentAccounts: [
    { id: 'i1', owner: 'person2', name: 'P2 Invest', balance: 50000, annualContribution: 0, percentStocks: 60, percentBonds: 40 }
  ]
};

(async () => {
  try {
    const res = runSimulation(plan);
    const years = res.yearlyProjections;
    // find the first year after person2 is dead (age2 > lifeExpectancy)
    const firstYearAfterDeath = years.find(y => (y.age2 || 0) > plan.person2.lifeExpectancy);
    const index = firstYearAfterDeath ? years.indexOf(firstYearAfterDeath) : -1;

    const result: any = {
      totalYears: years.length,
      firstYearAfterDeathIndex: index,
      firstYearAfterDeath: firstYearAfterDeath || null,
    };

    // Basic assertions
    const assertFailures: string[] = [];
    if (index === -1) assertFailures.push('Could not find a year after person2 death in projections');

    if (firstYearAfterDeath) {
      // Expect that withdrawal > 0 OR grossIncome > 0 (survivor can fund income)
      if ((firstYearAfterDeath.withdrawal || 0) <= 0 && (firstYearAfterDeath.grossIncome || 0) <= 0) {
        assertFailures.push('Survivor has zero withdrawal and zero gross income in first year after death');
      }
    }

    result.assertFailures = assertFailures;

    const out = JSON.stringify(result, null, 2);
    fs.writeFileSync('scripts/survivor_balance_test_output.json', out);

    if (assertFailures.length > 0) {
      console.error('TEST FAILED:', assertFailures.join('; '));
      process.exitCode = 2;
    } else {
      console.log('TEST PASSED');
      process.exitCode = 0;
    }
  } catch (e) {
    console.error('ERROR RUNNING TEST', e);
    process.exitCode = 3;
  }
})();
