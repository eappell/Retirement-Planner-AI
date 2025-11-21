import React, { useMemo } from 'react';
import { YearlyProjection, RetirementPlan, PlanType } from '../types';

interface ProjectionTableProps {
  data: YearlyProjection[];
  plan: RetirementPlan;
}

// Create formatter outside component for reuse
const currencyFormatter = new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatCurrencyShort = (value: number) => {
    if (Math.abs(value) >= 1_000_000) {
        return (value / 1_000_000).toFixed(1) + 'M';
    }
    if (Math.abs(value) >= 1_000) {
        return (value / 1_000).toFixed(0) + 'K';
    }
    return value.toFixed(0);
}

export const ProjectionTable: React.FC<ProjectionTableProps> = React.memo(({ data, plan }) => {
    const isCouple = plan.planType === PlanType.COUPLE;
    const { person1, person2 } = plan;
    const hasGifts = !!(plan.gifts && plan.gifts.length > 0);

    const renderHeader = () => (
        <thead className="sticky top-0 z-10">
            <tr>
                <th className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Year</th>
                <th className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{isCouple ? "Ages" : "Age"}</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Inv Bal.</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Retire Bal.</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">RMD</th>
                {hasGifts && <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Gifts</th>}
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Gross Inc.</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Expenses</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Fed Tax</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">State Tax</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Net Inc.</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Surplus</th>
                <th className="p-2 text-sm text-right font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Net Worth</th>
            </tr>
        </thead>
    );

    const renderRow = (row: YearlyProjection) => {
        const p1Dead = row.age1 > person1.lifeExpectancy;
        const p2Dead = isCouple && row.age2 && row.age2 > person2.lifeExpectancy;

        return (
            <tr key={row.year} className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-base text-gray-800 dark:text-gray-200">
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
                {hasGifts && <td className="p-2 text-right projection-col-gifts">{formatCurrency((row.gifts || 0) / 12)}</td>}
                <td className="p-2 text-right projection-col-income">{formatCurrency(row.grossIncome / 12)}</td>
                <td className="p-2 text-right">{formatCurrency(row.expenses / 12)}</td>
                <td className="p-2 text-right projection-col-tax">{formatCurrency(row.federalTax / 12)}</td>
                <td className="p-2 text-right projection-col-tax">{formatCurrency(row.stateTax / 12)}</td>
                <td className="p-2 text-right font-semibold projection-col-netincome">{formatCurrency(row.netIncome / 12)}</td>
                <td className={`p-2 text-right ${row.surplus >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(row.surplus / 12)}</td>
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
});