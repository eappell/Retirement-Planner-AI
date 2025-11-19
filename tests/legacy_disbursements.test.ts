import { describe, it, expect } from 'vitest';
import { runSimulation } from '../services/simulationService';
import { PlanType, RetirementPlan } from '../types';

describe('legacy disbursements', () => {
  it('applies percentage distributions at final year and deducts from net worth', () => {
    const plan: RetirementPlan = {
      planType: PlanType.INDIVIDUAL,
      person1: { name: 'Solo', currentAge: 70, retirementAge: 70, lifeExpectancy: 70, currentSalary: 0, claimingAge: 70 },
      person2: { name: '', currentAge: 0, retirementAge: 0, lifeExpectancy: 0, currentSalary: 0, claimingAge: 0 },
      retirementAccounts: [ { id: 'r1', owner: 'person1', name: 'IRA', balance: 100000, annualContribution: 0, match: 0, type: 'IRA' } ],
      investmentAccounts: [],
      pensions: [],
      otherIncomes: [],
      expensePeriods: [],
      socialSecurity: { person1EstimatedBenefit: 0, person2EstimatedBenefit: 0 },
      state: 'California',
      inflationRate: 0,
      avgReturn: 0,
      annualWithdrawalRate: 0,
      dieWithZero: false,
      legacyAmount: 0,
      legacyDisbursements: [
        { id: 'l1', beneficiary: 'Charity A', beneficiaryType: 'organization', percentage: 50 },
        { id: 'l2', beneficiary: 'Child B', beneficiaryType: 'person', percentage: 25 },
      ],
      gifts: [],
    } as unknown as RetirementPlan;

    const res = runSimulation(plan);
    const last = res.yearlyProjections[res.yearlyProjections.length - 1];
    // final net worth before distribution should be initial 100000 (no returns/withdrawals)
    // distributions: 50% => 50000, 25% => 25000, total = 75000
    expect(last.legacyOutflow).toBe(50000 + 25000);
    expect(last.legacyDistributions).toBeDefined();
    expect(res.legacySummary).toBeDefined();
    const distributedTotal = (res.legacySummary || []).reduce((s, d) => s + d.amount, 0);
    expect(distributedTotal).toBe(75000);
    // netWorth should be reduced accordingly
    expect(last.netWorth).toBe(100000 - 75000);
  });

  it('handles percentages > 100% by zeroing estate (no negative net worth)', () => {
    const plan: RetirementPlan = {
      planType: PlanType.INDIVIDUAL,
      person1: { name: 'Solo', currentAge: 70, retirementAge: 70, lifeExpectancy: 70, currentSalary: 0, claimingAge: 70 },
      person2: { name: '', currentAge: 0, retirementAge: 0, lifeExpectancy: 0, currentSalary: 0, claimingAge: 0 },
      retirementAccounts: [ { id: 'r1', owner: 'person1', name: 'IRA', balance: 50000, annualContribution: 0, match: 0, type: 'IRA' } ],
      investmentAccounts: [],
      pensions: [],
      otherIncomes: [],
      expensePeriods: [],
      socialSecurity: { person1EstimatedBenefit: 0, person2EstimatedBenefit: 0 },
      state: 'California',
      inflationRate: 0,
      avgReturn: 0,
      annualWithdrawalRate: 0,
      dieWithZero: false,
      legacyAmount: 0,
      legacyDisbursements: [
        { id: 'l1', beneficiary: 'Charity A', beneficiaryType: 'organization', percentage: 80 },
        { id: 'l2', beneficiary: 'Child B', beneficiaryType: 'person', percentage: 50 },
      ],
      gifts: [],
    } as unknown as RetirementPlan;

    const res = runSimulation(plan);
    const last = res.yearlyProjections[res.yearlyProjections.length - 1];
    // computed distributed amounts may sum to more than estate, but netWorth should be floored at 0
    expect(last.netWorth).toBeGreaterThanOrEqual(0);
    expect(last.netWorth).toBe(0);
    const totalDistributed = (last.legacyDistributions || []).reduce((s, d) => s + d.amount, 0);
    // total distributed equals computed percentages of original 50000
    expect(totalDistributed).toBe( Math.round(50000 * 0.8) + Math.round(50000 * 0.5) );
  });
});
