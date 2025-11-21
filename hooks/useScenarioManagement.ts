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
  socialSecurity: { person1EstimatedBenefit: 0, person2EstimatedBenefit: 0 },
  state: 'CA',
  inflationRate: 2.5,
  avgReturn: 7,
  annualWithdrawalRate: 4,
  dieWithZero: false,
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
    const updateActivePlan = useCallback((updater: (prevPlan: RetirementPlan) => RetirementPlan) => {
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
    }, [activeScenarioId]);

    const selectScenario = useCallback((id: string) => {
        setScenariosState(prev => ({ ...prev, activeScenarioId: id }));
    }, []);

    const createNewScenario = useCallback(() => {
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
    }, [scenarios]);

    const deleteScenario = useCallback(() => {
        if (!activeScenarioId || !activeScenario || Object.keys(scenarios).length <= 1) {
            return false; // Cannot delete
        }

        setScenariosState(prev => {
            const newScenarios = { ...prev.scenarios };
            delete newScenarios[activeScenarioId];
            const newActiveId = Object.keys(newScenarios)[0] || null;
            return { scenarios: newScenarios, activeScenarioId: newActiveId };
        });
        return true;
    }, [activeScenarioId, activeScenario, scenarios]);

    const copyScenario = useCallback(() => {
        if (!activeScenarioId || !activeScenario) return;

        const newId = `scenario-${Date.now()}`;
        const newScenario: Scenario = {
            id: newId,
            name: `${activeScenario.name} Copy`,
            plan: structuredClone(activeScenario.plan),
        };

        setScenariosState(prev => ({
            activeScenarioId: newId,
            scenarios: { ...prev.scenarios, [newId]: newScenario },
        }));
    }, [activeScenarioId, activeScenario]);

    const updateScenarioName = useCallback((newName: string) => {
        if (!activeScenarioId) return;
        setScenariosState(prev => ({
            ...prev,
            scenarios: {
                ...prev.scenarios,
                [activeScenarioId]: { ...prev.scenarios[activeScenarioId], name: newName },
            },
        }));
    }, [activeScenarioId]);

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
        selectScenario,
        createNewScenario,
        deleteScenario,
        copyScenario,
        updateScenarioName,
        resetAllScenarios,
        uploadScenarios,
    };
};
