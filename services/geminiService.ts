import { GoogleGenAI, Type } from "@google/genai";
import { RetirementPlan, CalculationResult, YearlyProjection, PlanType, RetirementAccount, InvestmentAccount, Pension, OtherIncome, ExpensePeriod } from '../types';
import { FEDERAL_TAX_BRACKETS, FEDERAL_STANDARD_DEDUCTION, STATE_TAX_BRACKETS, RMD_UNIFORM_LIFETIME_TABLE } from '../constants';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const formatList = <T extends { taxable?: boolean }>(title: string, items: T[], formatter: (item: T) => string): string => {
    if (items.length === 0) return '';
    return `\n**${title}:**\n${items.map(item => `- ${formatter(item)}${item.taxable === false ? ' (non-taxable)' : ''}`).join('\n')}`;
}


export const getRetirementInsights = async (plan: RetirementPlan, result: CalculationResult): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const totalInvestments = [...plan.retirementAccounts, ...plan.investmentAccounts].reduce((sum, acc) => sum + acc.balance, 0);

        const planSummary = `
        A user is planning for retirement with the following details:
        - Planning for: ${plan.planType}
        - State of Residence: ${plan.state}
        - Assumed Annual Inflation: ${plan.inflationRate}%
        - Assumed Average Annual Investment Return: ${plan.avgReturn}%
        
        **People:**
        - ${plan.person1.name} (Person 1): Current Age ${plan.person1.currentAge}, Retiring at ${plan.person1.retirementAge}, Life Expectancy ${plan.person1.lifeExpectancy}
        - ${plan.person1.name}'s Estimated Social Security at age ${plan.person1.claimingAge}: ${formatCurrency(plan.socialSecurity.person1EstimatedBenefit)}/month
        ${plan.planType === 'Couple' ? `- ${plan.person2.name} (Person 2): Current Age ${plan.person2.currentAge}, Retiring at ${plan.person2.retirementAge}, Life Expectancy ${plan.person2.lifeExpectancy}\n- ${plan.person2.name}'s Estimated Social Security at age ${plan.person2.claimingAge}: ${formatCurrency(plan.socialSecurity.person2EstimatedBenefit)}/month` : ''}
        
        **Financials:**
        - Total Retirement & Investment Balance: ${formatCurrency(totalInvestments)}
        ${/* FIX: Add taxable property to RetirementAccount objects to match formatList constraint. */ ''}
        ${formatList('Retirement Accounts', plan.retirementAccounts.map(acc => ({ ...acc, taxable: acc.type !== 'Roth IRA' })), (acc) => `${acc.name} (${acc.type}): ${formatCurrency(acc.balance)}`)}
        ${/* FIX: Add taxable property to InvestmentAccount objects to match formatList constraint. */ ''}
        ${formatList('Investment Accounts', plan.investmentAccounts.map(acc => ({...acc, taxable: true})), (acc) => `${acc.name}: ${formatCurrency(acc.balance)}`)}
        ${formatList('Pensions', plan.pensions, (p) => `${p.name}: Starts at age ${p.startAge}, ${formatCurrency(p.monthlyBenefit)}/month with ${p.cola}% COLA`)}
        ${formatList('Other Incomes', plan.otherIncomes, (i) => `${i.name}: ${formatCurrency(i.monthlyAmount)}/month from age ${i.startAge} to ${i.endAge}`)}
        ${/* FIX: ExpensePeriod does not have a 'taxable' property; use direct formatting instead of formatList. */ ''}
        ${plan.expensePeriods.length > 0 ? `\n**Expense Planning:**\n${plan.expensePeriods.map(e => `- ${e.name}: ${formatCurrency(e.monthlyAmount)}/month from age ${e.startAge} to ${e.endAge}`).join('\n')}` : ''}

        **Calculation Results (in today's dollars):**
        - Average Monthly Net Income in Retirement: ${formatCurrency(result.avgMonthlyNetIncomeToday)}
        - Net Worth at end of plan: ${formatCurrency(result.netWorthAtEnd)}
        - Effective Federal Tax Rate: ${result.federalTaxRate.toFixed(2)}%
        - Effective State Tax Rate: ${result.stateTaxRate.toFixed(2)}%
        - Retirement Duration: ${result.yearsInRetirement} years
        `;

        const prompt = `
        As a friendly and encouraging financial advisor, analyze the following retirement plan summary. 
        The plan is highly detailed. Pay attention to the different income sources, accounts, and expense periods.
        Provide a brief, easy-to-understand overview of their situation based on the calculation results.
        Then, offer three actionable, positive, and personalized tips to improve their retirement outlook or make the most of their situation. 
        Focus on general financial wellness concepts. Do not give direct investment advice.
        Format the response in Markdown. Use headings for "Overview" and "Actionable Tips". Use a bulleted list for the tips.

        Retirement Plan Summary:
        ${planSummary}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;

    } catch (error) {
        console.error("Error fetching Gemini insights:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
             return "You've made too many requests to the AI assistant. Please wait a moment before trying again.";
        }
        return "An error occurred while generating insights. Please check your connection and try again.";
    }
};


export const generateDieWithZeroProjection = async (plan: RetirementPlan): Promise<YearlyProjection[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const isCouple = plan.planType === PlanType.COUPLE;

    const prompt = `
    As a sophisticated financial modeling expert, your task is to generate a year-by-year retirement projection for a user based on the "Die with Zero" strategy.

    **Goal:** Calculate the maximum sustainable annual withdrawal from assets to ensure the final net worth at the end of the plan equals the target "Legacy Amount". The plan ends in the year the last person reaches their life expectancy.

    **Key Rules:**
    1.  **Modeling Period:** Start the projection from the current year and continue until the end of the plan.
    2.  **Asset Growth:** Grow all investment and retirement accounts by the "Average Annual Return" each year. In pre-retirement years, also add annual contributions and employer matches.
    3.  **Income Sources:** Account for all income streams (Pensions, Social Security, Other Incomes) starting at their specified ages. Apply Cost-of-Living Adjustments (COLA) correctly. For pensions, handle survivor benefits. For Social Security, use the estimated benefit, and if one person in a couple passes away, the survivor should receive the higher of the two benefits.
    4.  **Expenses:** Inflate the planned annual expenses by the "Inflation Rate" each year.
    5.  **Taxes:** For each year, calculate the taxable income (withdrawals + taxable incomes), apply the provided federal and state tax brackets and standard deductions to determine the total tax liability.
    6.  **RMDs (Required Minimum Distributions):** From age 73 onwards, calculate the RMD from non-Roth retirement accounts using the provided RMD table. The annual withdrawal MUST be at least the RMD amount for that year.
    7.  **Core "Die with Zero" Withdrawal:** The annual withdrawal amount is the primary variable you must calculate for each year. It should be the amount that, when combined with all other factors, results in a smooth spend-down of assets to hit the target legacy amount precisely at the end of the plan. This is an annuity-style calculation.
    8.  **Net Worth:** The final net worth for each year is the previous year's net worth, plus asset growth, minus all withdrawals and expenses.
    
    **Input Data:**
    - Retirement Plan: ${JSON.stringify(plan, null, 2)}
    - Federal Tax Brackets & Deductions: ${JSON.stringify({brackets: FEDERAL_TAX_BRACKETS, deduction: FEDERAL_STANDARD_DEDUCTION}, null, 2)}
    - State Tax Brackets & Deductions for ${plan.state}: ${JSON.stringify(STATE_TAX_BRACKETS[plan.state], null, 2)}
    - RMD Table: ${JSON.stringify(RMD_UNIFORM_LIFETIME_TABLE, null, 2)}

    Generate a JSON array of yearly projection objects that strictly adheres to the provided schema. The projection must cover every year from the current ages until the final life expectancy.
    `;

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                year: { type: Type.NUMBER },
                age1: { type: Type.NUMBER },
                age2: { type: isCouple ? Type.NUMBER : Type.NULL },
                investmentBalance: { type: Type.NUMBER },
                retirementBalance: { type: Type.NUMBER },
                pensionIncome: { type: Type.NUMBER },
                socialSecurityIncome: { type: Type.NUMBER },
                otherIncome: { type: Type.NUMBER },
                grossIncome: { type: Type.NUMBER },
                withdrawal: { type: Type.NUMBER },
                expenses: { type: Type.NUMBER },
                federalTax: { type: Type.NUMBER },
                stateTax: { type: Type.NUMBER },
                netIncome: { type: Type.NUMBER },
                surplus: { type: Type.NUMBER },
                netWorth: { type: Type.NUMBER },
                rmd: { type: Type.NUMBER },
            },
            required: [
                'year', 'age1', 'investmentBalance', 'retirementBalance', 'pensionIncome',
                'socialSecurityIncome', 'otherIncome', 'grossIncome', 'withdrawal', 'expenses',
                'federalTax', 'stateTax', 'netIncome', 'surplus', 'netWorth', 'rmd'
            ]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const projections = JSON.parse(jsonText) as YearlyProjection[];
        
        // Gemini might not include the optional age2 field, so add it if it's a couple plan
        if (isCouple) {
            return projections.map((p, i) => ({
                ...p,
                age2: plan.person2.currentAge + i
            }));
        }

        return projections;

    } catch (error) {
        console.error("Error generating AI projection:", error);
        throw new Error("The AI model could not generate a projection for this plan. This can happen with very complex or unusual scenarios. Please try adjusting your inputs or disabling the 'Die with Zero' feature.");
    }
};