

export enum PlanType {
  INDIVIDUAL = 'Individual',
  COUPLE = 'Couple',
}

export enum FilingStatus {
    SINGLE = 'single',
    MARRIED_FILING_JOINTLY = 'married_filing_jointly',
}

export interface Person {
  name: string;
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentSalary: number;
  claimingAge: number;
}

export interface RetirementAccount {
    id: string;
    owner: 'person1' | 'person2';
    name: string;
    balance: number;
    annualContribution: number;
    match: number;
    type: '401k' | '457b' | 'IRA' | 'Roth IRA' | 'Other';
}

export interface InvestmentAccount {
    id: string;
    owner: 'person1' | 'person2';
    name: string;
    balance: number;
    annualContribution: number;
}

export interface Pension {
    id: string;
    owner: 'person1' | 'person2';
    name: string;
    monthlyBenefit: number;
    startAge: number;
    cola: number; // cost of living adjustment %
    survivorBenefit: number; // %
    taxable: boolean;
}

export interface OtherIncome {
    id: string;
    owner: 'person1' | 'person2';
    name: string;
    monthlyAmount: number;
    startAge: number;
    endAge: number;
    cola: number;
    taxable: boolean;
}

export interface Gift {
  id: string;
  beneficiary: string; // name or description of beneficiary
  owner?: 'person1' | 'person2'; // who gives the gift (used to compute owner age)
  isAnnual?: boolean; // true = recurring annual gift, false = one-time
  amount?: number; // one-time amount
  annualAmount?: number; // annual amount when isAnnual=true
  startAge?: number; // for annual gifts
  endAge?: number;   // for annual gifts
  age?: number; // for one-time gifts: age of the owner when the gift is given
}

export interface ExpensePeriod {
    id: string;
    name: string;
    monthlyAmount: number;
    startAge: number;
    startAgeRef: 'person1' | 'person2';
    endAge: number;
    endAgeRef: 'person1' | 'person2';
}


export interface RetirementPlan {
  planType: PlanType;
  person1: Person;
  person2: Person;
  retirementAccounts: RetirementAccount[];
  investmentAccounts: InvestmentAccount[];
  pensions: Pension[];
  otherIncomes: OtherIncome[];
  gifts?: Gift[];
  expensePeriods: ExpensePeriod[];
  socialSecurity: {
      person1EstimatedBenefit: number;
      person2EstimatedBenefit: number;
  };
  state: string;
  inflationRate: number;
  avgReturn: number;
  annualWithdrawalRate: number;
  dieWithZero: boolean;
  legacyAmount: number;
}

export interface YearlyProjection {
  year: number;
  age1: number;
  age2?: number;
  investmentBalance: number;
  retirementBalance: number;
  pensionIncome: number;
  socialSecurityIncome: number;
  otherIncome: number;
  grossIncome: number;
  withdrawal: number;
  expenses: number;
  federalTax: number;
  stateTax: number;
  netIncome: number;
  surplus: number;
  gifts?: number;
  netWorth: number;
  rmd: number;
}

export interface CalculationResult {
  avgMonthlyNetIncomeToday: number; // In today's dollars
  avgMonthlyNetIncomeFuture: number; // In future dollars
  netWorthAtEnd: number; // In today's dollars
  netWorthAtEndFuture: number; // In future dollars
  federalTaxRate: number;
  stateTaxRate: number;
  yearsInRetirement: number;
  yearlyProjections: YearlyProjection[];
}

export interface TaxBracket {
    rate: number;
    min: number;
    max: number;
}

// Fix: Add missing MonteCarloResult type definition.
export interface MonteCarloResult {
    successRate: number;
    outcomes: number[];
}

// --- Scenario Management Types ---
export interface Scenario {
  id: string;
  name: string;
  plan: RetirementPlan;
}

export interface ScenariosState {
  activeScenarioId: string | null;
  scenarios: Record<string, Scenario>;
}