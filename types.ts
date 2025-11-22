

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
  type: '401k' | '457b' | '403b' | 'IRA' | 'Roth IRA' | 'Other';
}

export interface InvestmentAccount {
    id: string;
    owner: 'person1' | 'person2';
    name: string;
    balance: number;
    annualContribution: number;
  percentStocks?: number; // allocation percent (0-100)
  percentBonds?: number;  // allocation percent (0-100)
}

export interface Pension {
    id: string;
    owner: 'person1' | 'person2';
    name: string;
    // Pension can be paid as a monthly benefit or a lump-sum.
    payoutType?: 'monthly' | 'lump';
    monthlyBenefit?: number;
    lumpSumAmount?: number;
    startAge: number;
    cola: number; // cost of living adjustment %
    survivorBenefit: number; // %
    taxable: boolean;
}

export interface HSA {
  id: string;
  owner: 'person1' | 'person2';
  name: string;
  balance: number;
  annualContribution: number;
  // Optional investment allocation for HSAs (percent stocks)
  percentStocks?: number;
  percentBonds?: number;
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

export interface Annuity {
  id: string;
  owner: 'person1' | 'person2';
  name: string;
  type?: string; // e.g., "Immediate (Fixed)", "Deferred (Indexed)", etc.
  startAge: number;
  pmtFrequency?: 'monthly' | 'quarterly' | 'annual';
  pmtAmount?: number;
  endAge?: number; // age when payments end (or 0 for lifetime)
  cola: number; // cost of living adjustment %
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

export interface LegacyDisbursement {
  id: string;
  beneficiary: string;
  beneficiaryType: 'person' | 'organization';
  percentage: number; // percentage of the final estate to distribute to this beneficiary
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
  hsaAccounts?: HSA[];
  annuities?: Annuity[];
  gifts?: Gift[];
  legacyDisbursements?: LegacyDisbursement[];
  expensePeriods: ExpensePeriod[];
  socialSecurity: {
      person1EstimatedBenefit: number;
      person2EstimatedBenefit: number;
  };
  state: string;
  inflationRate: number;
  avgReturn: number;
  // Asset-class assumptions (percent values, e.g., 8 = 8%)
  stockMean?: number;
  stockStd?: number;
  bondMean?: number;
  bondStd?: number;
  // Enable fat-tailed return sampling (Student's t) in Monte Carlo projections
  useFatTails?: boolean;
  // Degrees of freedom for Student's t (must be >2 for finite variance). Lower -> fatter tails.
  fatTailDf?: number;
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
  legacyOutflow?: number; // total legacy distributed this year (typically final year)
  legacyDistributions?: { beneficiary: string; amount: number }[];
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
  legacySummary?: { beneficiary: string; amount: number }[];
  remainingEstate?: number;
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
  // Metadata about sampling used for this run
  useFatTails?: boolean;
  fatTailDf?: number;
  // Percentile series over time (e.g., 10th/50th/90th percentiles per year)
  percentileSeries?: Array<{ year: number; age1?: number; p10: number; p50: number; p90: number }>;
  // Probability of running out by year (percentage 0-100)
  runoutProbByYear?: Array<{ year: number; age1?: number; runoutPct: number }>;
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