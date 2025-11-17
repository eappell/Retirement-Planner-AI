import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from './firebase.ts';
import { ScenariosState } from '../App.tsx';

const getScenariosRef = (userId: string) => doc(db, 'users', userId);

export const saveScenarios = async (userId: string, scenariosState: ScenariosState): Promise<void> => {
    try {
        const scenariosRef = getScenariosRef(userId);
        await setDoc(scenariosRef, {
            data: scenariosState,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error saving scenarios to Firestore: ", error);
        // Optionally, add user-facing error handling here
    }
};

export const loadScenarios = async (userId: string): Promise<ScenariosState | null> => {
    try {
        const scenariosRef = getScenariosRef(userId);
        const docSnap = await getDoc(scenariosRef);

        if (docSnap.exists()) {
            // Basic validation to ensure data shape is correct
            const data = docSnap.data();
            if (data && data.data && data.data.scenarios && data.data.activeScenarioId) {
                 return data.data as ScenariosState;
            }
        }
        return null; // No data found or data is malformed
    } catch (error) {
        console.error("Error loading scenarios from Firestore: ", error);
        return null;
    }
};