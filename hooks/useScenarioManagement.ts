import { useState, useCallback, useMemo } from 'react';
import { ScenariosState, Scenario, RetirementPlan } from '../types';
import { PlanType } from '../types';

const initialPlanState: RetirementPlan = {
  planType: PlanType.INDIVIDUAL,
  person1: { name: 'Person 1', currentAge: 40, retirementAge: 67, lifeExpectancy: 90, currentSalary: 80000, claimingAge: 67 },
  person2: { name: 'Person 2', currentAge: 40, retirementAge: 67, lifeExpectancy: 90, currentSalary: 75000, claimingAge: 67 },
  retirementAccounts: [
    { id: '1', owner: 'person1', name: '401k', balance: 500000, annualContribution: 10000, match: 5, type: '401k' }
  ],
  investmentAccounts: [
        { id: '1', owner: 'person1', name: 'Brokerage', balance: 100000, annualContribution: 5000, percentStocks: 60, percentBonds: 40 }
  ],
  pensions: [],
  otherIncomes: [],
  expensePeriods: [
    { id: '1', name: 'Retirement', monthlyAmount: 5000, startAge: 67, startAgeRef: 'person1', endAge: 90, endAgeRef: 'person1' }
  ],
    oneTimeExpenses: [],
  socialSecurity: { person1EstimatedBenefit: 0, person2EstimatedBenefit: 0 },
  state: 'CA',
  inflationRate: 2.5,
  avgReturn: 7,
  annualWithdrawalRate: 4,
  dieWithZero: false,
    useBalancesForSurvivorIncome: false,
  legacyAmount: 0,
    useFatTails: true,
    fatTailDf: 4,
};

/**
 * Custom hook for managing retirement planning scenarios
 * Handles scenario CRUD operations, active scenario tracking, and state management
 */
export const useScenarioManagement = (initialState?: ScenariosState) => {
    const getDefaultScenario = useCallback((): Scenario => ({
        id: `scenario-${Date.now()}`,
        name: 'Default Plan',
        plan: initialPlanState,
    }), []);

    const [scenariosState, setScenariosState] = useState<ScenariosState>(() => {
        if (initialState) {
            return initialState;
        }
        const defaultScenario = getDefaultScenario();
        return {
            activeScenarioId: defaultScenario.id,
            scenarios: { [defaultScenario.id]: defaultScenario },
        };
    });

    const { activeScenarioId, scenarios } = scenariosState;
    const activeScenario = activeScenarioId ? scenarios[activeScenarioId] : null;

    // Helper to update the plan within the active scenario
    // Accept either an updater function or a partial plan object for convenience
    const updateActivePlan = useCallback((updaterOrPartial: ((prevPlan: RetirementPlan) => RetirementPlan) | Partial<RetirementPlan>) => {
        setScenariosState(prev => {
            const id = prev.activeScenarioId;
            if (!id) return prev;
            const current = prev.scenarios[id];
            if (!current) return prev;
            const currentPlan = current.plan;

            let updatedPlan: RetirementPlan;
            if (typeof updaterOrPartial === 'function') {
                // function updater
                updatedPlan = (updaterOrPartial as (prev: RetirementPlan) => RetirementPlan)(currentPlan);
            } else {
                // partial object merge
                updatedPlan = { ...currentPlan, ...(updaterOrPartial as Partial<RetirementPlan>) };
            }

            if (updatedPlan === currentPlan) return prev; // No change
            return {
                ...prev,
                scenarios: {
                    ...prev.scenarios,
                    [id]: {
                        ...prev.scenarios[id],
                        plan: updatedPlan,
                    },
                },
            };
        });
    }, []);

    const selectScenario = useCallback((id: string) => {
        setScenariosState(prev => ({ ...prev, activeScenarioId: id }));
    }, []);

    const createNewScenario = useCallback(() => {
        setScenariosState(prev => {
            const newId = `scenario-${Date.now()}`;
            const count = Object.keys(prev.scenarios).length;
            const newScenario: Scenario = {
                id: newId,
                name: `New Scenario ${count + 1}`,
                plan: initialPlanState,
            };
            return {
                activeScenarioId: newId,
                scenarios: { ...prev.scenarios, [newId]: newScenario },
            };
        });
    }, []);

    const deleteScenario = useCallback(() => {
        let deleted = false;
        setScenariosState(prev => {
            const id = prev.activeScenarioId;
            if (!id || !prev.scenarios[id] || Object.keys(prev.scenarios).length <= 1) {
                return prev; // Cannot delete
            }
            const newScenarios = { ...prev.scenarios };
            delete newScenarios[id];
            const newActiveId = Object.keys(newScenarios)[0] || null;
            deleted = true;
            return { scenarios: newScenarios, activeScenarioId: newActiveId } as ScenariosState;
        });
        return deleted;
    }, []);

    const copyScenario = useCallback(() => {
        setScenariosState(prev => {
            const id = prev.activeScenarioId;
            if (!id || !prev.scenarios[id]) return prev;
            const active = prev.scenarios[id];
            const newId = `scenario-${Date.now()}`;
            const newScenario: Scenario = {
                id: newId,
                name: `${active.name} Copy`,
                plan: structuredClone(active.plan),
            };
            return {
                activeScenarioId: newId,
                scenarios: { ...prev.scenarios, [newId]: newScenario },
            };
        });
    }, []);

    const updateScenarioName = useCallback((newName: string) => {
        setScenariosState(prev => {
            const id = prev.activeScenarioId;
            if (!id || !prev.scenarios[id]) return prev;
            return {
                ...prev,
                scenarios: {
                    ...prev.scenarios,
                    [id]: { ...prev.scenarios[id], name: newName },
                },
            };
        });
    }, []);

    const updateScenarioNameById = useCallback((id: string, newName: string) => {
        setScenariosState(prev => {
            if (!id || !prev.scenarios[id]) return prev;
            return {
                ...prev,
                scenarios: {
                    ...prev.scenarios,
                    [id]: { ...prev.scenarios[id], name: newName },
                },
            };
        });
    }, []);

    const resetAllScenarios = useCallback(() => {
        const defaultScenario = getDefaultScenario();
        setScenariosState({
            activeScenarioId: defaultScenario.id,
            scenarios: { [defaultScenario.id]: defaultScenario },
        });
    }, [getDefaultScenario]);

    // Accept either the legacy ScenariosState shape or the new wrapped export:
    // { scenariosState: ScenariosState, appSettings?: { assetAssumptionDefaults?: {...} } }
    const uploadScenarios = useCallback((uploadedState: any) => {
        if (!uploadedState) return;

        // New wrapped format
        if (uploadedState.scenariosState && uploadedState.scenariosState.scenarios) {
            setScenariosState(uploadedState.scenariosState);
            // Persist any app-level settings to localStorage so the app can pick them up
            try {
                if (uploadedState.appSettings && uploadedState.appSettings.assetAssumptionDefaults) {
                    localStorage.setItem('assetAssumptionDefaults', JSON.stringify(uploadedState.appSettings.assetAssumptionDefaults));
                }
            } catch (e) {
                // ignore storage errors
            }
            return;
        }

        // Legacy format (ScenariosState)
        if (uploadedState.scenarios && typeof uploadedState.activeScenarioId !== 'undefined') {
            setScenariosState(uploadedState as ScenariosState);
            return;
        }

        // Unknown format: ignore
    }, []);

    return {
        scenariosState,
        activeScenario,
        activeScenarioId,
        scenarios,
        updateActivePlan,
        updateAllScenarios: (partialPlan: Partial<RetirementPlan> & any) => {
            // Support a special per-scenario map: { __perScenario: { [scenarioId]: partial } }
            if (partialPlan && typeof partialPlan === 'object' && (partialPlan as any).__perScenario) {
                const per = (partialPlan as any).__perScenario as Record<string, Partial<RetirementPlan>>;
                setScenariosState(prev => {
                    const newScenarios: typeof prev.scenarios = { ...prev.scenarios } as any;
                    Object.entries(per).forEach(([id, p]) => {
                        if (!newScenarios[id]) return;
                        newScenarios[id] = {
                            ...newScenarios[id],
                            plan: {
                                ...structuredClone(newScenarios[id].plan),
                                ...structuredClone(p),
                            },
                        };
                    });
                    return { ...prev, scenarios: newScenarios };
                });
                return;
            }

            setScenariosState(prev => {
                const newScenarios: typeof prev.scenarios = {} as any;
                Object.entries(prev.scenarios).forEach(([id, sc]) => {
                    newScenarios[id] = {
                        ...sc,
                        plan: {
                            ...sc.plan,
                            ...structuredClone(partialPlan),
                        },
                    };
                });
                return { ...prev, scenarios: newScenarios };
            });
        },
        selectScenario,
        createNewScenario,
        deleteScenario,
        copyScenario,
        updateScenarioName,
        updateScenarioNameById,
        resetAllScenarios,
        uploadScenarios,
    };
};
