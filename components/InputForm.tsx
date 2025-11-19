import React from 'react';
import { RetirementPlan, Person, PlanType, RetirementAccount, InvestmentAccount, Pension, OtherIncome, ExpensePeriod } from '../types';
import { InputSection } from './InputSection';
import { NumberInput, SelectInput, TextInput } from './FormControls';
import { STATES } from '../constants';

type DynamicListKey = 'retirementAccounts' | 'investmentAccounts' | 'pensions' | 'otherIncomes' | 'expensePeriods' | 'gifts';

interface InputFormProps {
    plan: RetirementPlan;
    handlePlanChange: <T extends keyof RetirementPlan>(field: T, value: RetirementPlan[T]) => void;
    handlePersonChange: (person: 'person1' | 'person2', field: keyof Person, value: string) => void;
    handleDynamicListChange: <K extends DynamicListKey>(
        listName: K,
        id: string,
        field: keyof RetirementPlan[K][number],
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
    
    return (
        <>
            <InputSection 
                title="Plan Information"
                subtitle="Set the high-level assumptions for your retirement plan."
            >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 col-span-full">
                    <div className="flex flex-col space-y-2 h-full">
                        {(Object.values(PlanType) as PlanType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => handlePlanChange('planType', type)}
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
            </InputSection>
            
            <div className="bg-brand-surface p-3 rounded-lg shadow-sm flex items-center space-x-4">
                <div className="flex items-center space-x-2 flex-shrink-0">
                    <input
                        type="checkbox"
                        id="dieWithZeroCheck"
                        checked={plan.dieWithZero}
                        onChange={e => handlePlanChange('dieWithZero', e.target.checked)}
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
                        <TextInput label="Name" value={plan.person1.name} onChange={e => handlePersonChange('person1', 'name', e.target.value)} />
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
                            <TextInput label="Name" value={plan.person2.name} onChange={e => handlePersonChange('person2', 'name', e.target.value)} />
                            <NumberInput label="Current Age" value={plan.person2.currentAge} onChange={e => handlePersonChange('person2', 'currentAge', e.target.value)} />
                            <NumberInput label="Retirement Age" value={plan.person2.retirementAge} onChange={e => handlePersonChange('person2', 'retirementAge', e.target.value)} />
                            <NumberInput label="Life Expectancy" value={plan.person2.lifeExpectancy} onChange={e => handlePersonChange('person2', 'lifeExpectancy', e.target.value)} />
                        </div>
                    </div>
                )}
            </div>

            <InputSection title="Social Security" subtitle="Estimate benefits based on current salary and your planned claiming age.">
                    <div className={`col-span-full grid grid-cols-1 ${isCouple ? 'md:grid-cols-2' : ''} gap-6`}>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-800 mb-3">{plan.person1.name}</h3>
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
                                <h3 className="font-semibold text-rose-800 mb-3">{plan.person2.name}</h3>
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


            {['Retirement Accounts', 'Investment Accounts', 'Pensions', 'Other Incomes', 'Expense Periods', 'Gifts'].map(section => {
                const listName = section.replace(' ', '').charAt(0).toLowerCase() + section.replace(' ', '').slice(1) as DynamicListKey;
                const items = (plan[listName] as any[]) || [];
                const subtitles: { [key: string]: string } = {
                    'Retirement Accounts': 'Add 401(k)s, IRAs, and other tax-advantaged accounts.',
                    'Investment Accounts': 'Add taxable brokerage and other investment accounts.',
                    'Pensions': 'Add any defined-benefit pension plans.',
                    'Other Incomes': 'Add any other sources of income, like rental properties or part-time work.',
                    'Expense Periods': 'Model different spending levels for different phases of retirement.',
                    'Gifts': 'Add one-time or annual gifts to beneficiaries; affects cashflow and legacy.'
                };
                    const colors: { [key: string]: string } = {
                    'Retirement Accounts': 'text-cyan-600',
                    'Investment Accounts': 'text-teal-600',
                    'Pensions': 'text-sky-600',
                    'Other Incomes': 'text-lime-600',
                    'Expense Periods': 'text-red-600',
                    'Gifts': 'text-purple-600'
                };
                
                const addPension = () => addToList('pensions', { id: Date.now().toString(), owner: 'person1', name: 'New Pension', monthlyBenefit: 0, startAge: Math.min(plan.person1.retirementAge, isCouple ? plan.person2.retirementAge : Infinity), cola: 0, survivorBenefit: 0, taxable: true });
                const addOtherIncome = () => addToList('otherIncomes', { id: Date.now().toString(), owner: 'person1', name: 'New Income', monthlyAmount: 0, startAge: plan.person1.retirementAge, endAge: plan.person1.lifeExpectancy, cola: 0, taxable: true });
                const addGift = () => addToList('gifts', { id: Date.now().toString(), beneficiary: '', owner: 'person1', isAnnual: false, amount: 0, annualAmount: 0, age: plan.person1.currentAge, startAge: plan.person1.retirementAge, endAge: plan.person1.lifeExpectancy });

                return (
                    <InputSection key={section} title={section} subtitle={subtitles[section]} titleColorClass={colors[section]} gridCols={1}>
                        <div className="col-span-full space-y-2">
                            {items.map((item) => (
                                <div key={item.id} className={`grid gap-x-4 items-end p-2 rounded-md ${
                                    {'Retirement Accounts': 'bg-cyan-50/50 grid-cols-7', 'Investment Accounts': 'bg-teal-50/50 grid-cols-5', 'Pensions': 'bg-sky-50/50 grid-cols-8', 'Other Incomes': 'bg-lime-50/50 grid-cols-8', 'Expense Periods': 'bg-red-50/50 grid-cols-5', 'Gifts': 'bg-purple-50/50 grid-cols-6'}[section]
                                }`}> 
                                    {/* Common fields */}
                                    {listName !== 'expensePeriods' && listName !== 'gifts' && (
                                        <>
                                            <SelectInput label="Owner" value={item.owner} onChange={e => handleDynamicListChange(listName, item.id, 'owner', e.target.value)} data-list={listName} data-id={item.id}>
                                                <option value="person1">{plan.person1.name}</option>
                                                {isCouple && <option value="person2">{plan.person2.name}</option>}
                                            </SelectInput>
                                            <TextInput label="Name" value={item.name} onChange={e => handleDynamicListChange(listName, item.id, 'name', e.target.value)} />
                                        </>
                                    )}
                                    
                                    {/* Specific fields */}
                                    {listName === 'retirementAccounts' && <>
                                        <SelectInput label="Type" value={item.type} onChange={e => handleDynamicListChange(listName, item.id, 'type', e.target.value)}>
                                            <option>401k</option>
                                            <option>457b</option>
                                            <option>IRA</option>
                                            <option>Roth IRA</option>
                                            <option>Other</option>
                                        </SelectInput>
                                        <NumberInput label="Balance" prefix="$" value={item.balance} onChange={e => handleDynamicListChange(listName, item.id, 'balance', e.target.value)}/>
                                        <NumberInput label="Annual Contrib." prefix="$" value={item.annualContribution} onChange={e => handleDynamicListChange(listName, item.id, 'annualContribution', e.target.value)}/>
                                        <NumberInput label="Match" suffix="%" value={item.match} onChange={e => handleDynamicListChange(listName, item.id, 'match', e.target.value)}/>
                                        <div className="flex items-end">
                                            <ActionIcons onAdd={() => addToList('retirementAccounts', { ...item, id: Date.now().toString(), balance: 0, annualContribution: 0, match: 0 })} onRemove={() => removeFromList('retirementAccounts', item.id)} canRemove={items.length > 1} />
                                        </div>
                                    </>}
                                    {listName === 'investmentAccounts' && <>
                                        <NumberInput label="Balance" prefix="$" value={item.balance} onChange={e => handleDynamicListChange(listName, item.id, 'balance', e.target.value)}/>
                                        <NumberInput label="Annual Contrib." prefix="$" value={item.annualContribution} onChange={e => handleDynamicListChange(listName, item.id, 'annualContribution', e.target.value)}/>
                                        <div className="flex items-end">
                                            <ActionIcons onAdd={() => addToList('investmentAccounts', { ...item, id: Date.now().toString(), balance: 0, annualContribution: 0 })} onRemove={() => removeFromList('investmentAccounts', item.id)} canRemove={items.length > 1} />
                                        </div>
                                    </>}
                                    {listName === 'pensions' && <>
                                        <NumberInput label="Monthly Benefit" prefix="$" value={item.monthlyBenefit} onChange={e => handleDynamicListChange(listName, item.id, 'monthlyBenefit', e.target.value)}/>
                                        <NumberInput label="Start Age" value={item.startAge} onChange={e => handleDynamicListChange(listName, item.id, 'startAge', e.target.value)}/>
                                        <NumberInput label="COLA" suffix="%" value={item.cola} onChange={e => handleDynamicListChange(listName, item.id, 'cola', e.target.value)}/>
                                        <NumberInput label="Survivor" suffix="%" value={item.survivorBenefit} onChange={e => handleDynamicListChange(listName, item.id, 'survivorBenefit', e.target.value)}/>
                                        <div className="flex flex-col items-center justify-end h-full pb-1">
                                            <label htmlFor={`taxable-${item.id}`} className="mb-1 text-sm font-medium text-brand-text-secondary">Taxable</label>
                                            <input
                                                type="checkbox"
                                                id={`taxable-${item.id}`}
                                                checked={item.taxable !== false}
                                                onChange={e => handleDynamicListChange(listName, item.id, 'taxable', e.target.checked)}
                                                className="h-5 w-5 rounded text-brand-primary focus:ring-brand-primary"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <ActionIcons onAdd={addPension} onRemove={() => removeFromList('pensions', item.id)} canRemove={items.length > 0} />
                                        </div>
                                    </>}
                                        {listName === 'otherIncomes' && <>
                                        <NumberInput label="Monthly Amount" prefix="$" value={item.monthlyAmount} onChange={e => handleDynamicListChange(listName, item.id, 'monthlyAmount', e.target.value)}/>
                                        <NumberInput label="Start Age" value={item.startAge} onChange={e => handleDynamicListChange(listName, item.id, 'startAge', e.target.value)}/>
                                        <NumberInput label="End Age" value={item.endAge} onChange={e => handleDynamicListChange(listName, item.id, 'endAge', e.target.value)}/>
                                        <NumberInput label="COLA" suffix="%" value={item.cola} onChange={e => handleDynamicListChange(listName, item.id, 'cola', e.target.value)}/>
                                            <div className="flex flex-col items-center justify-end h-full pb-1">
                                            <label htmlFor={`taxable-${item.id}`} className="mb-1 text-sm font-medium text-brand-text-secondary">Taxable</label>
                                            <input
                                                type="checkbox"
                                                id={`taxable-${item.id}`}
                                                checked={item.taxable !== false}
                                                onChange={e => handleDynamicListChange(listName, item.id, 'taxable', e.target.checked)}
                                                className="h-5 w-5 rounded text-brand-primary focus:ring-brand-primary"
                                            />
                                        </div>
                                            <div className="flex items-end">
                                            <ActionIcons onAdd={addOtherIncome} onRemove={() => removeFromList('otherIncomes', item.id)} canRemove={items.length > 0} />
                                        </div>
                                    </>}
                                        {listName === 'gifts' && <>
                                            <div className="w-full">
                                            <SelectInput label="Owner" value={item.owner || 'person1'} onChange={e => handleDynamicListChange(listName, item.id, 'owner', e.target.value)}>
                                                <option value="person1">{plan.person1.name}</option>
                                                {isCouple && <option value="person2">{plan.person2.name}</option>}
                                            </SelectInput>
                                        </div>
                                        <div className="w-48">
                                            <TextInput label="Beneficiary" value={item.beneficiary} onChange={e => handleDynamicListChange(listName, item.id, 'beneficiary', e.target.value)} />
                                        </div>
                                            <div className="w-full">
                                                <SelectInput label="Type" value={item.isAnnual ? 'annual' : 'one-time'} onChange={e => handleDynamicListChange(listName, item.id, 'isAnnual', e.target.value === 'annual')}>
                                                    <option value="one-time">One-time</option>
                                                    <option value="annual">Annual</option>
                                                </SelectInput>
                                            </div>
                                            {!item.isAnnual && (
                                                <>
                                                    <div className="w-full">
                                                        <NumberInput label="Amount" prefix="$" value={item.amount || 0} onChange={e => handleDynamicListChange(listName, item.id, 'amount', e.target.value)} />
                                                    </div>
                                                    <div className="w-20">
                                                        <NumberInput label="Age" value={item.age || plan.person1.currentAge} onChange={e => handleDynamicListChange(listName, item.id, 'age', e.target.value)} />
                                                    </div>
                                                </>
                                            )}
                                            {item.isAnnual && (
                                            <>
                                                <div className="w-full">
                                                    <NumberInput label="Amount" prefix="$" value={item.annualAmount || 0} onChange={e => handleDynamicListChange(listName, item.id, 'annualAmount', e.target.value)} />
                                                </div>
                                                <div className="w-28">
                                                    <div className="flex space-x-1">
                                                        <div className="w-1/2">
                                                            <NumberInput label="Start" placeholder="e.g., 67" value={item.startAge || plan.person1.retirementAge} onChange={e => handleDynamicListChange(listName, item.id, 'startAge', e.target.value)} />
                                                        </div>
                                                        <div className="w-1/2">
                                                            <NumberInput label="End" placeholder="e.g., 90" value={item.endAge || plan.person1.lifeExpectancy} onChange={e => handleDynamicListChange(listName, item.id, 'endAge', e.target.value)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex items-end">
                                            <ActionIcons onAdd={addGift} onRemove={() => removeFromList('gifts', item.id)} canRemove={items.length > 0} />
                                        </div>
                                        </>}
                                    {listName === 'expensePeriods' && <>
                                            <TextInput label="Name" value={item.name} onChange={e => handleDynamicListChange(listName, item.id, 'name', e.target.value)} data-list={listName} data-id={item.id} />
                                            <NumberInput label="Total Monthly Expenses" prefix="$" value={item.monthlyAmount} onChange={e => handleDynamicListChange(listName, item.id, 'monthlyAmount', e.target.value)}/>
                                            <div className="flex items-end space-x-2">
                                            {isCouple && <SelectInput label=" " value={item.startAgeRef} onChange={e => handleDynamicListChange(listName, item.id, 'startAgeRef', e.target.value)}><option value="person1">{plan.person1.name}</option><option value="person2">{plan.person2.name}</option></SelectInput>}
                                            <NumberInput label="Start Age" value={item.startAge} onChange={e => handleDynamicListChange(listName, item.id, 'startAge', e.target.value)} />
                                        </div>
                                            <div className="flex items-end space-x-2">
                                            {isCouple && <SelectInput label=" " value={item.endAgeRef} onChange={e => handleDynamicListChange(listName, item.id, 'endAgeRef', e.target.value)}><option value="person1">{plan.person1.name}</option><option value="person2">{plan.person2.name}</option></SelectInput>}
                                            <NumberInput label="End Age" value={item.endAge} onChange={e => handleDynamicListChange(listName, item.id, 'endAge', e.target.value)}/>
                                        </div>
                                        <div className="flex items-end">
                                            <ActionIcons onAdd={() => addToList('expensePeriods', { ...item, id: Date.now().toString(), monthlyAmount: 0, name: `Phase ${items.length + 1}`, startAge: items.length > 0 ? items[items.length - 1].endAge + 1 : plan.person1.retirementAge, startAgeRef: items[items.length - 1]?.startAgeRef || 'person1', endAge: plan.person1.lifeExpectancy, endAgeRef: items[items.length - 1]?.endAgeRef || 'person1' })} onRemove={() => removeFromList('expensePeriods', item.id)} canRemove={items.length > 1} />
                                        </div>
                                    </>}
                                </div>
                            ))}
                            {(listName === 'pensions' || listName === 'otherIncomes' || listName === 'gifts') && items.length === 0 && (
                                <div className="text-center py-2">
                                    <button onClick={listName === 'pensions' ? addPension : listName === 'otherIncomes' ? addOtherIncome : addGift} className="text-sm text-brand-primary font-semibold hover:underline">
                                        + Add {section.slice(0, -1)}
                                    </button>
                                </div>
                            )}
                        </div>
                    </InputSection>
                )
            })}
        </>
    );
};
