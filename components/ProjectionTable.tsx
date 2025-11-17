

import React from 'react';
import { YearlyProjection, RetirementPlan, PlanType } from '../types.ts';

interface ProjectionTableProps {
  data: YearlyProjection[];
  plan: RetirementPlan;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const formatCurrencyShort = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
        return (value / 1_000_000).toFixed(1) + 'M';
    }
    if (Math.abs(value) >= 1_000) {
        return (value / 1_000).toFixed(0) + 'K';
    }
    return value.toFixed(0);
}

export const ProjectionTable: React.FC<ProjectionTableProps> = ({ data, plan }) => {
    const isCouple = plan.planType === PlanType.COUPLE;
    const { person1, person2 } = plan;

    const renderHeader = () => (
        <thead className="text-gray-600 sticky top-0 z-10">
            <tr>
                <th className="p-2 text-sm text-left bg-gray-100">Year</th>
                <th className="p-2 text-sm text-left bg-gray-100">{isCouple ? "Ages" : "Age"}</th>
                <th className="p-2 text-sm text-right bg-gray-100">Inv Bal.</th>
                <th className="p-2 text-sm text-right bg-gray-100">Retire Bal.</th>
                <th className="p-2 text-sm text-right bg-gray-100">RMD</th>
                <th className="p-2 text-sm text-right bg-blue-50">Gross Inc.</th>
                <th className="p-2 text-sm text-right bg-gray-100">Expenses</th>
                <th className="p-2 text-sm text-right bg-red-50">Fed Tax</th>
                <th className="p-2 text-sm text-right bg-red-50">State Tax</th>
                <th className="p-2 text-sm text-right bg-green-50">Net Inc.</th>
                <th className="p-2 text-sm text-right bg-gray-100">Surplus</th>
                <th className="p-2 text-sm text-right font-bold bg-gray-100">Net Worth</th>
            </tr>
        </thead>
    );

    const renderRow = (row: YearlyProjection) => {
        const p1Dead = row.age1 > person1.lifeExpectancy;
        const p2Dead = isCouple && row.age2 && row.age2 > person2.lifeExpectancy;

        return (
            <tr key={row.year} className="border-b border-gray-200 odd:bg-white even:bg-gray-50 text-base text-gray-800">
                <td className="p-2 text-left">{row.year}</td>
                <td className="p-2 text-left">
                    {isCouple ? (
                        <>
                            <span className={p1Dead ? 'text-gray-400' : ''}>{row.age1}</span>
                            /
                            <span className={p2Dead ? 'text-gray-400' : ''}>{row.age2}</span>
                        </>
                    ) : row.age1}
                </td>
                <td className="p-2 text-right">{formatCurrency(row.investmentBalance)}</td>
                <td className="p-2 text-right">{formatCurrency(row.retirementBalance)}</td>
                <td className="p-2 text-right">{formatCurrency(row.rmd / 12)}</td>
                <td className="p-2 text-right bg-blue-50 text-blue-800">{formatCurrency(row.grossIncome / 12)}</td>
                <td className="p-2 text-right">{formatCurrency(row.expenses / 12)}</td>
                <td className="p-2 text-right bg-red-50 text-red-800">{formatCurrency(row.federalTax / 12)}</td>
                <td className="p-2 text-right bg-red-50 text-red-800">{formatCurrency(row.stateTax / 12)}</td>
                <td className="p-2 text-right bg-green-50 text-green-800 font-semibold">{formatCurrency(row.netIncome / 12)}</td>
                <td className={`p-2 text-right ${row.surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(row.surplus / 12)}</td>
                <td className="p-2 text-right font-bold text-brand-primary">{formatCurrency(row.netWorth)}</td>
            </tr>
        );
    };

    return (
        <div className="w-full overflow-x-auto max-h-[600px] relative rounded-lg border">
            <table className="w-full border-collapse">
                {renderHeader()}
                <tbody>
                    {data.map(renderRow)}
                </tbody>
            </table>
        </div>
    );
};