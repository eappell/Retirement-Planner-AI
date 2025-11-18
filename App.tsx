import React, { useState, useCallback, useEffect } from 'react';
import { RetirementPlan, CalculationResult, PlanType, Person, YearlyProjection, MonteCarloResult, Scenario, ScenariosState } from './types';
import { getRetirementInsights } from './services/geminiService';
import { estimateSocialSecurityBenefit } from './services/socialSecurityService';
import { runSimulation } from './services/simulationService';
import { runMonteCarloSimulation } from './services/monteCarloService';
import { UserManualModal } from './components/UserManualModal';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { PrintableReport } from './components/PrintableReport';
import { Header } from './components/Header';
import { ResultsPanel } from './components/ResultsPanel';
import { InputForm } from './components/InputForm';
import { AnalysisSections } from './components/AnalysisSections';


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
    const getDefaultScenario = (): Scenario => ({
        id: `scenario-${Date.now()}`,
        name: 'Default Plan',
        plan: initialPlanState,
    });

    const [scenariosState, setScenariosState] = useState<ScenariosState>(() => {
        try {
            const savedState = localStorage.getItem('retirementPlannerScenarios');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                if (parsed.scenarios && parsed.activeScenarioId) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error("Error loading from local storage", error);
        }
        const defaultScenario = getDefaultScenario();
        return {
            activeScenarioId: defaultScenario.id,
            scenarios: { [defaultScenario.id]: defaultScenario },
        };
    });

    // --- Local Storage Persistence ---
    useEffect(() => {
        try {
            localStorage.setItem('retirementPlannerScenarios', JSON.stringify(scenariosState));
        } catch (error) {
            console.error("Error saving to local storage:", error);
        }
    }, [scenariosState]);

    const { activeScenarioId, scenarios } = scenariosState;
    const activeScenario = activeScenarioId ? scenarios[activeScenarioId] : null;

    const plan = activeScenario?.plan;

    const [results, setResults] = useState<CalculationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        setError(null);
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
        setError(null);
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
            setError(null);
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
        setError(null);
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
    
    // --- Backup & Restore Handlers ---
    const handleDownloadScenarios = () => {
        try {
            const jsonString = JSON.stringify(scenariosState, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'retirement_scenarios.retire';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading scenarios:", error);
            alert("Failed to download scenarios.");
        }
    };

    const handleUploadScenarios = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("Invalid file content");
                }
                const uploadedState = JSON.parse(text);

                // Basic validation
                if (uploadedState && uploadedState.scenarios && typeof uploadedState.activeScenarioId !== 'undefined') {
                     if (window.confirm('Are you sure you want to upload this file? This will overwrite all your current scenarios.')) {
                        setScenariosState(uploadedState);
                        setResults(null);
                        setError(null);
                        setAiInsights('');
                        setMonteCarloResults(null);
                        alert("Scenarios loaded successfully!");
                     }
                } else {
                    throw new Error("Invalid scenario file format.");
                }
            } catch (error) {
                console.error("Error uploading scenarios:", error);
                alert("Failed to upload scenarios. Please make sure the file is a valid scenario backup.");
            }
            // Reset file input value to allow re-uploading the same file
            if (event.target) {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
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
        setError(null);
        setResults(null);
        setProjectionData([]);
        
        try {
            const simulationResults = runSimulation(plan);
            setResults(simulationResults);
            setProjectionData(simulationResults.yearlyProjections);
        } catch (err: any) {
            console.error("Calculation failed:", err);
            setError(err.message || "An unknown error occurred during calculation.");
        } finally {
            setIsLoading(false);
        }
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
        // Use a Promise to allow UI to update before blocking
        setTimeout(() => {
            const mcResults = runMonteCarloSimulation(plan, numSimulations, volatility);
            setMonteCarloResults(mcResults);
            setIsMcLoading(false);
        }, 50);
    }, [plan]);

    const handlePrint = () => window.print();
    
    const handleResetPlan = () => {
        if (window.confirm('Are you sure you want to reset all your data? This will delete ALL saved scenarios and cannot be undone.')) {
            localStorage.removeItem('retirementPlannerScenarios');
            const defaultScenario = getDefaultScenario();
            setScenariosState({
                activeScenarioId: defaultScenario.id,
                scenarios: { [defaultScenario.id]: defaultScenario },
            });
            setResults(null);
            setError(null);
            setAiInsights('');
            setMonteCarloResults(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // --- Real-time Calculation ---
    useEffect(() => {
        if (!plan) return;
        const handler = setTimeout(() => {
            calculatePlan();
        }, 1000); // Debounce requests
        return () => clearTimeout(handler);
    }, [plan, calculatePlan]);

    if (!plan || !activeScenario) {
        return <div className="flex justify-center items-center h-screen"><div className="text-xl">Loading Scenarios...</div></div>;
    }

    return (
        <div className="min-h-screen bg-brand-background text-brand-text-primary">
            <PrintableReport plan={plan} results={results} scenarioName={activeScenario.name} />
            <div className="print:hidden">
                <Header
                    activeScenario={activeScenario}
                    scenarios={scenarios}
                    handleSelectScenario={handleSelectScenario}
                    handleNewScenario={handleNewScenario}
                    handleCopyScenario={handleCopyScenario}
                    handleDeleteScenario={handleDeleteScenario}
                    handleUpdateScenarioName={handleUpdateScenarioName}
                    handleDownloadScenarios={handleDownloadScenarios}
                    handleUploadScenarios={handleUploadScenarios}
                    handleResetPlan={handleResetPlan}
                    handlePrint={handlePrint}
                    setIsManualOpen={setIsManualOpen}
                />

                {/* Main Layout with Sidebar */}
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 relative">
                    
                    {/* Main Content Column */}
                    <main className="flex-1 min-w-0">
                        <ResultsPanel results={results} isLoading={isLoading} />
                        
                        <div className="mt-4 space-y-6">
                            <InputForm
                                plan={plan}
                                handlePlanChange={handlePlanChange}
                                handlePersonChange={handlePersonChange}
                                handleDynamicListChange={handleDynamicListChange}
                                addToList={addToList}
                                removeFromList={removeFromList}
                            />
                            <AnalysisSections
                                plan={plan}
                                results={results}
                                isLoading={isLoading}
                                error={error}
                                isAiLoading={isAiLoading}
                                aiInsights={aiInsights}
                                handleGetInsights={handleGetInsights}
                                projectionData={projectionData}
                                isMcLoading={isMcLoading}
                                monteCarloResults={monteCarloResults}
                                handleRunSimulation={handleRunSimulation}
                            />
                        </div>
                    </main>

                    {/* Ad Sidebar Column */}
                    <aside className="hidden lg:block w-[300px] flex-shrink-0">
                         <div className="sticky top-24 space-y-6">
                            {/* Placeholder for Vertical Ad */}
                            <div className="bg-gray-100 border border-gray-200 rounded-lg h-[600px] flex flex-col items-center justify-center text-gray-400">
                                <span className="font-semibold text-sm">Advertisement</span>
                                <span className="text-xs mt-1">300 x 600</span>
                                {/* 
                                    GOOGLE ADSENSE: 
                                    Replace this placeholder div with your actual ad code.
                                    Example:
                                    <ins className="adsbygoogle"
                                         style={{ display: 'block' }}
                                         data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
                                         data-ad-slot="YOUR_AD_SLOT_ID"
                                         data-ad-format="auto"
                                         data-full-width-responsive="true"></ins>
                                    <script>
                                         (adsbygoogle = window.adsbygoogle || []).push({});
                                    </script>
                                */}
                            </div>
                        </div>
                    </aside>
                </div>
                
                <UserManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
                <ScrollToTopButton />
            </div>
        </div>
    );
};

export default App;