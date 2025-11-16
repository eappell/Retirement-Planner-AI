import React from 'react';
import { RetirementPlan, CalculationResult, PlanType, YearlyProjection } from '../types';

// Helper to format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

// Reusable Section component for the report
const ReportSection: React.FC<{ title: string; children: React.ReactNode; color: string }> = ({ title, children, color }) => (
    <div className="mb-4 break-inside-avoid">
        <h2 className={`text-xl font-bold p-2 text-white ${color}`}>{title}</h2>
        <div className="p-3 border border-t-0 border-gray-300">
            {children}
        </div>
    </div>
);

// Reusable item row
const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between py-1.5 border-b">
        <span className="font-semibold text-gray-700">{label}:</span>
        <span>{value}</span>
    </div>
);

export const PrintableReport: React.FC<{ plan: RetirementPlan; results: CalculationResult | null }> = ({ plan, results }) => {
    if (!results) return null;

    const isCouple = plan.planType === PlanType.COUPLE;
    
    const filteredProjections = results.yearlyProjections.filter(p => {
        if (isCouple) {
            return p.age1 >= plan.person1.retirementAge || (p.age2 !== undefined && p.age2 >= plan.person2.retirementAge);
        }
        return p.age1 >= plan.person1.retirementAge;
    });

    const currentNetWorth =
        plan.retirementAccounts.reduce((sum, acc) => sum + acc.balance, 0) +
        plan.investmentAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    return (
        <div className="hidden print:block font-sans p-4">
            <header className="text-center mb-6 border-b-4 border-indigo-500 pb-4">
                <h1 className="text-4xl font-bold text-indigo-600">Retirement Plan Summary</h1>
                <p className="text-gray-600 mt-1">Generated for {plan.person1.name}{isCouple ? ` & ${plan.person2.name}` : ''} on {new Date().toLocaleDateString()}</p>
            </header>

            <main>
                <div className="grid grid-cols-2 gap-x-6">
                    <div className="col-span-1">
                         <ReportSection title="Key Projections" color="bg-indigo-500">
                            <InfoRow label="Current Net Worth" value={formatCurrency(currentNetWorth)} />
                            <InfoRow label="Avg. Monthly Net Income" value={formatCurrency(results.avgMonthlyNetIncomeFuture)} />
                            <InfoRow label="Final Net Worth (Future $)" value={formatCurrency(results.netWorthAtEndFuture)} />
                            <InfoRow label="Avg. Federal Tax Rate" value={`${results.federalTaxRate.toFixed(1)}%`} />
                            <InfoRow label="Avg. State Tax Rate" value={`${results.stateTaxRate.toFixed(1)}%`} />
                        </ReportSection>
                    </div>
                     <div className="col-span-1">
                        <ReportSection title="Accounts & Incomes" color="bg-green-600">
                            {plan.retirementAccounts.length > 0 && <InfoRow label="Retirement Accounts" value={formatCurrency(plan.retirementAccounts.reduce((s,a) => s + a.balance, 0))} />}
                            {plan.investmentAccounts.length > 0 && <InfoRow label="Investment Accounts" value={formatCurrency(plan.investmentAccounts.reduce((s,a) => s + a.balance, 0))} />}
                            {plan.pensions.length > 0 && <InfoRow label="Total Pension Income" value={`${formatCurrency(plan.pensions.reduce((s,p) => s + p.monthlyBenefit, 0))}/mo`} />}
                            {plan.otherIncomes.length > 0 && <InfoRow label="Other Income" value={`${formatCurrency(plan.otherIncomes.reduce((s,i) => s + i.monthlyAmount, 0))}/mo`} />}
                        </ReportSection>
                    </div>
                </div>
                
                 <ReportSection title="People & Plan Assumptions" color="bg-gray-600">
                    <div className="grid grid-cols-3 gap-x-8">
                        {/* Person 1 */}
                        <div className="col-span-1">
                            <h3 className="font-bold text-lg mb-1">{plan.person1.name}</h3>
                            <InfoRow label="Current Age" value={plan.person1.currentAge} />
                            <InfoRow label="Retirement Age" value={plan.person1.retirementAge} />
                            <InfoRow label="Life Expectancy" value={plan.person1.lifeExpectancy} />
                            <InfoRow label="SS Claiming Age" value={plan.person1.claimingAge} />
                        </div>
                        
                        {/* Person 2 */}
                        {isCouple ? (
                             <div className="col-span-1">
                                 <h3 className="font-bold text-lg mb-1">{plan.person2.name}</h3>
                                 <InfoRow label="Current Age" value={plan.person2.currentAge} />
                                 <InfoRow label="Retirement Age" value={plan.person2.retirementAge} />
                                 <InfoRow label="Life Expectancy" value={plan.person2.lifeExpectancy} />
                                 <InfoRow label="SS Claiming Age" value={plan.person2.claimingAge} />
                             </div>
                         ) : <div className="col-span-1"></div>}

                         {/* General Assumptions */}
                        <div className="col-span-1">
                             <h3 className="font-bold text-lg mb-1">General</h3>
                             <InfoRow label="State of Residence" value={plan.state} />
                             <InfoRow label="Est. Annual Inflation" value={`${plan.inflationRate}%`} />
                             <InfoRow label="Annual Withdrawal Rate" value={plan.dieWithZero ? 'Dynamic' : `${plan.annualWithdrawalRate}%`} />
                             {plan.dieWithZero && <InfoRow label="Leave Behind" value={formatCurrency(plan.legacyAmount)} />}
                        </div>
                    </div>
                </ReportSection>
                
                 {/* Expenses */}
                <ReportSection title="Planned Expenses" color="bg-red-500">
                    {plan.expensePeriods.map(exp => (
                        <InfoRow key={exp.id} label={`${exp.name} (Ages ${exp.startAge}-${exp.endAge})`} value={`${formatCurrency(exp.monthlyAmount)}/mo`} />
                    ))}
                </ReportSection>


                {/* Projection Table */}
                <div className="mt-6 break-before-page">
                    <h2 className="text-2xl font-bold mb-2 text-center text-indigo-600">Annual Projection Details</h2>
                     <table className="w-full text-xs border-collapse border border-gray-400">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="p-1 border border-gray-300">Year</th>
                                <th className="p-1 border border-gray-300">{isCouple ? "Ages" : "Age"}</th>
                                <th className="p-1 border border-gray-300">Net Worth</th>
                                <th className="p-1 border border-gray-300 bg-blue-100">Gross Inc.</th>
                                <th className="p-1 border border-gray-300">Expenses</th>
                                <th className="p-1 border border-gray-300 bg-red-100">Taxes</th>
                                <th className="p-1 border border-gray-300">RMD</th>
                                <th className="p-1 border border-gray-300 bg-green-100">Net Inc.</th>
                                <th className="p-1 border border-gray-300">Surplus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjections.map((row: YearlyProjection) => (
                                <tr key={row.year} className="border-b">
                                    <td className="p-1 border border-gray-300 text-center">{row.year}</td>
                                    <td className="p-1 border border-gray-300 text-center">{isCouple ? `${row.age1}/${row.age2}` : row.age1}</td>
                                    <td className="p-1 border border-gray-300 text-right font-bold">{formatCurrency(row.netWorth)}</td>
                                    <td className="p-1 border border-gray-300 text-right bg-blue-100">{formatCurrency(row.grossIncome)}</td>
                                    <td className="p-1 border border-gray-300 text-right">{formatCurrency(row.expenses)}</td>
                                    <td className="p-1 border border-gray-300 text-right bg-red-100">{formatCurrency(row.federalTax + row.stateTax)}</td>
                                    <td className="p-1 border border-gray-300 text-right">{formatCurrency(row.rmd)}</td>
                                    <td className="p-1 border border-gray-300 text-right bg-green-100 font-semibold">{formatCurrency(row.netIncome)}</td>
                                    <td className={`p-1 border border-gray-300 text-right ${row.surplus >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(row.surplus)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};