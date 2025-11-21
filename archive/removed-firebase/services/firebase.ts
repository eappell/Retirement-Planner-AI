import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// =================================================================
// TODO: PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
// =================================================================
// You can get this from the Firebase console:
// Project settings > General > Your apps > Web app > Firebase SDK snippet > Config
const firebaseConfig = {
  apiKey: "AIzaSyCiCRiHB-DZSzyyZJN4aVv1TCU4r4J1gyU",
  authDomain: "retirement-planner-ai.firebaseapp.com",
  projectId: "retirement-planner-ai",
  storageBucket: "retirement-planner-ai.firebasestorage.app",
  messagingSenderId: "786750269726",
  appId: "1:786750269726:web:8be15f8d49b57af3b1010f",
  measurementId: "G-1L8EG4LEF2"
};
// =================================================================

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
