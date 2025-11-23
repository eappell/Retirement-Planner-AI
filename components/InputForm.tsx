import React, { useState, useEffect, useRef } from 'react';
import AddButton from './AddButton';
import { RetirementPlan, Person, PlanType, RetirementAccount, InvestmentAccount, Pension, OtherIncome, Annuity, ExpensePeriod, Gift, LegacyDisbursement, OneTimeExpense } from '../types';
import { InputSection } from './InputSection';
import { NumberInput, SelectInput, TextInput } from './FormControls';
import { STATES } from '../constants';
import { validateAssetDefaults } from '../utils/assetValidation';

type DynamicListKey = 'retirementAccounts' | 'investmentAccounts' | 'pensions' | 'annuities' | 'otherIncomes' | 'expensePeriods' | 'gifts' | 'legacyDisbursements' | 'oneTimeExpenses';

interface InputFormProps {
    plan: RetirementPlan;
    handlePlanChange: <T extends keyof RetirementPlan>(field: T, value: RetirementPlan[T]) => void;
    handlePersonChange: (person: 'person1' | 'person2', field: keyof Person, value: string) => void;
    handleDynamicListChange: <K extends DynamicListKey>(
        listName: K,
        id: string,
        field: any,
        value: string | boolean
    ) => void;
    addToList: <K extends DynamicListKey>(listName: K, newItem: RetirementPlan[K][number]) => void;
    removeFromList: (listName: DynamicListKey, id: string) => void;
}

export const InputForm: React.FC<InputFormProps> = ({
    plan,
    handlePlanChange,
    handlePersonChange,
    handleDynamicListChange,
    addToList,
    removeFromList
}) => {
    const isCouple = plan.planType === PlanType.COUPLE;
    const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingValue, setDraggingValue] = useState<number | null>(null);
    const sliderRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [incomeTab, setIncomeTab] = useState<'pensions' | 'annuities' | 'other'>('pensions');
    const [accountsTab, setAccountsTab] = useState<'retirement' | 'investment'>('retirement');
    const [estateTab, setEstateTab] = useState<'gifts' | 'legacy'>('gifts');
    const [expensesTab, setExpensesTab] = useState<'periods' | 'oneTime'>('oneTime');
    useEffect(() => {
        if (!focusTargetId) return;
        const el = document.getElementById(focusTargetId) as HTMLInputElement | null;
        if (el) {
            el.focus();
            el.select?.();
        }
        setFocusTargetId(null);
    }, [focusTargetId]);
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    const ActionIcons = ({ onAdd, onRemove, canRemove }: { onAdd: () => void; onRemove: () => void; canRemove: boolean }) => (
        <div className="flex items-center space-x-1 pl-2">
            <button type="button" onClick={onAdd} className="text-green-500 hover:text-green-700 p-1 rounded-full hover:bg-green-100 transition-colors" title="Add new item">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
            </button>
            {canRemove && (
                <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors" title="Remove item">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </div>
    );

    // Keyboard navigation for Accounts tabs (Left/Right/Home/End)
    const handleAccountsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const ids = ['tab-retirement', 'tab-investment'];
        const activeId = document.activeElement?.id || '';
        const idx = ids.indexOf(activeId);
        let next = idx;
        if (e.key === 'ArrowRight') next = idx === -1 ? 0 : (idx + 1) % ids.length;
        else if (e.key === 'ArrowLeft') next = idx === -1 ? ids.length - 1 : (idx - 1 + ids.length) % ids.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = ids.length - 1;
        else return;
        e.preventDefault();
        const nextId = ids[next];
        if (nextId === 'tab-retirement') setAccountsTab('retirement');
        else setAccountsTab('investment');
        const el = document.getElementById(nextId);
        el?.focus();
    };

    // Keyboard navigation for Income tabs (Left/Right/Home/End)
    const handleIncomeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const ids = ['tab-pensions', 'tab-annuities', 'tab-otherincomes'];
        const activeId = document.activeElement?.id || '';
        const idx = ids.indexOf(activeId);
        let next = idx;
        if (e.key === 'ArrowRight') next = idx === -1 ? 0 : (idx + 1) % ids.length;
        else if (e.key === 'ArrowLeft') next = idx === -1 ? ids.length - 1 : (idx - 1 + ids.length) % ids.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = ids.length - 1;
        else return;
        e.preventDefault();
        const nextId = ids[next];
        if (nextId === 'tab-pensions') setIncomeTab('pensions');
        else if (nextId === 'tab-annuities') setIncomeTab('annuities');
        else setIncomeTab('other');
        const el = document.getElementById(nextId);
        el?.focus();
    };

    // Keyboard navigation for Estate Planning tabs
    const handleEstateKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const ids = ['tab-gifts', 'tab-legacy'];
        const activeId = document.activeElement?.id || '';
        const idx = ids.indexOf(activeId);
        let next = idx;
        if (e.key === 'ArrowRight') next = idx === -1 ? 0 : (idx + 1) % ids.length;
        else if (e.key === 'ArrowLeft') next = idx === -1 ? ids.length - 1 : (idx - 1 + ids.length) % ids.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = ids.length - 1;
        else return;
        e.preventDefault();
        const nextId = ids[next];
        if (nextId === 'tab-gifts') setEstateTab('gifts');
        else setEstateTab('legacy');
        const el = document.getElementById(nextId);
        el?.focus();
    };

    // helpers for gifts & legacy so they can be used in the new Estate section
    const addGiftGlobal = () => {
        const id = Date.now().toString();
        const newGift: Gift = { id, beneficiary: '', owner: 'person1', isAnnual: false, amount: 0, annualAmount: 0, age: plan.person1.currentAge, startAge: plan.person1.retirementAge, endAge: plan.person1.lifeExpectancy };
        addToList('gifts', newGift);
        setFocusTargetId(`gift-beneficiary-${id}`);
    };

    const addLegacyGlobal = () => {
        const id = Date.now().toString();
        const newLegacy: LegacyDisbursement = { id, beneficiary: '', beneficiaryType: 'person', percentage: 0 };
        addToList('legacyDisbursements', newLegacy);
        setFocusTargetId(`legacy-beneficiary-${id}`);
    };
    
    return (
        <>
            {/* local focus target for newly-added dynamic list items */}
            {/* when set, effect will focus the element with that id after render */}
            
            
            <InputSection 
                title="Plan Information"
                subtitle="Set the high-level assumptions for your retirement plan."
            >
                    {/* Advanced Market Assumptions moved below person fields for better flow */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 col-span-full">
                    <div className="flex flex-col space-y-2 h-full">
                        {(Object.values(PlanType) as PlanType[]).map(type => (
                            
                            <button
                                key={type}
                                onClick={() => {
                                    handlePlanChange('planType', type);
                                    // focus appropriate field after switching plan type
                                    if (type === PlanType.COUPLE) setFocusTargetId('person2-name');
                                    else setFocusTargetId('person1-name');
                                }}
                                className={`px-3 py-1.5 text-sm rounded-md w-full flex-1 ${plan.planType === type ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <SelectInput label="State" value={plan.state} onChange={e => handlePlanChange('state', e.target.value)}>
                            {Object.entries(STATES).map(([abbr, name]) => <option key={abbr} value={abbr}>{name}</option>)}
                    </SelectInput>
                    <NumberInput label="Inflation" suffix="%" value={plan.inflationRate} onChange={e => handlePlanChange('inflationRate', Number(e.target.value))}/>
                    <NumberInput label="Avg. Return" suffix="%" value={plan.avgReturn} onChange={e => handlePlanChange('avgReturn', Number(e.target.value))}/>
                    <NumberInput label="Withdrawal Rate" suffix="%" value={plan.annualWithdrawalRate} onChange={e => handlePlanChange('annualWithdrawalRate', Number(e.target.value))} disabled={plan.dieWithZero}/>
                </div>
                <details className="mt-3 col-span-full">
                    <summary className="cursor-pointer text-sm font-medium text-brand-text-primary">Advanced Market Assumptions</summary>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                        <NumberInput label="Stocks: Expected Return" suffix="%" value={(plan.stockMean ?? 8)} onChange={e => handlePlanChange('stockMean', Number(e.target.value))} />
                        <NumberInput label="Stocks: Volatility (std dev)" suffix="%" value={(plan.stockStd ?? 15)} onChange={e => handlePlanChange('stockStd', Number(e.target.value))} />
                        <NumberInput label="Bonds: Expected Return" suffix="%" value={(plan.bondMean ?? 3)} onChange={e => handlePlanChange('bondMean', Number(e.target.value))} />
                        <NumberInput label="Bonds: Volatility (std dev)" suffix="%" value={(plan.bondStd ?? 6)} onChange={e => handlePlanChange('bondStd', Number(e.target.value))} />
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div className="flex items-center space-x-3">
                            <input id="useFatTails" type="checkbox" checked={!!plan.useFatTails} onChange={e => handlePlanChange('useFatTails', e.target.checked as any)} className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary" />
                            <label htmlFor="useFatTails" className="text-sm font-medium">Use fat-tailed returns</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <NumberInput label="Tail degrees of freedom (df)" value={plan.fatTailDf ?? 4} onChange={e => handlePlanChange('fatTailDf', Number(e.target.value))} />
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">When <strong>Use fat-tailed returns</strong> is enabled, projections sample yearly asset returns from a Student's t-distribution (lower degrees of freedom to fatter tails). This increases the probability of large shocks (both positive and negative) versus a normal distribution — use with care. Typical df values: 3–6 for noticeably fat tails; df greater than 30 approximates normal.</p>

                    {(() => {
                        const sd = Number(plan.stockStd ?? 15);
                        const bd = Number(plan.bondStd ?? 6);
                        const sm = Number(plan.stockMean ?? 8);
                        const bm = Number(plan.bondMean ?? 3);
                        const issues = validateAssetDefaults({ stockMean: sm, bondMean: bm, stockStd: sd, bondStd: bd });

                        return (
                            <>
                                <p className="text-xs text-gray-500 mt-2">These settings let you tweak the expected returns and volatilities used when calculating allocation-weighted returns for investment accounts. The plan-level Average Return still acts as a baseline and will bias these values so the overall portfolio still matches your `Avg. Return`.</p>
                                {issues.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm text-red-600 font-medium">Market assumptions warnings:</p>
                                        <ul className="text-sm text-red-600 list-disc list-inside">
                                            {issues.map((x, i) => <li key={i}>{x}</li>)}
                                        </ul>
                                    </div>
                                )}
                                <div className="mt-3">
                                    <button type="button" onClick={() => {
                                        try {
                                            const assetDefaults = { stockMean: sm, stockStd: sd, bondMean: bm, bondStd: bd, useFatTails: !!plan.useFatTails, fatTailDf: plan.fatTailDf ?? 4 };
                                            localStorage.setItem('assetAssumptionDefaults', JSON.stringify(assetDefaults));
                                            window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Saved asset-assumption defaults' } }));
                                        } catch (e) {
                                            console.error(e);
                                            window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: 'Failed to save app defaults' } }));
                                        }
                                    }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">Save as App Defaults</button>
                                </div>
                            </>
                        );
                    })()}
                </details>
                {/* Fat-tail demo removed per user request */}

            </InputSection>

            <div className="bg-brand-surface p-3 rounded-lg shadow-sm flex items-center space-x-4">
                    <div className="flex items-center space-x-2 flex-shrink-0">
                    <input
                        type="checkbox"
                        id="dieWithZeroCheck"
                        checked={plan.dieWithZero}
                        onChange={e => {
                            handlePlanChange('dieWithZero', e.target.checked);
                            if (e.target.checked) setFocusTargetId('legacyAmountInput');
                        }}
                        className="h-5 w-5 rounded text-brand-primary focus:ring-brand-primary"
                    />
                    <label htmlFor="dieWithZeroCheck" className="font-bold text-lg text-brand-primary cursor-pointer whitespace-nowrap">
                        Die With Zero
                    </label>
                </div>

                <div className={`flex items-center space-x-2 flex-shrink-0 transition-opacity ${!plan.dieWithZero ? 'opacity-60' : ''}`}>
                    <label htmlFor="legacyAmountInput" className={`text-sm font-medium ${!plan.dieWithZero ? 'text-gray-500' : 'text-brand-text-secondary'}`}>Leave Behind:</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 text-sm">
                            $
                        </span>
                        <input
                            id="legacyAmountInput"
                            type="number"
                            value={plan.legacyAmount}
                            onChange={e => handlePlanChange('legacyAmount', Number(e.target.value))}
                            disabled={!plan.dieWithZero}
                            className={`w-32 pl-7 pr-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-transparent text-sm ${
                                !plan.dieWithZero
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                                : 'bg-white text-brand-text-primary'
                            }`}
                        />
                    </div>
                </div>
                
                <p className="text-sm text-brand-text-secondary italic flex-1 min-w-0">
                    Calculates the maximum withdrawal to end with your target legacy, overriding the fixed withdrawal rate.
                </p>
            </div>

            
            <div className={`grid grid-cols-1 ${isCouple ? 'md:grid-cols-2' : ''} gap-6`}>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 flex items-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Person 1
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 items-end">
                        <TextInput id="person1-name" label="Name" value={plan.person1.name} onChange={e => handlePersonChange('person1', 'name', e.target.value)} />
                        <NumberInput label="Current Age" value={plan.person1.currentAge} onChange={e => handlePersonChange('person1', 'currentAge', e.target.value)} />
                        <NumberInput label="Retirement Age" value={plan.person1.retirementAge} onChange={e => handlePersonChange('person1', 'retirementAge', e.target.value)} />
                        <NumberInput label="Life Expectancy" value={plan.person1.lifeExpectancy} onChange={e => handlePersonChange('person1', 'lifeExpectancy', e.target.value)} />
                    </div>
                </div>
                {isCouple && (
                    <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                        <h3 className="font-semibold text-rose-800 flex items-center mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Person 2
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 items-end">
                            <TextInput id="person2-name" label="Name" value={plan.person2.name} onChange={e => handlePersonChange('person2', 'name', e.target.value)} />
                            <NumberInput label="Current Age" value={plan.person2.currentAge} onChange={e => handlePersonChange('person2', 'currentAge', e.target.value)} />
                            <NumberInput label="Retirement Age" value={plan.person2.retirementAge} onChange={e => handlePersonChange('person2', 'retirementAge', e.target.value)} />
                            <NumberInput label="Life Expectancy" value={plan.person2.lifeExpectancy} onChange={e => handlePersonChange('person2', 'lifeExpectancy', e.target.value)} />
                        </div>
                    </div>
                )}
            </div>

            <InputSection title="Social Security" subtitle="Estimate benefits based on current salary and your planned claiming age." titleColorClass="text-[#D4AF37]">
                    <div className={`col-span-full grid grid-cols-1 ${isCouple ? 'md:grid-cols-2' : ''} gap-6`}>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                {plan.person1.name}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <NumberInput label="Current Salary" prefix="$" value={plan.person1.currentSalary} onChange={e => handlePersonChange('person1', 'currentSalary', e.target.value)} />
                                <NumberInput label="Claiming Age" value={plan.person1.claimingAge} onChange={e => handlePersonChange('person1', 'claimingAge', e.target.value)} />
                            </div>
                            <div className="mt-3 text-center bg-blue-100 text-blue-800 p-2 rounded-md">
                                Est. Benefit: <span className="font-bold">{formatCurrency(plan.socialSecurity.person1EstimatedBenefit)}/mo</span>
                            </div>
                        </div>
                        {isCouple && (
                            <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                                <h3 className="font-semibold text-rose-800 mb-3 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-rose-700" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    {plan.person2.name}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <NumberInput label="Current Salary" prefix="$" value={plan.person2.currentSalary} onChange={e => handlePersonChange('person2', 'currentSalary', e.target.value)} />
                                    <NumberInput label="Claiming Age" value={plan.person2.claimingAge} onChange={e => handlePersonChange('person2', 'claimingAge', e.target.value)} />
                                </div>
                                <div className="mt-3 text-center bg-rose-100 text-rose-800 p-2 rounded-md">
                                    Est. Benefit: <span className="font-bold">{formatCurrency(plan.socialSecurity.person2EstimatedBenefit)}/mo</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {isCouple && <p className="col-span-full text-xs text-gray-500 mt-2">Note: Survivor benefits are simplified. Typically, a surviving spouse receives the higher of their own benefit or their deceased spouse's benefit.</p>}
            </InputSection>

                    {/* Accounts - combined tabs for Retirement / Investment accounts */}
                    <InputSection
                        title="Accounts"
                        subtitle="Manage retirement and investment accounts in separate tabs."
                        titleColorClass="text-cyan-600"
                    >
                        <div className="col-span-full">
                            <div className="flex items-center space-x-6 mb-3" role="tablist" aria-label="Accounts Tabs" onKeyDown={handleAccountsKeyDown}>
                                {accountsTab === 'retirement' ? (
                                    <button
                                        type="button"
                                        role="tab"
                                        id="tab-retirement"
                                        aria-selected="true"
                                        aria-controls="panel-retirement"
                                        onClick={() => setAccountsTab('retirement')}
                                        className={`text-sm pb-2 ${'border-b-2 border-cyan-600 text-cyan-700 font-medium'}`}
                                    >
                                        Retirement Accounts
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        role="tab"
                                        id="tab-retirement"
                                        aria-controls="panel-retirement"
                                        onClick={() => setAccountsTab('retirement')}
                                        className={`text-sm pb-2 ${'border-b-2 border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                    >
                                        Retirement Accounts
                                    </button>
                                )}
                                {accountsTab === 'investment' ? (
                                    <button
                                        type="button"
                                        role="tab"
                                        id="tab-investment"
                                        aria-selected="true"
                                        aria-controls="panel-investment"
                                        onClick={() => setAccountsTab('investment')}
                                        className={`text-sm pb-2 ${'border-b-2 border-teal-600 text-teal-700 font-medium'}`}
                                    >
                                        Investment Accounts
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        role="tab"
                                        id="tab-investment"
                                        aria-controls="panel-investment"
                                        onClick={() => setAccountsTab('investment')}
                                        className={`text-sm pb-2 ${'border-b-2 border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                    >
                                        Investment Accounts
                                    </button>
                                )}
                            </div>

                            {/* Retirement tab content */}
                            {accountsTab === 'retirement' && (
                                <div id="panel-retirement" role="tabpanel" aria-labelledby="tab-retirement" className="relative pt-3 space-y-2">
                                    {((plan.retirementAccounts || []) as RetirementAccount[]).map(item => (
                                        <div key={item.id} className="grid gap-x-4 items-end p-2 rounded-md bg-cyan-50/50 grid-cols-7">
                                            <SelectInput label="Owner" value={item.owner} onChange={e => handleDynamicListChange('retirementAccounts', item.id, 'owner', e.target.value)}>
                                                <option value="person1">{plan.person1.name}</option>
                                                {isCouple && <option value="person2">{plan.person2.name}</option>}
                                            </SelectInput>
                                            <TextInput id={`retirementAccounts-name-${item.id}`} label="Name" value={item.name} onChange={e => handleDynamicListChange('retirementAccounts', item.id, 'name', e.target.value)} />
                                            <SelectInput label="Type" value={item.type} onChange={e => handleDynamicListChange('retirementAccounts', item.id, 'type', e.target.value)}>
                                                <option>401k</option>
                                                <option>457b</option>
                                                <option>IRA</option>
                                                <option>Roth IRA</option>
                                                <option>Other</option>
                                            </SelectInput>
                                            <NumberInput label="Balance" prefix="$" value={item.balance} onChange={e => handleDynamicListChange('retirementAccounts', item.id, 'balance', e.target.value)}/>
                                            <NumberInput label="Annual Contrib." prefix="$" value={item.annualContribution} onChange={e => handleDynamicListChange('retirementAccounts', item.id, 'annualContribution', e.target.value)}/>
                                            <NumberInput label="Match" suffix="%" value={item.match} onChange={e => handleDynamicListChange('retirementAccounts', item.id, 'match', e.target.value)}/>
                                            <div className="flex items-end">
                                                <ActionIcons onAdd={() => {
                                                    const id = Date.now().toString();
                                                    const newAcct: RetirementAccount = { ...item, id, balance: 0, annualContribution: 0, match: 0 } as RetirementAccount;
                                                    addToList('retirementAccounts', newAcct);
                                                    setFocusTargetId(`retirementAccounts-name-${id}`);
                                                }} onRemove={() => removeFromList('retirementAccounts', item.id)} canRemove={(plan.retirementAccounts || []).length > 1} />
                                            </div>
                                        </div>
                                    ))}
                                    {(plan.retirementAccounts || []).length === 0 && (
                                        <div className="flex justify-center py-6">
                                            <AddButton label="+ Add Retirement Account" icon={
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10 2L2 7h2v9h12V7h2L10 2z" />
                                                    <path d="M9 12h2v3H9v-3z" />
                                                </svg>
                                            } onClick={() => {
                                                const id = Date.now().toString();
                                                const newAcct: RetirementAccount = { id, owner: 'person1', name: 'New Account', type: '401k', balance: 0, annualContribution: 0, match: 0 };
                                                addToList('retirementAccounts', newAcct);
                                                setFocusTargetId(`retirementAccounts-name-${id}`);
                                            }} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Investment tab content */}
                            {accountsTab === 'investment' && (
                                <div id="panel-investment" role="tabpanel" aria-labelledby="tab-investment" className="relative pt-3 space-y-2">
                                    {(() => {
                                        const invs = (plan.investmentAccounts || []) as InvestmentAccount[];
                                        return (
                                            <>
                                                {invs.map(item => {
                                                    return (
                                                        <React.Fragment key={item.id}>
                                                                <div className="grid gap-x-4 items-end p-2 rounded-md bg-teal-50/50 grid-cols-9">
                                                                    <SelectInput label="Owner" value={item.owner || 'person1'} onChange={e => handleDynamicListChange('investmentAccounts', item.id, 'owner', e.target.value)}>
                                                                        <option value="person1">{plan.person1.name}</option>
                                                                        {isCouple && <option value="person2">{plan.person2.name}</option>}
                                                                    </SelectInput>
                                                                    <TextInput id={`investmentAccounts-name-${item.id}`} label="Name" value={item.name} onChange={e => handleDynamicListChange('investmentAccounts', item.id, 'name', e.target.value)} />
                                                                    <NumberInput label="Balance" prefix="$" value={item.balance} onChange={e => handleDynamicListChange('investmentAccounts', item.id, 'balance', e.target.value)}/>
                                                                    <NumberInput label="Annual Contrib." prefix="$" value={item.annualContribution} onChange={e => handleDynamicListChange('investmentAccounts', item.id, 'annualContribution', e.target.value)}/>
                                                                    <div className="col-span-2">
                                                                        <label className="block text-sm font-medium text-brand-text-secondary">% Stocks</label>
                                                                        <div className="flex items-center space-x-3">
                                                                                <div className="relative w-full" onMouseUp={() => setDraggingId(null)} onTouchEnd={() => setDraggingId(null)}>
                                                                                    <input
                                                                                        ref={el => { sliderRefs.current[item.id] = el; }}
                                                                                        type="range"
                                                                                        min={0}
                                                                                        max={100}
                                                                                        aria-label={`% Stocks for ${item.name || 'account'}`}
                                                                                        value={Number(item.percentStocks ?? 0)}
                                                                                        onMouseDown={() => setDraggingId(item.id)}
                                                                                        onTouchStart={() => setDraggingId(item.id)}
                                                                                        onChange={e => {
                                                                                            const v = Number(e.target.value);
                                                                                            handleDynamicListChange('investmentAccounts', item.id, 'percentStocks', String(v));
                                                                                            handleDynamicListChange('investmentAccounts', item.id, 'percentBonds', String(100 - v));
                                                                                            setDraggingValue(v);
                                                                                        }}
                                                                                        className="w-full"
                                                                                    />
                                                                                    {draggingId === item.id && (
                                                                                        <div className="absolute -top-8 left-0 pointer-events-none w-full flex justify-center">
                                                                                            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">{draggingValue ?? Number(item.percentStocks ?? 0)}%</div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            <div className="w-20 text-right">
                                                                                <div aria-live="polite" className="text-sm font-medium">{Number(item.percentStocks ?? 0)}%</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <NumberInput label="% Bonds" suffix="%" value={100 - (Number(item.percentStocks ?? 0))} disabled />
                                                                    </div>
                                                                <div className="flex items-end">
                                                                    <ActionIcons onAdd={() => {
                                                                        const id = Date.now().toString();
                                                                        const newInv: InvestmentAccount = { ...item, id, balance: 0, annualContribution: 0, percentStocks: 60, percentBonds: 40 } as InvestmentAccount;
                                                                        addToList('investmentAccounts', newInv);
                                                                        setFocusTargetId(`investmentAccounts-name-${id}`);
                                                                    }} onRemove={() => removeFromList('investmentAccounts', item.id)} canRemove={(plan.investmentAccounts || []).length > 1} />
                                                                </div>
                                                            </div>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </>
                                        );
                                    })()}
                                    {(plan.investmentAccounts || []).length === 0 && (
                                        <div className="flex justify-center py-6">
                                            <AddButton label="+ Add Investment Account" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3h4v14H3zM9 8h4v9H9zM15 12h4v5h-4z" /></svg>} onClick={() => {
                                                const id = Date.now().toString();
                                                const newInv: InvestmentAccount = { id, owner: 'person1', name: 'New Investment', balance: 0, annualContribution: 0, percentStocks: 60, percentBonds: 40 };
                                                addToList('investmentAccounts', newInv);
                                                setFocusTargetId(`investmentAccounts-name-${id}`);
                                            }} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </InputSection>

            {/* Income - combined tabs for Pensions / Other Incomes */}
            <InputSection
                title="Income"
                subtitle="Manage pensions and other income sources in tabs."
                titleColorClass="text-sky-600"
            >
                <div className="col-span-full">
                    <div className="flex items-center space-x-6 mb-3" role="tablist" aria-label="Income Tabs" onKeyDown={handleIncomeKeyDown}>
                        {incomeTab === 'pensions' ? (
                            <button
                                type="button"
                                role="tab"
                                id="tab-pensions"
                                aria-selected="true"
                                aria-controls="panel-pensions"
                                onClick={() => setIncomeTab('pensions')}
                                className={`text-sm pb-2 ${'border-b-2 border-sky-600 text-sky-700 font-medium'}`}
                            >
                                Pensions
                            </button>
                        ) : (
                            <button
                                type="button"
                                role="tab"
                                id="tab-pensions"
                                aria-controls="panel-pensions"
                                onClick={() => setIncomeTab('pensions')}
                                className={`text-sm pb-2 ${'border-b-2 border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                Pensions
                            </button>
                        )}
                        {incomeTab === 'annuities' ? (
                            <button
                                type="button"
                                role="tab"
                                id="tab-annuities"
                                aria-selected="true"
                                aria-controls="panel-annuities"
                                onClick={() => setIncomeTab('annuities')}
                                className={`text-sm pb-2 ${'border-b-2 border-indigo-600 text-indigo-700 font-medium'}`}
                            >
                                Annuities
                            </button>
                        ) : (
                            <button
                                type="button"
                                role="tab"
                                id="tab-annuities"
                                aria-controls="panel-annuities"
                                onClick={() => setIncomeTab('annuities')}
                                className={`text-sm pb-2 ${'border-b-2 border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                Annuities
                            </button>
                        )}
                        {incomeTab === 'other' ? (
                            <button
                                type="button"
                                role="tab"
                                id="tab-otherincomes"
                                aria-selected="true"
                                aria-controls="panel-otherincomes"
                                onClick={() => setIncomeTab('other')}
                                className={`text-sm pb-2 ${'border-b-2 border-lime-600 text-lime-700 font-medium'}`}
                            >
                                Other Incomes
                            </button>
                        ) : (
                            <button
                                type="button"
                                role="tab"
                                id="tab-otherincomes"
                                aria-controls="panel-otherincomes"
                                onClick={() => setIncomeTab('other')}
                                className={`text-sm pb-2 ${'border-b-2 border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                Other Incomes
                            </button>
                        )}
                    </div>

                    {/* Pensions panel */}
                    {incomeTab === 'pensions' && (
                        <div id="panel-pensions" role="tabpanel" aria-labelledby="tab-pensions" className="relative pt-3 space-y-2">
                            <p className="text-sm text-gray-500">Enter your monthly pre-tax income (gross)</p>
                            {((plan.pensions || []) as Pension[]).map(item => (
                                <div key={item.id} className="grid gap-x-4 items-end p-2 rounded-md bg-sky-50/50 grid-cols-8">
                                    <div className="col-span-2">
                                        <TextInput id={`pensions-name-${item.id}`} label="Name" value={item.name || ''} onChange={e => handleDynamicListChange('pensions', item.id, 'name', e.target.value)} />
                                    </div>
                                    <NumberInput id={`pensions-monthlyBenefit-${item.id}`} label="Monthly Benefit" prefix="$" value={item.monthlyBenefit} onChange={e => handleDynamicListChange('pensions', item.id, 'monthlyBenefit', e.target.value)}/>
                                    <NumberInput label="Start Age" value={item.startAge} onChange={e => handleDynamicListChange('pensions', item.id, 'startAge', e.target.value)}/>
                                    <NumberInput label="COLA" suffix="%" value={item.cola} onChange={e => handleDynamicListChange('pensions', item.id, 'cola', e.target.value)}/>
                                    <NumberInput label="Survivor" suffix="%" value={item.survivorBenefit} onChange={e => handleDynamicListChange('pensions', item.id, 'survivorBenefit', e.target.value)}/>
                                    <div className="flex flex-col items-center justify-end h-full pb-1">
                                        <label htmlFor={`taxable-${item.id}`} className="mb-1 text-sm font-medium text-brand-text-secondary">Taxable</label>
                                        <input
                                            type="checkbox"
                                            id={`taxable-${item.id}`}
                                            checked={item.taxable !== false}
                                            onChange={e => handleDynamicListChange('pensions', item.id, 'taxable', e.target.checked)}
                                            className="h-5 w-5 rounded text-brand-primary focus:ring-brand-primary"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <ActionIcons onAdd={() => {
                                            const id = Date.now().toString();
                                            const newPension: Pension = { id, owner: 'person1', name: 'New Pension', monthlyBenefit: 0, startAge: Math.min(plan.person1.retirementAge, isCouple ? plan.person2.retirementAge : Infinity), cola: 0, survivorBenefit: 0, taxable: true };
                                            addToList('pensions', newPension);
                                            setFocusTargetId(`pensions-name-${id}`);
                                        }} onRemove={() => removeFromList('pensions', item.id)} canRemove={(plan.pensions || []).length > 0} />
                                    </div>
                                </div>
                            ))}
                                    {(plan.pensions || []).length === 0 && (
                                <div className="flex justify-center py-6">
                                            <AddButton label="+ Add Pension" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 8.414V6a1 1 0 10-2 0v5a1 1 0 00.293.707l3 3a1 1 0 101.414-1.414L11 10.414z" /></svg>} onClick={() => {
                                            const id = Date.now().toString();
                                            const newPension: Pension = { id, owner: 'person1', name: 'New Pension', monthlyBenefit: 0, startAge: plan.person1.retirementAge, cola: 0, survivorBenefit: 0, taxable: true };
                                            addToList('pensions', newPension);
                                            setFocusTargetId(`pensions-name-${id}`);
                                        }} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Annuities panel */}
                    {incomeTab === 'annuities' && (
                        <div id="panel-annuities" role="tabpanel" aria-labelledby="tab-annuities" className="relative pt-3 space-y-2">
                            <p className="text-sm text-gray-500">Enter your monthly pre-tax income (gross)</p>
                            {((plan.annuities || []) as Annuity[]).map(item => (
                                <div key={item.id} className="grid gap-x-4 items-end p-2 rounded-md bg-indigo-50/50 grid-cols-8">
                                    <div className="col-span-2">
                                        <TextInput id={`annuities-name-${item.id}`} label="Name" value={item.name || ''} onChange={e => handleDynamicListChange('annuities', item.id, 'name', e.target.value)} />
                                    </div>
                                    <NumberInput id={`annuities-monthlyAmount-${item.id}`} label="Monthly Amount" prefix="$" value={item.monthlyAmount} onChange={e => handleDynamicListChange('annuities', item.id, 'monthlyAmount', e.target.value)}/>
                                    <NumberInput label="Start Age" value={item.startAge} onChange={e => handleDynamicListChange('annuities', item.id, 'startAge', e.target.value)}/>
                                    <NumberInput label="COLA" suffix="%" value={item.cola} onChange={e => handleDynamicListChange('annuities', item.id, 'cola', e.target.value)}/>
                                    <div className="flex flex-col items-center justify-end h-full pb-1">
                                        <label htmlFor={`annuities-taxable-${item.id}`} className="mb-1 text-sm font-medium text-brand-text-secondary">Taxable</label>
                                        <input
                                            type="checkbox"
                                            id={`annuities-taxable-${item.id}`}
                                            checked={item.taxable !== false}
                                            onChange={e => handleDynamicListChange('annuities', item.id, 'taxable', e.target.checked)}
                                            className="h-5 w-5 rounded text-brand-primary focus:ring-brand-primary"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <ActionIcons onAdd={() => {
                                            const id = Date.now().toString();
                                            const newAnnuity: Annuity = { id, owner: 'person1', name: 'New Annuity', monthlyAmount: 0, startAge: plan.person1.retirementAge, cola: 0, taxable: true };
                                            addToList('annuities', newAnnuity);
                                            setFocusTargetId(`annuities-name-${id}`);
                                        }} onRemove={() => removeFromList('annuities', item.id)} canRemove={(plan.annuities || []).length > 0} />
                                    </div>
                                </div>
                            ))}
                                    {(plan.annuities || []).length === 0 && (
                                <div className="flex justify-center py-6">
                                            <AddButton label="+ Add Annuity" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 100 12 6 6 0 000-12zm1 7H9V7h2v2z"/></svg>} onClick={() => {
                                        const id = Date.now().toString();
                                        const newAnnuity: Annuity = { id, owner: 'person1', name: 'New Annuity', monthlyAmount: 0, startAge: plan.person1.retirementAge, cola: 0, taxable: true };
                                        addToList('annuities', newAnnuity);
                                        setFocusTargetId(`annuities-name-${id}`);
                                    }} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Other Incomes panel */}
                    {incomeTab === 'other' && (
                        <div id="panel-otherincomes" role="tabpanel" aria-labelledby="tab-otherincomes" className="relative pt-3 space-y-2">
                            <p className="text-sm text-gray-500">Enter your monthly pre-tax income (gross)</p>
                            {((plan.otherIncomes || []) as OtherIncome[]).map(item => (
                                <div key={item.id} className="grid gap-x-4 items-end p-2 rounded-md bg-lime-50/50 grid-cols-8">
                                    <div className="col-span-2">
                                        <TextInput id={`otherIncomes-name-${item.id}`} label="Name" value={item.name || ''} onChange={e => handleDynamicListChange('otherIncomes', item.id, 'name', e.target.value)} />
                                    </div>
                                    <NumberInput id={`otherIncomes-monthlyAmount-${item.id}`} label="Monthly Amount" prefix="$" value={item.monthlyAmount} onChange={e => handleDynamicListChange('otherIncomes', item.id, 'monthlyAmount', e.target.value)}/>
                                    <NumberInput label="Start Age" value={item.startAge} onChange={e => handleDynamicListChange('otherIncomes', item.id, 'startAge', e.target.value)}/>
                                    <NumberInput label="End Age" value={item.endAge} onChange={e => handleDynamicListChange('otherIncomes', item.id, 'endAge', e.target.value)}/>
                                    <NumberInput label="COLA" suffix="%" value={item.cola} onChange={e => handleDynamicListChange('otherIncomes', item.id, 'cola', e.target.value)}/>
                                    <div className="flex flex-col items-center justify-end h-full pb-1">
                                        <label htmlFor={`taxable-${item.id}`} className="mb-1 text-sm font-medium text-brand-text-secondary">Taxable</label>
                                        <input
                                            type="checkbox"
                                            id={`taxable-${item.id}`}
                                            checked={item.taxable !== false}
                                            onChange={e => handleDynamicListChange('otherIncomes', item.id, 'taxable', e.target.checked)}
                                            className="h-5 w-5 rounded text-brand-primary focus:ring-brand-primary"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <ActionIcons onAdd={() => {
                                            const id = Date.now().toString();
                                            const newOther: OtherIncome = { id, owner: 'person1', name: 'New Income', monthlyAmount: 0, startAge: plan.person1.retirementAge, endAge: plan.person1.lifeExpectancy, cola: 0, taxable: true };
                                            addToList('otherIncomes', newOther);
                                            setFocusTargetId(`otherIncomes-name-${id}`);
                                        }} onRemove={() => removeFromList('otherIncomes', item.id)} canRemove={(plan.otherIncomes || []).length > 0} />
                                    </div>
                                </div>
                            ))}
                            {(plan.otherIncomes || []).length === 0 && (
                                <div className="flex justify-center py-6">
                                            <AddButton label="+ Add Other Income" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM10 6a2 2 0 100 4 2 2 0 000-4zM8 12v2h4v-2H8z" /></svg>} onClick={() => {
                                            const id = Date.now().toString();
                                            const newOther: OtherIncome = { id, owner: 'person1', name: 'New Income', monthlyAmount: 0, startAge: plan.person1.retirementAge, endAge: plan.person1.lifeExpectancy, cola: 0, taxable: true };
                                            addToList('otherIncomes', newOther);
                                            setFocusTargetId(`otherIncomes-name-${id}`);
                                        }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </InputSection>

            {/* Estate Planning - Gifts + Legacy (tabs) */}
            <InputSection
                title="Estate Planning"
                subtitle="Manage gifts and legacy allocations."
                titleColorClass="text-purple-600"
            >
                <div className="col-span-full">
                    <div className="flex items-center space-x-6 mb-3" role="tablist" aria-label="Estate Tabs" onKeyDown={handleEstateKeyDown}>
                        {estateTab === 'gifts' ? (
                            <button
                                type="button"
                                role="tab"
                                id="tab-gifts"
                                aria-selected="true"
                                aria-controls="panel-gifts"
                                onClick={() => setEstateTab('gifts')}
                                className={`text-sm pb-2 ${'border-b-2 border-purple-600 text-purple-700 font-medium'}`}
                            >
                                Gifts
                            </button>
                        ) : (
                            <button
                                type="button"
                                role="tab"
                                id="tab-gifts"
                                aria-controls="panel-gifts"
                                onClick={() => setEstateTab('gifts')}
                                className={`text-sm pb-2 ${'border-b-2 border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                Gifts
                            </button>
                        )}
                        {estateTab === 'legacy' ? (
                            <button
                                type="button"
                                role="tab"
                                id="tab-legacy"
                                aria-selected="true"
                                aria-controls="panel-legacy"
                                onClick={() => setEstateTab('legacy')}
                                className={`text-sm pb-2 ${'border-b-2 border-orange-600 text-orange-700 font-medium'}`}
                            >
                                Legacy
                            </button>
                        ) : (
                            <button
                                type="button"
                                role="tab"
                                id="tab-legacy"
                                aria-controls="panel-legacy"
                                onClick={() => setEstateTab('legacy')}
                                className={`text-sm pb-2 ${'border-b-2 border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                Legacy
                            </button>
                        )}
                    </div>

                    {/* Gifts panel */}
                    {estateTab === 'gifts' && (
                        <div id="panel-gifts" role="tabpanel" aria-labelledby="tab-gifts" className="relative pt-3 space-y-2">
                            {((plan.gifts || []) as Gift[]).map(item => (
                                <div key={item.id} className="grid gap-x-4 items-end p-2 rounded-md bg-purple-50/50 grid-cols-6">
                                    <div className="w-full">
                                        <SelectInput label="Owner" value={item.owner || 'person1'} onChange={e => handleDynamicListChange('gifts', item.id, 'owner', e.target.value)}>
                                            <option value="person1">{plan.person1.name}</option>
                                            {isCouple && <option value="person2">{plan.person2.name}</option>}
                                        </SelectInput>
                                    </div>
                                    <div className="w-48">
                                        <TextInput id={`gift-beneficiary-${item.id}`} label="Beneficiary" value={item.beneficiary} onChange={e => handleDynamicListChange('gifts', item.id, 'beneficiary', e.target.value)} />
                                    </div>
                                    <div className="w-full">
                                        <SelectInput label="Type" value={item.isAnnual ? 'annual' : 'one-time'} onChange={e => handleDynamicListChange('gifts', item.id, 'isAnnual', e.target.value === 'annual')}>
                                            <option value="one-time">One-time</option>
                                            <option value="annual">Annual</option>
                                        </SelectInput>
                                    </div>
                                    {!item.isAnnual && (
                                        <>
                                            <div className="w-full">
                                                <NumberInput label="Amount" prefix="$" value={item.amount || 0} onChange={e => handleDynamicListChange('gifts', item.id, 'amount', e.target.value)} />
                                            </div>
                                            <div className="w-20">
                                                <NumberInput label="Age" value={item.age || plan.person1.currentAge} onChange={e => handleDynamicListChange('gifts', item.id, 'age', e.target.value)} />
                                            </div>
                                        </>
                                    )}
                                    {item.isAnnual && (
                                        <>
                                            <div className="w-full">
                                                <NumberInput label="Amount" prefix="$" value={item.annualAmount || 0} onChange={e => handleDynamicListChange('gifts', item.id, 'annualAmount', e.target.value)} />
                                            </div>
                                            <div className="w-28">
                                                <div className="flex space-x-1">
                                                    <div className="w-1/2">
                                                        <NumberInput label="Start" placeholder="e.g., 67" value={item.startAge || plan.person1.retirementAge} onChange={e => handleDynamicListChange('gifts', item.id, 'startAge', e.target.value)} />
                                                    </div>
                                                    <div className="w-1/2">
                                                        <NumberInput label="End" placeholder="e.g., 90" value={item.endAge || plan.person1.lifeExpectancy} onChange={e => handleDynamicListChange('gifts', item.id, 'endAge', e.target.value)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div className="flex items-end">
                                        <ActionIcons onAdd={() => { const id = Date.now().toString(); const newGift: Gift = { id, beneficiary: '', owner: 'person1', isAnnual: false, amount: 0, annualAmount: 0, age: plan.person1.currentAge, startAge: plan.person1.retirementAge, endAge: plan.person1.lifeExpectancy }; addToList('gifts', newGift); setFocusTargetId(`gift-beneficiary-${id}`); }} onRemove={() => removeFromList('gifts', item.id)} canRemove={(plan.gifts || []).length > 0} />
                                    </div>
                                </div>
                            ))}
                            {(plan.gifts || []).length === 0 && (
                                <div className="flex justify-center py-6">
                                    <AddButton label="+ Add Gift" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M4 7h12v2H4zM10 3l2 4H8l2-4zM4 9v8h12V9H4z" /></svg>} onClick={() => { const id = Date.now().toString(); const newGift: Gift = { id, beneficiary: '', owner: 'person1', isAnnual: false, amount: 0, annualAmount: 0, age: plan.person1.currentAge, startAge: plan.person1.retirementAge, endAge: plan.person1.lifeExpectancy }; addToList('gifts', newGift); setFocusTargetId(`gift-beneficiary-${id}`); }} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Legacy panel */}
                    {estateTab === 'legacy' && (
                        <div id="panel-legacy" role="tabpanel" aria-labelledby="tab-legacy" className="relative pt-3 space-y-2">
                            {(plan.legacyDisbursements || []).map((ld) => (
                                <div key={ld.id} className="grid grid-cols-6 gap-x-4 items-end p-2 rounded-md bg-orange-50/50">
                                    <div className="col-span-2">
                                        <TextInput id={`legacy-beneficiary-${ld.id}`} label="Beneficiary" value={ld.beneficiary} disabled={plan.dieWithZero} onChange={e => handleDynamicListChange('legacyDisbursements', ld.id, 'beneficiary', e.target.value)} />
                                    </div>
                                    <div>
                                        <SelectInput label="Type" value={ld.beneficiaryType} disabled={plan.dieWithZero} onChange={e => handleDynamicListChange('legacyDisbursements', ld.id, 'beneficiaryType', e.target.value)}>
                                            <option value="person">Person</option>
                                            <option value="organization">Organization</option>
                                        </SelectInput>
                                    </div>
                                    <div className="w-28">
                                        <NumberInput label="Percentage" suffix="%" value={ld.percentage} disabled={plan.dieWithZero} onChange={e => handleDynamicListChange('legacyDisbursements', ld.id, 'percentage', e.target.value)} />
                                    </div>
                                    <div className="flex items-end">
                                        <ActionIcons onAdd={() => { const id = Date.now().toString(); const newLd: LegacyDisbursement = { ...ld, id, beneficiary: '', beneficiaryType: 'person', percentage: 0 }; addToList('legacyDisbursements', newLd); setFocusTargetId(`legacy-beneficiary-${id}`); }} onRemove={() => removeFromList('legacyDisbursements', ld.id)} canRemove={(plan.legacyDisbursements || []).length > 0} />
                                    </div>
                                </div>
                            ))}

                            {(plan.legacyDisbursements || []).length === 0 && (
                                <div className="flex justify-center py-6">
                                    <AddButton label="+ Add Legacy" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" /><path d="M9 10a4 4 0 100-8 4 4 0 000 8zM17 8a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} disabled={plan.dieWithZero} onClick={() => { const id = Date.now().toString(); const newLd: LegacyDisbursement = { id, beneficiary: '', beneficiaryType: 'person', percentage: 0 }; addToList('legacyDisbursements', newLd); setFocusTargetId(`legacy-beneficiary-${id}`); }} />
                                </div>
                            )}

                            {/* Validation: ensure percentages do not exceed 100 */}
                            {(() => {
                                const totalPct = (plan.legacyDisbursements || []).reduce((s, x) => s + (x.percentage || 0), 0);
                                if (totalPct > 100) {
                                    return <p className="text-sm text-red-600">Total legacy percentages exceed 100% ({totalPct}%). Please adjust.</p>;
                                }
                                if (totalPct > 0 && totalPct < 100) {
                                    return <p className="text-sm text-gray-600">Total allocated: {totalPct}%. Remaining estate will be {100 - totalPct}%.</p>;
                                }
                                return null;
                            })()}
                            {plan.dieWithZero && <p className="text-sm text-gray-500 italic">Legacy disbursements are disabled while Die With Zero is enabled.</p>}
                        </div>
                    )}
                </div>
            </InputSection>

            <InputSection title="Expenses" subtitle="Model recurring expense phases and one-time expenses." titleColorClass="text-red-600" gridCols={1}>
                <div className="col-span-full">
                    <div className="flex items-center space-x-6 mb-3" role="tablist" aria-label="Expenses Tabs">
                        {expensesTab === 'periods' ? (
                            <button type="button" role="tab" id="tab-expense-periods" aria-selected="true" aria-controls="panel-expense-periods" onClick={() => setExpensesTab('periods')} className={`text-sm pb-2 ${'border-b-2 border-red-600 text-red-700 font-medium'} group`}>
                                <span className="inline-flex items-center space-x-2">
                                    <span>Expense Periods</span>
                                    <span className="relative inline-flex">
                                        <span className="text-gray-400 hover:text-gray-600 focus:outline-none" aria-hidden="true" tabIndex={-1}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-3a1 1 0 100 2 1 1 0 000-2zm1 4a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clipRule="evenodd"/></svg>
                                        </span>
                                        <div id="expense-periods-tooltip" role="tooltip" className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 bg-gray-100 text-gray-900 text-[0.95rem] p-2.5 rounded shadow border border-gray-200 hidden group-hover:block z-10">
                                            <div className="font-medium">Expense Periods</div>
                                            <div className="mt-1 text-sm">Model different recurring monthly spending phases in retirement. Use start/end ages to define each phase. Periods should not overlap — ensure the start age of a later phase is after the end age of an earlier phase.</div>
                                        </div>
                                    </span>
                                </span>
                            </button>
                        ) : (
                            <button type="button" role="tab" id="tab-expense-periods" aria-controls="panel-expense-periods" onClick={() => setExpensesTab('periods')} className={`text-sm pb-2 ${'border-b-2 border-transparent text-gray-600 hover:text-gray-800'} group`}>
                                <span className="inline-flex items-center space-x-2">
                                    <span>Expense Periods</span>
                                    <span className="relative inline-flex">
                                        <span className="text-gray-400 hover:text-gray-600 focus:outline-none" aria-hidden="true" tabIndex={-1}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-3a1 1 0 100 2 1 1 0 000-2zm1 4a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clipRule="evenodd"/></svg>
                                        </span>
                                        <div id="expense-periods-tooltip" role="tooltip" className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 bg-gray-100 text-gray-900 text-[0.95rem] p-2.5 rounded shadow border border-gray-200 hidden group-hover:block z-10">
                                            <div className="font-medium">Expense Periods</div>
                                            <div className="mt-1 text-sm">Model different recurring monthly spending phases in retirement. Use start/end ages to define each phase. Periods should not overlap — ensure the start age of a later phase is after the end age of an earlier phase.</div>
                                        </div>
                                    </span>
                                </span>
                            </button>
                        )}
                        {expensesTab === 'oneTime' ? (
                            <button type="button" role="tab" id="tab-one-time-expenses" aria-selected="true" aria-controls="panel-one-time-expenses" onClick={() => setExpensesTab('oneTime')} className={`text-sm pb-2 ${'border-b-2 border-red-600 text-red-700 font-medium'} group`}>
                                <span className="inline-flex items-center space-x-2">
                                    <span>One-Time Expenses</span>
                                    <span className="relative inline-flex">
                                        <span className="text-gray-400 hover:text-gray-600 focus:outline-none" aria-hidden="true" tabIndex={-1}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-3a1 1 0 100 2 1 1 0 000-2zm1 4a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clipRule="evenodd"/></svg>
                                        </span>
                                        <div id="one-time-expenses-tooltip" role="tooltip" className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 bg-gray-100 text-gray-900 text-[0.95rem] p-2.5 rounded shadow border border-gray-200 hidden group-hover:block z-10">
                                            <div className="font-medium">One-Time Expenses</div>
                                            <div className="mt-1 text-sm">One-time expenses are single, non-recurring costs that occur at a specific age. Enter the amount, the age when it happens, and an optional description. The expense is applied once to the projection at the selected owner's age.</div>
                                        </div>
                                    </span>
                                </span>
                            </button>
                        ) : (
                            <button type="button" role="tab" id="tab-one-time-expenses" aria-controls="panel-one-time-expenses" onClick={() => setExpensesTab('oneTime')} className={`text-sm pb-2 ${'border-b-2 border-transparent text-gray-600 hover:text-gray-800'} group`}>
                                <span className="inline-flex items-center space-x-2">
                                    <span>One-Time Expenses</span>
                                    <span className="relative inline-flex">
                                        <span className="text-gray-400 hover:text-gray-600 focus:outline-none" aria-hidden="true" tabIndex={-1}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-8-3a1 1 0 100 2 1 1 0 000-2zm1 4a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clipRule="evenodd"/></svg>
                                        </span>
                                        <div id="one-time-expenses-tooltip" role="tooltip" className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 bg-gray-100 text-gray-900 text-[0.95rem] p-2.5 rounded shadow border border-gray-200 hidden group-hover:block z-10">
                                            <div className="font-medium">One-Time Expenses</div>
                                            <div className="mt-1 text-sm">One-time expenses are single, non-recurring costs that occur at a specific age. Enter the amount, the age when it happens, and an optional description. The expense is applied once to the projection at the selected owner's age.</div>
                                        </div>
                                    </span>
                                </span>
                            </button>
                        )}
                    </div>

                    {/* One-Time Expenses panel */}
                    {expensesTab === 'oneTime' && (
                        <div id="panel-one-time-expenses" role="tabpanel" aria-labelledby="tab-one-time-expenses" className="relative pt-3 space-y-2">
                            {((plan.oneTimeExpenses || []) as OneTimeExpense[]).map(item => (
                                <div key={item.id} className="grid gap-x-4 items-end p-2 rounded-md bg-red-50/50 grid-cols-5">
                                    <div className="col-span-2">
                                        <TextInput id={`oneTimeExpenses-desc-${item.id}`} label="Description" value={item.description || ''} onChange={e => handleDynamicListChange('oneTimeExpenses', item.id, 'description', e.target.value)} />
                                    </div>
                                    <NumberInput label="Amount" prefix="$" value={item.amount} onChange={e => handleDynamicListChange('oneTimeExpenses', item.id, 'amount', e.target.value)} />
                                    <div className="w-28">
                                        <NumberInput label="Age" value={item.age} onChange={e => handleDynamicListChange('oneTimeExpenses', item.id, 'age', e.target.value)} />
                                    </div>
                                    <div className="flex items-end">
                                        <ActionIcons onAdd={() => { const id = Date.now().toString(); const newOne: OneTimeExpense = { id, owner: 'person1', amount: 0, age: plan.person1.currentAge, description: '' }; addToList('oneTimeExpenses', newOne as any); setFocusTargetId(`oneTimeExpenses-desc-${id}`); }} onRemove={() => removeFromList('oneTimeExpenses', item.id)} canRemove={(plan.oneTimeExpenses || []).length > 0} />
                                    </div>
                                </div>
                            ))}
                            {(plan.oneTimeExpenses || []).length === 0 && (
                                <div className="flex justify-center py-6">
                                    <AddButton label="+ Add One-Time Expense" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2L2 7h2v9h12V7h2L10 2z"/></svg>} onClick={() => { const id = Date.now().toString(); const newOne: OneTimeExpense = { id, owner: 'person1', amount: 0, age: plan.person1.currentAge, description: '' }; addToList('oneTimeExpenses', newOne as any); setFocusTargetId(`oneTimeExpenses-desc-${id}`); }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </InputSection>
        </>
    );
};
