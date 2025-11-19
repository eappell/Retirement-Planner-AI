import { useState, useEffect } from 'react';
import { ScenariosState, Scenario, RetirementPlan } from '../types';

const STORAGE_KEY = 'retirementPlannerScenarios';

/**
 * Custom hook for managing local storage persistence of scenarios
 * Handles loading, saving, and error handling for localStorage operations
 */
export const useLocalStorage = () => {
    const loadFromStorage = (): ScenariosState | null => {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const parsed = JSON.parse(savedState);
                if (parsed.scenarios && parsed.activeScenarioId) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error("Error loading from local storage", error);
        }
        return null;
    };

    const saveToStorage = (state: ScenariosState): void => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error("Error saving to local storage:", error);
        }
    };

    const clearStorage = (): void => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error("Error clearing local storage:", error);
        }
    };

    return {
        loadFromStorage,
        saveToStorage,
        clearStorage,
    };
};

/**
 * Custom hook for auto-saving scenarios state to localStorage
 */
export const useAutoSave = (scenariosState: ScenariosState) => {
    const { saveToStorage } = useLocalStorage();

    useEffect(() => {
        saveToStorage(scenariosState);
    }, [scenariosState, saveToStorage]);
};
