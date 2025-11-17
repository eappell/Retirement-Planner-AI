import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RetirementPlan, CalculationResult, PlanType, RetirementAccount, InvestmentAccount, Pension, OtherIncome, ExpensePeriod, Person, YearlyProjection, MonteCarloResult, Scenario, ScenariosState } from './types.ts';
import { STATES } from './constants.ts';
import { getRetirementInsights } from './services/geminiService.ts';
import { estimateSocialSecurityBenefit } from './services/socialSecurityService.ts';
import { runSimulation } from './services/simulationService.ts';
import { runMonteCarloSimulation } from './services/monteCarloService.ts';
import { IndicatorCard } from './components/IndicatorCard.tsx';
import { InputSection } from './components/InputSection.tsx';
import { NumberInput, SelectInput, TextInput } from './components/FormControls.tsx';
import { ProjectionTable } from './components/ProjectionTable.tsx';
import { UserManualModal } from './components/UserManualModal.tsx';
import { ScrollToTopButton } from './components/ScrollToTopButton.tsx';
import { PrintableReport } from './components/PrintableReport.tsx';
import { DynamicCharts } from './components/DynamicCharts.tsx';
import { MonteCarloSimulator } from './components/MonteCarloSimulator.tsx';
import { useAuth } from './contexts/AuthContext.tsx';
import { Auth } from './components/Auth.tsx';
import { loadScenarios, saveScenarios } from './services/firestoreService.ts';
import { auth } from './services/firebase.ts';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const initialPlanState: RetirementPlan = {
  planType: PlanType.INDIVIDUAL,
  person1: { name: 'Person 1', currentAge: 40, retirementAge: 67, lifeExpectancy: 90, currentSalary: 80000, claimingAge: 67 },
  person2: { name: 'Person 2', currentAge: 40, retirementAge: 67, lifeExpectancy: 90, currentSalary: 75000, claimingAge: 67 },
  retirementAccounts: [
    { id: '1', owner: 'person1', name: '401k', balance: 500000, annualContribution: 10000, match: 5, type: '401k' }
  ],
  investmentAccounts: [
    { id: '1', owner: 'person1', name: 'Brokerage', balance: 100000, annualContribution: 5000 }
  ],
  pensions: [],
  otherIncomes: [],
  expensePeriods: [
    { id: '1', name: 'Retirement', monthlyAmount: 5000, startAge: 67, startAgeRef: 'person1', endAge: 90, endAgeRef: 'person1' }
  ],
  socialSecurity: { person1EstimatedBenefit: 0, person2EstimatedBenefit: 0 },
  state: 'CA',
  inflationRate: 2.5,
  avgReturn: 7,
  annualWithdrawalRate: 4,
  dieWithZero: false,
  legacyAmount: 0,
};

type DynamicListKey = {
  [K in keyof RetirementPlan]: RetirementPlan[K] extends Array<{ id: string }> ? K : never
}[keyof RetirementPlan];


const App: React.FC = () => {
    const { user, loading: authLoading } = useAuth();

    const getDefaultScenario = (): Scenario => ({
        id: `scenario-${Date.now()}`,
        name: 'Default Plan',
        plan: initialPlanState,
    });
    
    const [scenariosState, setScenariosState] = useState<ScenariosState>(() => {
        const defaultScenario = getDefaultScenario();
        return {
            activeScenarioId: defaultScenario.id,
            scenarios: { [defaultScenario.id]: defaultScenario },
        };
    });
    
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    
    // Debounce timer for saving to Firestore
    const saveTimeout = useRef<number | null>(null);

    // --- Firestore Data Loading ---
    useEffect(() => {
        if (user) {
            loadScenarios(user.uid).then(savedData => {
                if (savedData) {
                    setScenariosState(savedData);
                } else {
                    // First time user, set default state
                    const defaultScenario = getDefaultScenario();
                     setScenariosState({
                        activeScenarioId: defaultScenario.id,
                        scenarios: { [defaultScenario.id]: defaultScenario },
                    });
                }
                setIsDataLoaded(true);
            });
        }
    }, [user]);

    // --- Firestore Data Persistence ---
    useEffect(() => {
        if (user && isDataLoaded) {
            if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
            }
            saveTimeout.current = window.setTimeout(() => {
                 saveScenarios(user.uid, scenariosState);
            }, 1500); // Debounce saving by 1.5 seconds
        }
        
        return () => {
             if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
            }
        }

    }, [scenariosState, user, isDataLoaded]);

    const { activeScenarioId, scenarios } = scenariosState;
    const activeScenario = activeScenarioId ? scenarios[activeScenarioId] : null;

    const plan = activeScenario?.plan;

    const [results, setResults] = useState<CalculationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState<string>('');
    const [projectionData, setProjectionData] = useState<YearlyProjection[]>([]);
    const [lastAddedInfo, setLastAddedInfo] = useState<{list: DynamicListKey, id: string} | null>(null);
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [monteCarloResults, setMonteCarloResults] = useState<MonteCarloResult | null>(null);
    const [isMcLoading, setIsMcLoading] = useState(false);

    // --- Update Browser Title ---
    useEffect(() => {
        if (activeScenario) {
            document.title = `Retirement Planner - ${activeScenario.name}`;
        } else {
            document.title = 'Retirement Income Planner';
        }
    }, [activeScenario]);

    // --- Auto-focus on new item ---
    useEffect(() => {
        if (lastAddedInfo) {
            const element = document.querySelector(`[data-list='${lastAddedInfo.list}'][data-id='${lastAddedInfo.id}']`);
            if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
                element.focus();
            }
            setLastAddedInfo(null); // Reset after focusing
        }
    }, [lastAddedInfo]);
    
    // Helper to update the plan within the active scenario
    const updateActivePlan = (updater: (prevPlan: RetirementPlan) => RetirementPlan) => {
        if (!activeScenarioId) return;
        setScenariosState(prev => {
            const currentPlan = prev.scenarios[activeScenarioId].plan;
            const updatedPlan = updater(currentPlan);
            if (updatedPlan === currentPlan) return prev; // No change
            return {
                ...prev,
                scenarios: {
                    ...prev.scenarios,
                    [activeScenarioId]: {
                        ...prev.scenarios[activeScenarioId],
                        plan: updatedPlan,
                    },
                },
            };
        });
    };

    // --- State Management ---
    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    const handlePlanChange = <T extends keyof RetirementPlan>(field: T, value: RetirementPlan[T]) => {
        updateActivePlan(prev => ({ ...prev, [field]: value }));
    };

    const handlePersonChange = (person: 'person1' | 'person2', field: keyof Person, value: string) => {
        const numericFields: (keyof Person)[] = ['currentAge', 'retirementAge', 'lifeExpectancy', 'currentSalary', 'claimingAge'];
        
        const finalValue = numericFields.includes(field)
            ? (Number(value) >= 0 ? Number(value) : 0)
            : value;

        updateActivePlan(prev => ({
            ...prev,
            [person]: { ...prev[person], [field]: finalValue }
        }));
    };

    const handleDynamicListChange = <K extends DynamicListKey>(
        listName: K,
        id: string,
        field: keyof RetirementPlan[K][number],
        value: string | boolean
    ) => {
        updateActivePlan(prev => {
            const list = prev[listName] as ({ id: string } & object)[];
            const updatedList = list.map(item => {
                if (item.id !== id) return item;
                const originalValue = item[field as keyof typeof item];
                let finalValue: any;
                if (typeof originalValue === 'number' && typeof value === 'string') {
                    finalValue = (Number(value) >= 0 ? Number(value) : 0);
                } else {
                    finalValue = value;
                }
                return { ...item, [field]: finalValue };
            });
            return { ...prev, [listName]: updatedList };
        });
    };

    const addToList = <K extends DynamicListKey>(listName: K, newItem: RetirementPlan[K][number]) => {
        updateActivePlan(prev => ({ ...prev, [listName]: [...prev[listName], newItem] }));
        setLastAddedInfo({ list: listName, id: newItem.id });
    };

    const removeFromList = (listName: DynamicListKey, id: string) => {
        updateActivePlan(prev => ({ ...prev, [listName]: (prev[listName] as { id: string }[]).filter(item => item.id !== id) }));
    };

    // --- Scenario Management Handlers ---
    const handleSelectScenario = (id: string) => {
        setScenariosState(prev => ({ ...prev, activeScenarioId: id }));
        setResults(null);
        setAiInsights('');
        setMonteCarloResults(null);
    };

    const handleNewScenario = () => {
        const newId = `scenario-${Date.now()}`;
        const newScenario: Scenario = {
            id: newId,
            name: `New Scenario ${Object.keys(scenarios).length + 1}`,
            plan: initialPlanState,
        };
        setScenariosState(prev => ({
            activeScenarioId: newId,
            scenarios: { ...prev.scenarios, [newId]: newScenario },
        }));
        setResults(null);
        setAiInsights('');
        setMonteCarloResults(null);
    };

    const handleDeleteScenario = () => {
        if (!activeScenarioId || !activeScenario || Object.keys(scenarios).length <= 1) {
            alert("You cannot delete the last scenario.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete the "${activeScenario.name}" scenario?`)) {
            setScenariosState(prev => {
                const newScenarios = { ...prev.scenarios };
                delete newScenarios[activeScenarioId];
                const newActiveId = Object.keys(newScenarios)[0] || null;
                return { scenarios: newScenarios, activeScenarioId: newActiveId };
            });
            setResults(null);
            setAiInsights('');
            setMonteCarloResults(null);
        }
    };
    
    const handleCopyScenario = () => {
        if (!activeScenarioId || !activeScenario) return;

        const newId = `scenario-${Date.now()}`;
        const newScenario: Scenario = {
            id: newId,
            name: `${activeScenario.name} Copy`,
            plan: JSON.parse(JSON.stringify(activeScenario.plan)),
        };

        setScenariosState(prev => ({
            activeScenarioId: newId,
            scenarios: { ...prev.scenarios, [newId]: newScenario },
        }));

        setResults(null);
        setAiInsights('');
        setMonteCarloResults(null);
    };
    
    const handleUpdateScenarioName = (newName: string) => {
        if (!activeScenarioId) return;
        setScenariosState(prev => ({
            ...prev,
            scenarios: {
                ...prev.scenarios,
                [activeScenarioId]: { ...prev.scenarios[activeScenarioId], name: newName },
            },
        }));
    };
    
    // --- Social Security Calculation ---
    useEffect(() => {
        if (!plan) return;
        const p1Benefit = estimateSocialSecurityBenefit(plan.person1.currentSalary, plan.person1.claimingAge);
        const p2Benefit = estimateSocialSecurityBenefit(plan.person2.currentSalary, plan.person2.claimingAge);
        updateActivePlan(prev => ({
            ...prev,
            socialSecurity: { person1EstimatedBenefit: p1Benefit, person2EstimatedBenefit: p2Benefit }
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plan?.person1.currentSalary, plan?.person1.claimingAge, plan?.person2.currentSalary, plan?.person2.claimingAge]);

    // --- Expense Age Sync ---
    useEffect(() => {
        if (!plan) return;
        updateActivePlan(prev => {
            if (prev.expensePeriods.length === 0) return prev;
            const isCouple = prev.planType === PlanType.COUPLE;
            let earliestRetirementAge: number;
            let earliestRetirementRef: 'person1' | 'person2' = 'person1';

            if (isCouple) {
                if (prev.person1.retirementAge <= prev.person2.retirementAge) {
                    earliestRetirementAge = prev.person1.retirementAge;
                    earliestRetirementRef = 'person1';
                } else {
                    earliestRetirementAge = prev.person2.retirementAge;
                    earliestRetirementRef = 'person2';
                }
            } else {
                earliestRetirementAge = prev.person1.retirementAge;
            }

            const updatedExpensePeriods = [...prev.expensePeriods];
            const firstExpense = { ...updatedExpensePeriods[0] };

            if (firstExpense.startAge !== earliestRetirementAge || (isCouple && firstExpense.startAgeRef !== earliestRetirementRef)) {
                firstExpense.startAge = earliestRetirementAge;
                if(isCouple) firstExpense.startAgeRef = earliestRetirementRef;
                updatedExpensePeriods[0] = firstExpense;
                return { ...prev, expensePeriods: updatedExpensePeriods };
            }
            return prev;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plan?.person1.retirementAge, plan?.person2.retirementAge, plan?.planType]);

    // --- Main Calculation Trigger ---
    const calculatePlan = useCallback(() => {
        if (!plan) return;
        setIsLoading(true);
        setResults(null);
        setProjectionData([]);
        
        const simulationResults = runSimulation(plan);
        
        setResults(simulationResults);
        setProjectionData(simulationResults.yearlyProjections);
        setIsLoading(false);
    }, [plan]);

    const handleGetInsights = useCallback(async () => {
        if (!results || !plan) return;
        setIsAiLoading(true);
        setAiInsights('');
        const insights = await getRetirementInsights(plan, results);
        setAiInsights(insights);
        setIsAiLoading(false);
    }, [plan, results]);

     const handleRunSimulation = useCallback((numSimulations: number, volatility: number) => {
        if (!plan) return;
        setIsMcLoading(true);
        setMonteCarloResults(null);
        setTimeout(() => {
            const mcResults = runMonteCarloSimulation(plan, numSimulations, volatility);
            setMonteCarloResults(mcResults);
            setIsMcLoading(false);
        }, 50);
    }, [plan]);

    const handlePrint = () => window.print();
    
    const handleResetPlan = () => {
        if (window.confirm('Are you sure you want to reset all your data? This will delete ALL saved scenarios and cannot be undone.')) {
            const defaultScenario = getDefaultScenario();
            setScenariosState({
                activeScenarioId: defaultScenario.id,
                scenarios: { [defaultScenario.id]: defaultScenario },
            });
            setResults(null);
            setAiInsights('');
            setMonteCarloResults(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    const handleLogout = () => {
        signOut(auth).catch(error => console.error("Logout Error:", error));
    };

    // --- Real-time Calculation ---
    useEffect(() => {
        if (!plan) return;
        const handler = setTimeout(() => {
            calculatePlan();
        }, 1000); // Debounce requests
        return () => clearTimeout(handler);
    }, [plan, calculatePlan]);

    if (authLoading) {
        return <div className="flex justify-center items-center h-screen"><div className="text-xl">Loading...</div></div>;
    }

    if (!user) {
        return <Auth />;
    }
    
    if (!plan || !activeScenario || !isDataLoaded) {
        return <div className="flex justify-center items-center h-screen"><div className="text-xl">Loading Your Scenarios...</div></div>;
    }

    // --- UI Components ---
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

    const isCouple = plan.planType === PlanType.COUPLE;
    
    const filteredProjections = projectionData.filter(p => {
        if (isCouple) {
            return p.age1 >= plan.person1.retirementAge || (p.age2 !== undefined && p.age2 >= plan.person2.retirementAge);
        }
        return p.age1 >= plan.person1.retirementAge;
    });

    return (
        <div className="min-h-screen bg-brand-background text-brand-text-primary">
            <PrintableReport plan={plan} results={results} scenarioName={activeScenario.name} />
            <div className="print:hidden">
                <header className="bg-brand-surface shadow-md h-14 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
                    <div className="flex items-baseline space-x-3 overflow-hidden">
                        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary flex-shrink-0">
                            Retirement Income Planner
                        </h1>
                        <span 
                            className="text-sm font-medium text-brand-text-secondary whitespace-nowrap overflow-hidden text-ellipsis"
                            title={activeScenario.name}
                        >
                            ({activeScenario.name})
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button type="button" onClick={() => setIsManualOpen(true)} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            <span>User Manual</span>
                        </button>
                        <button type="button" onClick={handlePrint} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            <span>Print Report</span>
                        </button>
                         <button 
                            type="button" 
                            onClick={handleResetPlan} 
                            className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800 transition-colors font-medium p-2 rounded-md hover:bg-red-100"
                            title="Reset all data and scenarios"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            <span>Reset Plan</span>
                        </button>
                         <button 
                            type="button" 
                            onClick={handleLogout} 
                            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-brand-primary transition-colors font-medium p-2 rounded-md hover:bg-gray-100"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sticky top-[56px] z-10 bg-brand-background py-4 shadow-sm -mx-8 px-8">
                        <IndicatorCard 
                            title="Avg. Monthly Net Income" 
                            value={results ? formatCurrency(results.avgMonthlyNetIncomeFuture) : '---'}
                            subValue={results ? `(in today's $)` : ''}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm-5-5a2 2 0 114 0 2 2 0 01-4 0z" /></svg>}
                            colorClass="bg-green-500"
                        />
                         <IndicatorCard 
                            title="Final Net Worth" 
                            value={results ? formatCurrency(results.netWorthAtEndFuture) : '---'}
                            subValue={results ? `(${formatCurrency(results.netWorthAtEnd)} today's $)` : ''}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                            colorClass="bg-indigo-500"
                        />
                         <IndicatorCard 
                            title="Federal Tax Rate" 
                            value={results ? `${results.federalTaxRate.toFixed(1)}%` : '---'}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.002 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.002 0M18 7l3 9m-3-9l-6-2" /></svg>}
                            colorClass="bg-red-500"
                        />
                         <IndicatorCard 
                            title="State Tax Rate" 
                            value={results ? `${results.stateTaxRate.toFixed(1)}%` : '---'}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                            colorClass="bg-yellow-500"
                        />
                    </div>
                    
                    <div className="mt-4 space-y-6">
                        <InputSection title="Scenario Manager" subtitle="Your scenarios are saved to your account and accessible from any browser.">
                            <div className="col-span-full grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <SelectInput label="Current Scenario" value={activeScenarioId || ''} onChange={e => handleSelectScenario(e.target.value)}>
                                        {Object.values(scenarios).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </SelectInput>
                                </div>
                                <TextInput label="Scenario Name" value={activeScenario.name} onChange={e => handleUpdateScenarioName(e.target.value)} />
                                <div className="flex items-end space-x-2">
                                    <button onClick={handleNewScenario} className="w-full px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">New</button>
                                    <button onClick={handleCopyScenario} className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Copy</button>
                                    <button onClick={handleDeleteScenario} disabled={Object.keys(scenarios).length <= 1} className="w-full px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors">Delete</button>
                                </div>
                            </div>
                        </InputSection>

                        <InputSection 
                            title="Plan Information"
                            subtitle="Set the high-level assumptions for your retirement plan."
                            actions={
                            <div className="flex space-x-2">
                                {(Object.values(PlanType) as PlanType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handlePlanChange('planType', type)}
                                        className={`px-3 py-1 text-sm rounded-md ${plan.planType === type ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        }>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 col-span-full">
                                <SelectInput label="State" value={plan.state} onChange={e => handlePlanChange('state', e.target.value)}>
                                        {Object.entries(STATES).map(([abbr, name]) => <option key={abbr} value={abbr}>{name}</option>)}
                                </SelectInput>
                                <NumberInput label="Inflation" suffix="%" value={plan.inflationRate} onChange={e => handlePlanChange('inflationRate', Number(e.target.value))}/>
                                <NumberInput label="Avg. Return" suffix="%" value={plan.avgReturn} onChange={e => handlePlanChange('avgReturn', Number(e.target.value))}/>
                                <NumberInput label="Withdrawal Rate" suffix="%" value={plan.annualWithdrawalRate} onChange={e => handlePlanChange('annualWithdrawalRate', Number(e.target.value))} disabled={plan.dieWithZero}/>
                                <div className="flex items-center space-x-2 pt-4">
                                        <input type="checkbox" id="dieWithZero" checked={plan.dieWithZero} onChange={e => handlePlanChange('dieWithZero', e.target.checked)} className="h-4 w-4 rounded text-brand-primary focus:ring-brand-primary"/>
                                        <label htmlFor="dieWithZero" className="text-sm font-medium text-brand-text-secondary">Enable Die with Zero</label>
                                    </div>
                                <NumberInput label="Leave Behind" prefix="$" value={plan.legacyAmount} onChange={e => handlePlanChange('legacyAmount', Number(e.target.value))} disabled={!plan.dieWithZero}/>
                            </div>
                        </InputSection>
                        
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


                        {['Retirement Accounts', 'Investment Accounts', 'Pensions', 'Other Incomes', 'Expense Periods'].map(section => {
                            const listName = section.replace(' ', '').charAt(0).toLowerCase() + section.replace(' ', '').slice(1) as DynamicListKey;
                            const items = plan[listName] as any[];
                            const subtitles: { [key: string]: string } = {
                                'Retirement Accounts': 'Add 401(k)s, IRAs, and other tax-advantaged accounts.',
                                'Investment Accounts': 'Add taxable brokerage and other investment accounts.',
                                'Pensions': 'Add any defined-benefit pension plans.',
                                'Other Incomes': 'Add any other sources of income, like rental properties or part-time work.',
                                'Expense Periods': 'Model different spending levels for different phases of retirement.'
                            };
                             const colors: { [key: string]: string } = {
                                'Retirement Accounts': 'text-cyan-600',
                                'Investment Accounts': 'text-teal-600',
                                'Pensions': 'text-sky-600',
                                'Other Incomes': 'text-lime-600',
                                'Expense Periods': 'text-red-600'
                            };
                            
                            const addPension = () => addToList('pensions', { id: Date.now().toString(), owner: 'person1', name: 'New Pension', monthlyBenefit: 0, startAge: Math.min(plan.person1.retirementAge, isCouple ? plan.person2.retirementAge : Infinity), cola: 0, survivorBenefit: 0, taxable: true });
                            const addOtherIncome = () => addToList('otherIncomes', { id: Date.now().toString(), owner: 'person1', name: 'New Income', monthlyAmount: 0, startAge: plan.person1.retirementAge, endAge: plan.person1.lifeExpectancy, cola: 0, taxable: true });

                            return (
                                <InputSection key={section} title={section} subtitle={subtitles[section]} titleColorClass={colors[section]} gridCols={1}>
                                    <div className="col-span-full space-y-2">
                                        {items.map((item, index) => (
                                            <div key={item.id} className={`grid gap-x-4 items-end p-2 rounded-md ${
                                                {'Retirement Accounts': 'bg-cyan-50/50 grid-cols-7', 'Investment Accounts': 'bg-teal-50/50 grid-cols-5', 'Pensions': 'bg-sky-50/50 grid-cols-8', 'Other Incomes': 'bg-lime-50/50 grid-cols-8', 'Expense Periods': 'bg-red-50/50 grid-cols-6'}[section]
                                            }`}>
                                                {/* Common fields */}
                                                {listName !== 'expensePeriods' && (
                                                     <SelectInput label="Owner" value={item.owner} onChange={e => handleDynamicListChange(listName, item.id, 'owner', e.target.value)} data-list={listName} data-id={item.id}>
                                                        <option value="person1">{plan.person1.name}</option>
                                                        {isCouple && <option value="person2">{plan.person2.name}</option>}
                                                    </SelectInput>
                                                )}
                                                <TextInput label="Name" value={item.name} onChange={e => handleDynamicListChange(listName, item.id, 'name', e.target.value)} data-list={listName} data-id={listName === 'expensePeriods' ? item.id : undefined} />
                                                
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
                                                {listName === 'expensePeriods' && <>
                                                     <NumberInput label="Monthly Amount" prefix="$" value={item.monthlyAmount} onChange={e => handleDynamicListChange(listName, item.id, 'monthlyAmount', e.target.value)}/>
                                                     <div className="flex items-end space-x-2">
                                                        {isCouple && <SelectInput label=" " value={item.startAgeRef} onChange={e => handleDynamicListChange(listName, item.id, 'startAgeRef', e.target.value)}><option value="person1">{plan.person1.name}</option><option value="person2">{plan.person2.name}</option></SelectInput>}
                                                        <NumberInput label="Start Age" value={item.startAge} onChange={e => handleDynamicListChange(listName, item.id, 'startAge', e.target.value)} />
                                                    </div>
                                                     <div className="flex items-end space-x-2">
                                                        {isCouple && <SelectInput label=" " value={item.endAgeRef} onChange={e => handleDynamicListChange(listName, item.id, 'endAgeRef', e.target.value)}><option value="person1">{plan.person1.name}</option><option value="person2">{plan.person2.name}</option></SelectInput>}
                                                        <NumberInput label="End Age" value={item.endAge} onChange={e => handleDynamicListChange(listName, item.id, 'endAge', e.target.value)}/>
                                                    </div>
                                                    <div className="flex items-end col-start-6">
                                                        <ActionIcons onAdd={() => addToList('expensePeriods', { ...item, id: Date.now().toString(), monthlyAmount: 0, name: `Phase ${items.length + 1}`, startAge: items.length > 0 ? items[items.length - 1].endAge + 1 : plan.person1.retirementAge, startAgeRef: items[items.length - 1]?.startAgeRef || 'person1', endAge: plan.person1.lifeExpectancy, endAgeRef: items[items.length - 1]?.endAgeRef || 'person1' })} onRemove={() => removeFromList('expensePeriods', item.id)} canRemove={items.length > 1} />
                                                    </div>
                                                </>}
                                            </div>
                                        ))}
                                        {(listName === 'pensions' || listName === 'otherIncomes') && items.length === 0 && (
                                            <div className="text-center py-2">
                                                <button onClick={listName === 'pensions' ? addPension : addOtherIncome} className="text-sm text-brand-primary font-semibold hover:underline">
                                                    + Add {section.slice(0, -1)}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </InputSection>
                            )
                        })}
                        
                         <InputSection title="AI Powered Insights" subtitle="Get personalized tips based on your plan." titleColorClass="text-purple-600">
                             <div className="col-span-full">
                                <button onClick={handleGetInsights} disabled={isAiLoading || !results} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-gray-400">
                                    {isAiLoading ? 'Analyzing...' : 'Generate AI Insights'}
                                </button>
                                {aiInsights && (
                                    <div className="mt-4 p-4 border rounded-md bg-purple-50">
                                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: aiInsights.replace(/\n/g, '<br />')}}></div>
                                    </div>
                                )}
                             </div>
                         </InputSection>

                         <InputSection title="Charts & Analysis" subtitle="Visualize your retirement projections." titleColorClass="text-yellow-600">
                            <div className="col-span-full">
                                <DynamicCharts projectionData={projectionData} plan={plan} />
                            </div>
                         </InputSection>

                         <InputSection title="Monte Carlo Simulation" subtitle="Stress-test your plan against market volatility." titleColorClass="text-emerald-600">
                            <div className="col-span-full">
                                <MonteCarloSimulator
                                    onRunSimulation={handleRunSimulation}
                                    results={monteCarloResults}
                                    isLoading={isMcLoading}
                                />
                            </div>
                        </InputSection>

                         {filteredProjections.length > 0 && (
                            <InputSection title="Annual Projection" subtitle="A year-by-year breakdown of your retirement finances." titleColorClass="text-gray-600" gridCols={1}>
                                <div className="col-span-full">
                                    <ProjectionTable data={filteredProjections} plan={plan} />
                                </div>
                            </InputSection>
                         )}
                    </div>
                </main>
                <UserManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
                <ScrollToTopButton />
            </div>
        </div>
    );
};

export default App;