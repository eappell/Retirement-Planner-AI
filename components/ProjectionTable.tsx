import React, { useMemo, useRef, useState, useEffect } from 'react';
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
    const containerRef = useRef<HTMLDivElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    // store last mouse position so we can reposition the tooltip during scroll/resize
    // anchorRectRef stores the bounding rect of the selected row (in container coordinates)
    const anchorRectRef = useRef<DOMRect | null>(null);
    const [selectedRow, setSelectedRow] = useState<YearlyProjection | null>(null);
    const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number } | null>(null);

    const renderHeader = () => (
        <thead className="sticky top-0 z-10">
            <tr>
                <th className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Year</th>
                <th className="p-2 text-sm text-left bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{isCouple ? "Ages" : "Age"}</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Inv Bal.</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Retire Bal.</th>
                <th className="p-2 text-sm text-right bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">RMD</th>
                {hasGifts && <th className="p-2 text-sm text-right bg_gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Gifts</th>}
                <th className="p-2 text-sm text-right bg_gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Gross Inc.</th>
                <th className="p-2 text-sm text-right bg_gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Expenses</th>
                <th className="p-2 text-sm text-right bg_gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Fed Tax</th>
                <th className="p-2 text-sm text-right bg_gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">State Tax</th>
                <th className="p-2 text-sm text-right bg_gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Net Inc.</th>
                <th className="p-2 text-sm text-right bg_gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Surplus</th>
                <th className="p-2 text-sm text-right font-bold bg_gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Net Worth</th>
            </tr>
        </thead>
    );

    const renderRow = (row: YearlyProjection) => {
        const p1Dead = row.age1 > person1.lifeExpectancy;
        const p2Dead = isCouple && row.age2 && row.age2 > person2.lifeExpectancy;

        // On click select the row and position the popover near the row's rect inside the container
        const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
            setSelectedRow(row);
            const containerRect = containerRef.current?.getBoundingClientRect();
            const rowRect = (e.currentTarget as HTMLTableRowElement).getBoundingClientRect();
            anchorRectRef.current = rowRect;

            if (containerRect && containerRef.current) {
                const popWidth = 300;
                const popHeight = popoverRef.current?.offsetHeight || 180;
                const scrollTop = containerRef.current.scrollTop || 0;
                const scrollLeft = containerRef.current.scrollLeft || 0;

                // position to the right of the row, vertically centered on the row
                const rawLeft = rowRect.right - containerRect.left + scrollLeft + 8;
                const left = Math.max(8, Math.min(rawLeft, containerRect.width - popWidth - 8 + scrollLeft));

                const rawTop = rowRect.top - containerRect.top + scrollTop + (rowRect.height / 2) - (popHeight / 2);
                const top = Math.min(Math.max(rawTop, 8), containerRect.height - popHeight - 8 + scrollTop);

                setPopoverStyle({ top, left });
            } else {
                setPopoverStyle(null);
            }
        };

        return (
            <tr
                key={row.year}
                onClick={handleClick}
                className={`bg-gray-50 dark:bg-gray-800 text-base text-gray-800 dark:text-gray-200 dark:border-b dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer ${selectedRow?.year === row.year ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
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
                <td className={`p-2 text-right ${row.surplus >= 0 ? 'text-green-700 dark:text-green-200' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(row.surplus / 12)}</td>
                <td className="p-2 text-right font-bold text-brand-primary">{formatCurrency(row.netWorth)}</td>
            </tr>
        );
    };

    // close popover on outside click
    useEffect(() => {
        const handler = (ev: MouseEvent) => {
            const target = ev.target as Node;
            if (popoverRef.current && popoverRef.current.contains(target)) return;
            // clicking a row will set selectedRow; if click is inside container, let it be handled by row click
            if (containerRef.current && containerRef.current.contains(target)) {
                return;
            }
            setSelectedRow(null);
            setPopoverStyle(null);
            anchorRectRef.current = null;
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Reposition popover on container scroll / window scroll / resize so it stays anchored to the selected row
    useEffect(() => {
        const reposition = () => {
            if (!selectedRow || !anchorRectRef.current) return;
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect || !containerRef.current) return;

            const popWidth = 300;
            const popHeight = popoverRef.current?.offsetHeight || 180;

            const scrollTop = containerRef.current?.scrollTop || 0;
            const scrollLeft = containerRef.current?.scrollLeft || 0;

            const rowRect = anchorRectRef.current;
            const rawLeft = rowRect.right - containerRect.left + scrollLeft + 8;
            const left = Math.max(8, Math.min(rawLeft, containerRect.width - popWidth - 8 + scrollLeft));

            const rawTop = rowRect.top - containerRect.top + scrollTop + (rowRect.height / 2) - (popHeight / 2);
            const top = Math.min(Math.max(rawTop, 8), containerRect.height - popHeight - 8 + scrollTop);

            setPopoverStyle({ top, left });
        };

        const cont = containerRef.current;
        cont?.addEventListener('scroll', reposition, { passive: true });
        window.addEventListener('scroll', reposition, { passive: true });
        window.addEventListener('resize', reposition);

        return () => {
            cont?.removeEventListener('scroll', reposition);
            window.removeEventListener('scroll', reposition);
            window.removeEventListener('resize', reposition);
        };
    }, [selectedRow]);

    return (
        <div ref={containerRef} className="w-full overflow-x-auto max-h-[600px] relative rounded-lg border">
            <table className="w-full border-collapse projection-table">
                {renderHeader()}
                <tbody className="divide-y-0">
                    {data.map(renderRow)}
                </tbody>
            </table>

            {selectedRow && popoverStyle && (
                <div
                    ref={popoverRef}
                    style={{ ['--tp-x' as any]: `${popoverStyle.left}px`, ['--tp-y' as any]: `${popoverStyle.top}px` }}
                    className="projection-popover absolute z-20 w-72 shadow-lg rounded-md p-3 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-semibold">Year {selectedRow.year}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-300">
                                {isCouple
                                    ? `Age ${person1.name} ${selectedRow.age1}, ${person2.name} ${selectedRow.age2}`
                                    : `Age ${selectedRow.age1}`}
                            </div>
                        </div>
                        <div>
                            <button
                                aria-label="Close"
                                onClick={() => { setSelectedRow(null); setPopoverStyle(null); anchorRectRef.current = null; }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center projection-popover-label"><span className="inline-block swatch swatch-indigo mr-2"></span>Net Worth</span>
                          <span className="font-medium">{formatCurrency(selectedRow.netWorth)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center projection-popover-label"><span className="inline-block swatch swatch-green mr-2"></span>Gross Income</span>
                          <span className="font-medium">{formatCurrency(selectedRow.grossIncome / 12)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center projection-popover-label"><span className="inline-block swatch swatch-indigo-light mr-2"></span>Net Income</span>
                          <span className="font-medium">{formatCurrency(selectedRow.netIncome / 12)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center projection-popover-label"><span className="inline-block swatch swatch-red mr-2"></span>Fed Taxes</span>
                          <span className="font-medium">{formatCurrency(selectedRow.federalTax / 12)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center projection-popover-label"><span className="inline-block swatch swatch-amber mr-2"></span>State Taxes</span>
                          <span className="font-medium">{formatCurrency(selectedRow.stateTax / 12)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center projection-popover-label"><span className="inline-block swatch swatch-red-dark mr-2"></span>Expenses</span>
                          <span className="font-medium">{formatCurrency(selectedRow.expenses / 12)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="flex items-center projection-popover-label"><span className="inline-block swatch swatch-green-dark mr-2"></span>Surplus</span>
                          <span className={`font-medium ${selectedRow.surplus >= 0 ? 'text-green-700 dark:text-green-200' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(selectedRow.surplus / 12)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});