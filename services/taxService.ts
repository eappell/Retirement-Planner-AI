import { FilingStatus, TaxBracket } from '../types.ts';
import { FEDERAL_TAX_BRACKETS, FEDERAL_STANDARD_DEDUCTION, STATE_TAX_BRACKETS } from '../constants.ts';

const calculateTaxForBrackets = (income: number, brackets: TaxBracket[]): number => {
    let tax = 0;
    for (const bracket of brackets) {
        if (income > bracket.min) {
            const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
            tax += taxableInBracket * bracket.rate;
        }
    }
    return tax;
};

export const calculateTaxes = (
    grossIncome: number,
    state: string,
    filingStatus: FilingStatus
): { federalTax: number; stateTax: number } => {
    // Federal Tax Calculation
    const federalDeduction = FEDERAL_STANDARD_DEDUCTION[filingStatus];
    const federalTaxableIncome = Math.max(0, grossIncome - federalDeduction);
    const federalBrackets = FEDERAL_TAX_BRACKETS[filingStatus];
    const federalTax = calculateTaxForBrackets(federalTaxableIncome, federalBrackets);

    // State Tax Calculation
    let stateTax = 0;
    const stateInfo = STATE_TAX_BRACKETS[state];
    if (stateInfo) {
        let stateBrackets: TaxBracket[] = [];
        let stateDeduction = 0;

        if (filingStatus === FilingStatus.SINGLE) {
            stateBrackets = stateInfo.single;
            stateDeduction = stateInfo.standardDeduction.single;
        } else if (filingStatus === FilingStatus.MARRIED_FILING_JOINTLY) {
            stateBrackets = stateInfo.married_filing_jointly;
            stateDeduction = stateInfo.standardDeduction.married_filing_jointly;
        }
        
        if (stateBrackets.length > 0) {
            const stateTaxableIncome = Math.max(0, grossIncome - stateDeduction);
            stateTax = calculateTaxForBrackets(stateTaxableIncome, stateBrackets);
        }
    }
    
    return { federalTax, stateTax };
};