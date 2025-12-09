import { useState, useEffect, useCallback } from 'react';

interface HealthcareExpensePeriod {
  name: string;
  monthlyAmount: number;
  startAge: number;
  endAge: number;
  startAgeRef: 'person1' | 'person2';
  endAgeRef: 'person1' | 'person2';
}

interface HealthcareOneTimeExpense {
  age: number;
  amount: number;
  description: string;
  owner: 'person1' | 'person2';
}

interface HealthcareDataTransfer {
  dataType: 'HEALTHCARE_COSTS';
  targetScenario?: string;
  data: {
    expensePeriod: HealthcareExpensePeriod;
    oneTimeExpense?: HealthcareOneTimeExpense;
    metadata: {
      source: string;
      scenario: 'best' | 'expected' | 'worst';
      totalLifetimeCost: number;
      presentValue: number;
      generatedAt: string;
    };
  };
}

interface UseHealthcareIntegrationProps {
  addExpensePeriod: (period: any) => void;
  addOneTimeExpense: (expense: any) => void;
  scenarios: Array<{ id: string; name: string }>;
  activeScenarioId: string | null;
  // Optional callback to select an active scenario by id
  selectScenario?: (id: string) => void;
}

interface UseHealthcareIntegrationReturn {
  receivedData: HealthcareDataTransfer | null;
  clearReceivedData: () => void;
}

/**
 * Hook to handle healthcare cost data integration from Healthcare Cost Estimator
 */
export function useHealthcareIntegration({
  addExpensePeriod,
  addOneTimeExpense,
  scenarios,
  activeScenarioId,
  selectScenario,
}: UseHealthcareIntegrationProps): UseHealthcareIntegrationReturn {
  const [receivedData, setReceivedData] = useState<HealthcareDataTransfer | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    setIsEmbedded(window.self !== window.top);
  }, []);

  // Handle GET_SCENARIOS request
  const handleGetScenarios = useCallback((requestId: string) => {
    if (!isEmbedded) return;

    console.log('[Healthcare Integration] Sending scenarios:', scenarios);
    
    window.parent.postMessage(
      {
        type: 'GET_SCENARIOS_RESPONSE',
        requestId,
        scenarios: scenarios.map(s => ({
          id: s.id,
          name: s.name,
          isActive: s.id === activeScenarioId,
        })),
      },
      '*'
    );
  }, [isEmbedded, scenarios, activeScenarioId]);

  // Handle incoming healthcare data
  const handleHealthcareData = useCallback((transfer: HealthcareDataTransfer) => {
    console.log('[Healthcare Integration] Received healthcare data:', transfer);
    
    try {
      // Generate unique IDs for the new entries
      const expensePeriodId = `healthcare-${Date.now()}`;
      const oneTimeExpenseId = `healthcare-ltc-${Date.now()}`;
      // If we don't have an active plan, attempt to select a target scenario
      // provided by the transfer or fall back to the first available scenario.
      const ensureAndApply = () => {
        if (transfer && transfer.data && (typeof addExpensePeriod === 'function')) {
          const newExpensePeriod = {
            id: expensePeriodId,
            name: transfer.data.expensePeriod.name,
            monthlyAmount: transfer.data.expensePeriod.monthlyAmount,
            startAge: transfer.data.expensePeriod.startAge,
            startAgeRef: transfer.data.expensePeriod.startAgeRef,
            endAge: transfer.data.expensePeriod.endAge,
            endAgeRef: transfer.data.expensePeriod.endAgeRef,
          };

          addExpensePeriod(newExpensePeriod);
          console.log('[Healthcare Integration] Added expense period:', newExpensePeriod);

          if (transfer.data.oneTimeExpense) {
            const newOneTimeExpense = {
              id: oneTimeExpenseId,
              owner: transfer.data.oneTimeExpense.owner,
              age: transfer.data.oneTimeExpense.age,
              amount: transfer.data.oneTimeExpense.amount,
              description: transfer.data.oneTimeExpense.description,
            };
            addOneTimeExpense(newOneTimeExpense);
            console.log('[Healthcare Integration] Added one-time expense:', newOneTimeExpense);
          }

          setReceivedData(transfer);

          window.parent.postMessage(
            {
              type: 'APP_DATA_TRANSFER_RESPONSE',
              success: true,
              sourceApp: 'healthcare-cost',
              targetApp: 'retirement-planner',
              dataType: 'HEALTHCARE_COSTS',
              message: 'Healthcare costs successfully added to retirement plan',
            },
            '*'
          );
        } else {
          console.log('[Healthcare Integration] Cannot import: data structure invalid or plan not ready');
        }
      };

      // If no active scenario, choose one based on transfer.targetScenario or fallback to first available
      if (!activeScenarioId) {
        const targetCandidate = (transfer && (transfer as any).targetScenario) || (scenarios && scenarios.length > 0 ? scenarios[0].id : null);
        if (targetCandidate && selectScenario) {
          console.log('[Healthcare Integration] No active scenario; selecting target scenario:', targetCandidate);
          selectScenario(targetCandidate);
          // Give React a tick to apply the selected scenario, then apply data
          setTimeout(() => ensureAndApply(), 60);
          return;
        }
      }

      // If we have an active scenario already, apply immediately
      ensureAndApply();

      // Add the expense period
      const newExpensePeriod = {
        id: expensePeriodId,
        name: transfer.data.expensePeriod.name,
        monthlyAmount: transfer.data.expensePeriod.monthlyAmount,
        startAge: transfer.data.expensePeriod.startAge,
        startAgeRef: transfer.data.expensePeriod.startAgeRef,
        endAge: transfer.data.expensePeriod.endAge,
        endAgeRef: transfer.data.expensePeriod.endAgeRef,
      };

      addExpensePeriod(newExpensePeriod);
      console.log('[Healthcare Integration] Added expense period:', newExpensePeriod);

      // Add one-time LTC expense if present
      if (transfer.data.oneTimeExpense) {
        const newOneTimeExpense = {
          id: oneTimeExpenseId,
          owner: transfer.data.oneTimeExpense.owner,
          age: transfer.data.oneTimeExpense.age,
          amount: transfer.data.oneTimeExpense.amount,
          description: transfer.data.oneTimeExpense.description,
        };

        addOneTimeExpense(newOneTimeExpense);
        console.log('[Healthcare Integration] Added one-time expense:', newOneTimeExpense);
      }

      // Store received data for potential UI feedback
      setReceivedData(transfer);

      // Send success response
      window.parent.postMessage(
        {
          type: 'APP_DATA_TRANSFER_RESPONSE',
          success: true,
          sourceApp: 'healthcare-cost',
          targetApp: 'retirement-planner',
          dataType: 'HEALTHCARE_COSTS',
          message: 'Healthcare costs successfully added to retirement plan',
        },
        '*'
      );
    } catch (error) {
      console.error('[Healthcare Integration] Error processing healthcare data:', error);
      
      // Send error response
      window.parent.postMessage(
        {
          type: 'APP_DATA_TRANSFER_RESPONSE',
          success: false,
          sourceApp: 'healthcare-cost',
          targetApp: 'retirement-planner',
          dataType: 'HEALTHCARE_COSTS',
          error: error instanceof Error ? error.message : 'Failed to process healthcare data',
        },
        '*'
      );
    }
  }, [addExpensePeriod, addOneTimeExpense]);

  // Message listener
  useEffect(() => {
    if (!isEmbedded) return;

    const handleMessage = (event: MessageEvent) => {
      // Handle GET_SCENARIOS request
      if (event.data?.type === 'GET_SCENARIOS') {
        handleGetScenarios(event.data.requestId);
      }
      
      // Handle APP_DATA_TRANSFER with healthcare data
      else if (
        event.data?.type === 'APP_DATA_TRANSFER' &&
        event.data.sourceApp === 'healthcare-cost' &&
        event.data.targetApp === 'retirement-planner' &&
        event.data.dataType === 'HEALTHCARE_COSTS'
      ) {
        handleHealthcareData(event.data as HealthcareDataTransfer);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isEmbedded, handleGetScenarios, handleHealthcareData]);

  const clearReceivedData = useCallback(() => {
    setReceivedData(null);
  }, []);

  return {
    receivedData,
    clearReceivedData,
  };
}

export default useHealthcareIntegration;
