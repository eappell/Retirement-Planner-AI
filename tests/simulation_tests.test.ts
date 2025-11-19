import { describe, it, expect } from 'vitest';
import { runSimulation } from '../services/simulationService';
import { PlanType, RetirementPlan } from '../types';

const checkNoShortfalls = (result: any) => {
  const shortfalls = result.yearlyProjections.filter((p: any) => p.netIncome < p.expenses - 1);
  return shortfalls.length === 0;
};

describe('simulationService scenarios', () => {
  it('couple dieWithZero preserves legacy', () => {
    const plan: RetirementPlan = {
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

    const res = runSimulation(plan);
    const last = res.yearlyProjections[res.yearlyProjections.length - 1];
    expect(last.netWorth).toBeGreaterThanOrEqual(plan.legacyAmount - 1);
  });

  it('couple fixed withdrawal no shortfalls with big assets', () => {
    const planBase: RetirementPlan = {
      planType: PlanType.COUPLE,
      person1: { name: 'P1', currentAge: 65, retirementAge: 65, lifeExpectancy: 85, currentSalary: 0, claimingAge: 67 },
      person2: { name: 'P2', currentAge: 60, retirementAge: 60, lifeExpectancy: 95, currentSalary: 0, claimingAge: 67 },
      retirementAccounts: [
        { id: 'r1', owner: 'person1', name: '401k1', balance: 5000000, annualContribution: 0, match: 0, type: '401k' },
        { id: 'r2', owner: 'person2', name: '401k2', balance: 5000000, annualContribution: 0, match: 0, type: '401k' },
      ],
      investmentAccounts: [],
      pensions: [],
      otherIncomes: [],
      expensePeriods: [ { id: 'e1', name: 'Living', monthlyAmount: 3000, startAge: 60, startAgeRef: 'person1', endAge: 95, endAgeRef: 'person2' } ],
      socialSecurity: { person1EstimatedBenefit: 0, person2EstimatedBenefit: 0 },
      state: 'California',
      inflationRate: 3,
      avgReturn: 6,
      annualWithdrawalRate: 4,
      dieWithZero: false,
      legacyAmount: 0,
    };

    const res = runSimulation(planBase);
    expect(checkNoShortfalls(res)).toBeTruthy();
  });

  it('single dieWithZero no legacy runs without errors', () => {
    const plan: RetirementPlan = {
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

    const res = runSimulation(plan);
    expect(res.yearlyProjections.length).toBeGreaterThan(0);
  });

  it('insufficient assets produce shortfalls', () => {
    const plan: RetirementPlan = {
      planType: PlanType.COUPLE,
      person1: { name: 'P1', currentAge: 65, retirementAge: 65, lifeExpectancy: 85, currentSalary: 0, claimingAge: 67 },
      person2: { name: 'P2', currentAge: 60, retirementAge: 60, lifeExpectancy: 95, currentSalary: 0, claimingAge: 67 },
      retirementAccounts: [
        { id: 'r1', owner: 'person1', name: '401k1', balance: 100000, annualContribution: 0, match: 0, type: '401k' },
        { id: 'r2', owner: 'person2', name: '401k2', balance: 100000, annualContribution: 0, match: 0, type: '401k' },
      ],
      investmentAccounts: [],
      pensions: [],
      otherIncomes: [],
      expensePeriods: [ { id: 'e1', name: 'Living', monthlyAmount: 3000, startAge: 60, startAgeRef: 'person1', endAge: 95, endAgeRef: 'person2' } ],
      socialSecurity: { person1EstimatedBenefit: 0, person2EstimatedBenefit: 0 },
      state: 'California',
      inflationRate: 3,
      avgReturn: 6,
      annualWithdrawalRate: 4,
      dieWithZero: false,
      legacyAmount: 0,
    };

    const res = runSimulation(plan);
    const shortfalls = res.yearlyProjections.filter((p: any) => p.netIncome < p.expenses - 1);
    expect(shortfalls.length).toBeGreaterThan(0);
  });
});
