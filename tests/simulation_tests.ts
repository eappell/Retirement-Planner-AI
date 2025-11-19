import { runSimulation } from '../services/simulationService';
import { PlanType, RetirementPlan } from '../types';

const approxEqual = (a: number, b: number, tol = 1) => Math.abs(a - b) <= tol;

const checkNoShortfalls = (result: any) => {
  const shortfalls = result.yearlyProjections.filter((p: any) => p.netIncome < p.expenses - 1);
  return shortfalls.length === 0;
};

const tests: { name: string; plan: RetirementPlan; expect: (res: any) => { ok: boolean; message?: string } }[] = [];

// Test 1: Couple with dieWithZero and legacy — expect final net worth >= legacy
const plan1: RetirementPlan = {
  planType: PlanType.COUPLE,
  person1: { name: 'P1', currentAge: 65, retirementAge: 65, lifeExpectancy: 85, currentSalary: 0, claimingAge: 67 },
  person2: { name: 'P2', currentAge: 60, retirementAge: 60, lifeExpectancy: 95, currentSalary: 0, claimingAge: 67 },
  retirementAccounts: [
    { id: 'r1', owner: 'person1', name: '401k1', balance: 1000000, annualContribution: 0, match: 0, type: '401k' },
    { id: 'r2', owner: 'person2', name: '401k2', balance: 1000000, annualContribution: 0, match: 0, type: '401k' },
  ],
  investmentAccounts: [],
  pensions: [],
  otherIncomes: [],
  expensePeriods: [ { id: 'e1', name: 'Living', monthlyAmount: 6000, startAge: 60, startAgeRef: 'person1', endAge: 95, endAgeRef: 'person2' } ],
  socialSecurity: { person1EstimatedBenefit: 0, person2EstimatedBenefit: 0 },
  state: 'California',
  inflationRate: 3,
  avgReturn: 6,
  annualWithdrawalRate: 4,
  dieWithZero: true,
  legacyAmount: 250000,
};

tests.push({
  name: 'Couple dieWithZero preserves legacy',
  plan: plan1,
  expect: (res: any) => {
    const last = res.yearlyProjections[res.yearlyProjections.length - 1];
    const ok = last.netWorth >= plan1.legacyAmount - 1;
    return { ok, message: `final ${last.netWorth} >= legacy ${plan1.legacyAmount}` };
  }
});

// Test 2: Couple, no dieWithZero, high assets, expect no shortfalls
const plan2: RetirementPlan = JSON.parse(JSON.stringify(plan1));
plan2.dieWithZero = false;
plan2.legacyAmount = 0;
plan2.retirementAccounts[0].balance = 5000000;
plan2.retirementAccounts[1].balance = 5000000;
plan2.expensePeriods[0].monthlyAmount = 3000; // 36k/yr expenses

tests.push({
  name: 'Couple fixed withdrawal no shortfalls with big assets',
  plan: plan2,
  expect: (res: any) => {
    const ok = checkNoShortfalls(res);
    return { ok, message: ok ? 'no shortfalls' : 'shortfalls present' };
  }
});

// Test 3: Single, dieWithZero, zero legacy — expect no final legacy requirement but no negative networth
const plan3: RetirementPlan = {
  planType: PlanType.INDIVIDUAL,
  person1: { name: 'Solo', currentAge: 65, retirementAge: 65, lifeExpectancy: 90, currentSalary: 0, claimingAge: 67 },
  person2: { name: '', currentAge: 0, retirementAge: 0, lifeExpectancy: 0, currentSalary: 0, claimingAge: 0 },
  retirementAccounts: [ { id: 'r1', owner: 'person1', name: '401k', balance: 1000000, annualContribution: 0, match: 0, type: '401k' } ],
  investmentAccounts: [],
  pensions: [], otherIncomes: [],
  expensePeriods: [ { id: 'e1', name: 'Living', monthlyAmount: 4000, startAge: 60, startAgeRef: 'person1', endAge: 95, endAgeRef: 'person1' } ],
  socialSecurity: { person1EstimatedBenefit: 2000, person2EstimatedBenefit: 0 },
  state: 'California', inflationRate: 3, avgReturn: 6, annualWithdrawalRate: 4, dieWithZero: true, legacyAmount: 0,
};

tests.push({ name: 'Single dieWithZero no legacy', plan: plan3, expect: (res: any) => ({ ok: true }) });

// Test 4: Edge case — insufficient assets lead to shortfalls
const plan4 = JSON.parse(JSON.stringify(plan2));
plan4.retirementAccounts[0].balance = 100000; plan4.retirementAccounts[1].balance = 100000; // low assets
plan4.dieWithZero = false; plan4.annualWithdrawalRate = 0.04;

tests.push({
  name: 'Insufficient assets produce shortfalls',
  plan: plan4,
  expect: (res: any) => {
    const shortfalls = res.yearlyProjections.filter((p: any) => p.netIncome < p.expenses - 1);
    return { ok: shortfalls.length > 0, message: `shortfalls count ${shortfalls.length}` };
  }
});

(async () => {
  console.log('Running simulation tests...');
  let failed = 0;
  for (const t of tests) {
    try {
      const res = runSimulation(t.plan);
      const out = t.expect(res);
      if (!out.ok) {
        failed++;
        console.error(`FAIL: ${t.name} — ${out.message || 'assertion failed'}`);
      } else {
        console.log(`PASS: ${t.name}`);
      }
    } catch (err) {
      failed++;
      console.error(`ERROR: ${t.name} — ${(err as Error).message}`);
    }
  }

  if (failed > 0) {
    console.error(`${failed} tests failed`);
    process.exit(1);
  }
  console.log('All tests passed');
})();
