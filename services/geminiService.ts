import { GoogleGenAI } from "@google/genai";
import { RetirementPlan, CalculationResult, PlanType, RetirementAccount, InvestmentAccount, Pension, OtherIncome, ExpensePeriod } from '../types';

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
