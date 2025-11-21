import React, { useState, useCallback, useEffect } from 'react';
import { RetirementPlan, PlanType, Person, MonteCarloResult } from './types';
import { UserManualModal } from './components/UserManualModal';
import DisclaimerModal from './components/DisclaimerModal';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { PrintableReport } from './components/PrintableReport';
// Import canonical Header implementation
import Header from './components/Header';
import AppSettingsModal from './components/AppSettingsModal';
import Toast from './components/Toast';
import { ResultsPanel } from './components/ResultsPanel';
import { InputForm } from './components/InputForm';
import { AnalysisSections } from './components/AnalysisSections';
import { 
    useLocalStorage, 
    useAutoSave, 
    useScenarioManagement, 
    usePlanCalculation, 
    useAIInsights,
    useSocialSecurityCalculation 
} from './hooks';
import { buildExport, parseUpload } from './utils/exportImport';


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
    // --- Custom Hooks for State Management ---
    const { loadFromStorage, clearStorage } = useLocalStorage();
    
    const {
        scenariosState,
        activeScenario,
        activeScenarioId,
        scenarios,
        updateActivePlan,
        selectScenario,
        createNewScenario,
        deleteScenario,
        copyScenario,
        updateScenarioName,
        resetAllScenarios,
        uploadScenarios,
    } = useScenarioManagement(loadFromStorage() || undefined);
    
    // Auto-save scenarios to localStorage
    useAutoSave(scenariosState);
    
    const plan = activeScenario?.plan;
    
    // Calculation and results management
    const { results, isLoading, error, projectionData, calculatePlan, setResults, setError } = usePlanCalculation(plan);
    
    // AI insights management
    const { isAiLoading, aiInsights, getInsights, clearInsights } = useAIInsights();
    
    // Social Security auto-calculation
    useSocialSecurityCalculation(plan, updateActivePlan);
    
    // Monte Carlo simulation state
    const [monteCarloResults, setMonteCarloResults] = useState<MonteCarloResult | null>(null);
    const [isMcLoading, setIsMcLoading] = useState(false);
    
    // UI state
    const [lastAddedInfo, setLastAddedInfo] = useState<{list: DynamicListKey, id: string} | null>(null);
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
    const [isDisclaimerRequireAccept, setIsDisclaimerRequireAccept] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string, ms = 2500) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), ms);
    };
    // listen for cross-component toast events
    useEffect(() => {
        const handler = (e: any) => {
            const m = e?.detail?.message;
            if (m) showToast(m);
        };
        window.addEventListener('app:toast', handler as EventListener);
        return () => window.removeEventListener('app:toast', handler as EventListener);
    }, []);
    
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

    // --- Disclaimer on first load ---
    useEffect(() => {
        try {
            const accepted = localStorage.getItem('disclaimerAccepted_v1');
            if (!accepted) {
                // require acceptance on first load
                setIsDisclaimerRequireAccept(true);
                setIsDisclaimerOpen(true);
            }
        } catch (e) {
            // ignore localStorage errors
        }
    }, []);
    
    // Note: updateActivePlan is now provided by useScenarioManagement hook

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
            const list = (prev[listName] as ({ id: string } & object)[]) || [];
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
        updateActivePlan(prev => {
            const existing = (prev[listName] as any[]) || [];
            return { ...prev, [listName]: [...existing, newItem] };
        });
        if (newItem && (newItem as any).id) setLastAddedInfo({ list: listName, id: (newItem as any).id });
    };

    const removeFromList = (listName: DynamicListKey, id: string) => {
        updateActivePlan(prev => {
            const existing = (prev[listName] as { id: string }[]) || [];
            return { ...prev, [listName]: existing.filter(item => item.id !== id) };
        });
    };

    // --- Scenario Management Handlers (using hooks) ---
    const clearCalculationResults = useCallback(() => {
        setResults(null);
        setError(null);
        clearInsights();
        setMonteCarloResults(null);
    }, [setResults, setError, clearInsights]);

    const handleSelectScenario = useCallback((id: string) => {
        selectScenario(id);
        clearCalculationResults();
    }, [selectScenario, clearCalculationResults]);

    const handleNewScenario = useCallback(() => {
        createNewScenario();
        clearCalculationResults();
    }, [createNewScenario, clearCalculationResults]);

    const handleDeleteScenario = useCallback(() => {
        if (!activeScenarioId || !activeScenario || Object.keys(scenarios).length <= 1) {
            alert("You cannot delete the last scenario.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete the "${activeScenario.name}" scenario?`)) {
            const success = deleteScenario();
            if (success) {
                clearCalculationResults();
            }
        }
    }, [activeScenarioId, activeScenario, scenarios, deleteScenario, clearCalculationResults]);
    
    const handleCopyScenario = useCallback(() => {
        copyScenario();
        clearCalculationResults();
    }, [copyScenario, clearCalculationResults]);
    
    const handleUpdateScenarioName = useCallback((newName: string) => {
        updateScenarioName(newName);
    }, [updateScenarioName]);
    
    // --- Backup & Restore Handlers ---
    const handleDownloadScenarios = async (): Promise<boolean> => {
        try {
            // Include app-level asset-assumption defaults in the exported file
            const getStoredAssetDefaults = () => {
                try {
                    const raw = localStorage.getItem('assetAssumptionDefaults');
                    if (raw) return JSON.parse(raw);
                } catch (e) {
                    // ignore
                }
                // Fallback to using the active plan's values if present
                if (plan) {
                    return {
                        stockMean: (plan as any).stockMean ?? 8,
                        stockStd: (plan as any).stockStd ?? 15,
                        bondMean: (plan as any).bondMean ?? 3,
                        bondStd: (plan as any).bondStd ?? 6,
                    };
                }
                return { stockMean: 8, stockStd: 15, bondMean: 3, bondStd: 6 };
            };

            const exportObj = buildExport(scenariosState, getStoredAssetDefaults());
            const jsonString = JSON.stringify(exportObj, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'retirement_scenarios.retire';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error downloading scenarios:', error);
            showToast('Failed to download scenarios');
            return false;
        }
    };

    const handleUploadScenarios = useCallback((event: React.ChangeEvent<HTMLInputElement>): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            const file = event.target.files?.[0];
            if (!file) { resolve(false); return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error('Invalid file content');
                    const uploaded = JSON.parse(text);
                    const parsed = parseUpload(uploaded);
                    if (parsed.type === 'wrapped') {
                        const issues = parsed.issues || [];
                        if (issues.length > 0) {
                            const proceed = window.confirm(`The uploaded file contains asset-assumption defaults with potential issues:\n- ${issues.join('\n- ')}\n\nProceed and import anyway?`);
                            if (!proceed) { resolve(false); return; }
                        }
                        if (window.confirm('Are you sure you want to upload this file? This will overwrite all your current scenarios.')) {
                            try { if (parsed.assetDefaults) localStorage.setItem('assetAssumptionDefaults', JSON.stringify(parsed.assetDefaults)); } catch (e) { /* ignore */ }
                            uploadScenarios({ scenariosState: parsed.scenariosState, appSettings: { assetAssumptionDefaults: parsed.assetDefaults } });
                            clearCalculationResults();
                            showToast('Scenarios loaded successfully');
                            resolve(true); return;
                        }
                    }
                    if (parsed.type === 'legacy') {
                        if (window.confirm('Are you sure you want to upload this file? This will overwrite all your current scenarios.')) {
                            uploadScenarios(parsed.scenariosState);
                            clearCalculationResults();
                            showToast('Scenarios loaded successfully');
                            resolve(true); return;
                        }
                    }
                } catch (error) {
                    console.error('Error uploading scenarios:', error);
                    showToast('Failed to upload scenarios. Please make sure the file is a valid scenario backup.');
                }
                if (event.target) event.target.value = '';
                resolve(false);
            };
            reader.readAsText(file);
        });
    }, [uploadScenarios, clearCalculationResults]);

    // Note: Social Security calculation is now handled by useSocialSecurityCalculation hook

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

    // --- Calculation and Analysis Handlers (using hooks) ---
    // Note: calculatePlan is now provided by usePlanCalculation hook
    
    const handleGetInsights = useCallback(async () => {
        if (!results || !plan) return;
        await getInsights(plan, results);
    }, [plan, results, getInsights]);

    // Monte Carlo simulation handler (will be updated to use Web Worker in future)
    const handleRunSimulation = useCallback((numSimulations: number, volatility: number) => {
        if (!plan) return;
        setIsMcLoading(true);
        setMonteCarloResults(null);
        // Import the service dynamically to avoid circular dependencies
        import('./services/monteCarloService').then(({ runMonteCarloSimulation }) => {
            setTimeout(() => {
                const mcResults = runMonteCarloSimulation(plan, numSimulations, volatility);
                setMonteCarloResults(mcResults);
                setIsMcLoading(false);
            }, 50);
        });
    }, [plan]);

    const handlePrint = useCallback(() => window.print(), []);
    
    const handleResetPlan = useCallback(() => {
        if (window.confirm('Are you sure you want to reset all your data? This will delete ALL saved scenarios and cannot be undone.')) {
            clearStorage();
            resetAllScenarios();
            clearCalculationResults();
            try {
                localStorage.removeItem('disclaimerAccepted_v1');
            } catch (e) {
                // ignore localStorage errors
            }
            // force the disclaimer to show and require acceptance again
            setIsDisclaimerRequireAccept(true);
            setIsDisclaimerOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [clearStorage, resetAllScenarios, clearCalculationResults]);

    // --- Real-time Calculation with Debounce ---
    useEffect(() => {
        if (!plan) return;
        const handler = setTimeout(() => {
            calculatePlan();
        }, 1500); // Debounce requests - increased from 1000ms for better performance
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
                    // expose settings opening
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    setIsManualOpen={setIsManualOpen}
                    setIsDisclaimerOpen={(open: boolean, requireAccept?: boolean) => {
                        setIsDisclaimerRequireAccept(Boolean(requireAccept));
                        setIsDisclaimerOpen(open);
                    }}
                />

                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
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
                </div>
                
                <UserManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
                <DisclaimerModal
                    isOpen={isDisclaimerOpen}
                    requireAccept={isDisclaimerRequireAccept}
                    onAccept={() => {
                        try { localStorage.setItem('disclaimerAccepted_v1', 'true'); } catch (e) { /* ignore */ }
                        setIsDisclaimerOpen(false);
                        setIsDisclaimerRequireAccept(false);
                    }}
                    onClose={() => setIsDisclaimerOpen(false)}
                />
                <AppSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSaveDefaults={(d) => {
                    // persist and notify
                    try { localStorage.setItem('assetAssumptionDefaults', JSON.stringify(d)); } catch (e) { /* ignore */ }
                    showToast('Saved app defaults');
                }} />
                <Toast message={toastMessage} />
                <ScrollToTopButton />
            </div>
        </div>
    );
};

export default App;