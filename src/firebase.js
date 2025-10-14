// In src/firebase.js

// 1. Import all the services you will need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};
// Allow injecting a runtime config (useful for hosting environments)
const runtimeConfig = (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) ? window.__FIREBASE_CONFIG__ : {};
const mergedConfig = Object.assign({}, firebaseConfig, runtimeConfig);

// Simple validation so the app fails gracefully when env vars are missing
const isValidConfig = mergedConfig && mergedConfig.apiKey && mergedConfig.projectId && mergedConfig.authDomain;

if (!isValidConfig) {
  // Don't throw — export nulls so the rest of the app can render and show a friendly message
  console.error('Firebase configuration is missing or incomplete. Please set REACT_APP_API_KEY, REACT_APP_PROJECT_ID and REACT_APP_AUTH_DOMAIN (or provide window.__FIREBASE_CONFIG__).');
}

// Initialize exports as nulls; components should check these before use
let auth = null;
let db = null;
let functions = null;

if (isValidConfig) {
  // Add a small log so developers can verify which API key is in use (safe for public keys)
  console.log('Initializing Firebase with projectId:', mergedConfig.projectId);

  const app = initializeApp(mergedConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);

  // Connect emulators when running locally
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.log('✅ Testing locally. Connecting to emulators...');
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectFunctionsEmulator(functions, 'localhost', 5001);
    } catch (e) {
      console.warn('Failed to connect to emulators (they may not be running):', e.message || e);
    }
  }
}

const firebaseConfigured = !!isValidConfig;

export { auth, db, functions, firebaseConfigured };
