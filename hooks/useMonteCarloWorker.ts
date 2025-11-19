import { useState, useCallback, useRef } from 'react';
import { RetirementPlan, MonteCarloResult } from '../types';
import { MonteCarloWorkerMessage, MonteCarloWorkerResponse } from '../workers/monteCarloWorker';

/**
 * Custom hook for running Monte Carlo simulations using a Web Worker
 * This prevents blocking the main UI thread during intensive calculations
 */
export const useMonteCarloWorker = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<MonteCarloResult | null>(null);
    const workerRef = useRef<Worker | null>(null);

    const runSimulation = useCallback((
        plan: RetirementPlan,
        numSimulations: number,
        volatility: number
    ) => {
        setIsLoading(true);
        setProgress(0);
        setResults(null);

        // Terminate any existing worker
        if (workerRef.current) {
            workerRef.current.terminate();
        }

        // Create new worker
        // Note: Vite handles worker imports differently
        const worker = new Worker(
            new URL('../workers/monteCarloWorker.ts', import.meta.url),
            { type: 'module' }
        );

        workerRef.current = worker;

        worker.onmessage = (e: MessageEvent<MonteCarloWorkerResponse>) => {
            const { type, progress: workerProgress, successRate, outcomes } = e.data;

            if (type === 'progress' && workerProgress !== undefined) {
                setProgress(workerProgress);
            } else if (type === 'complete' && successRate !== undefined && outcomes) {
                setResults({
                    successRate,
                    outcomes,
                });
                setIsLoading(false);
                setProgress(100);
                worker.terminate();
                workerRef.current = null;
            }
        };

        worker.onerror = (error) => {
            console.error('Worker error:', error);
            setIsLoading(false);
            setProgress(0);
            worker.terminate();
            workerRef.current = null;
        };

        // Start the simulation
        const message: MonteCarloWorkerMessage = {
            type: 'start',
            plan,
            numSimulations,
            volatility,
        };
        worker.postMessage(message);
    }, []);

    const cancel = useCallback(() => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
            setIsLoading(false);
            setProgress(0);
        }
    }, []);

    return {
        runSimulation,
        cancel,
        isLoading,
        progress,
        results,
    };
};
