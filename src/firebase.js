// In src/firebase.js

// 1. Import all the services you will need
import { initializeApp } from "firebase/app";
// eslint-disable-next-line no-unused-vars
import { getAuth, connectAuthEmulator } from "firebase/auth";
// eslint-disable-next-line no-unused-vars
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
// eslint-disable-next-line no-unused-vars
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

// If config looks missing, but we're running locally, provide a small
// emulator-friendly fallback so the app can initialize and connect to
// local emulators. This prevents the UI from showing a blocking banner
// while keeping production behavior strict.
const isLocalhost = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

let effectiveConfig = mergedConfig;
const hasRequired = mergedConfig && mergedConfig.apiKey && mergedConfig.projectId && mergedConfig.authDomain;

if (!hasRequired && isLocalhost) {
  // Minimal, non-secret values are fine for the client when using emulators.
  effectiveConfig = Object.assign({}, {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID || 'unspace-local',
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET || '',
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID || '',
    appId: process.env.REACT_APP_APP_ID || '1:000:web:local',
    measurementId: process.env.REACT_APP_MEASUREMENT_ID || ''
  }, runtimeConfig);

  console.warn('Firebase env vars missing — using emulator-friendly fallback config. Ensure Firebase emulators are running for full functionality.');
}

// Simple validation so the app fails gracefully when env vars are missing
const isValidConfig = effectiveConfig && effectiveConfig.apiKey && effectiveConfig.projectId && effectiveConfig.authDomain;

if (!isValidConfig) {
  // Keep this a warning in case somebody runs in CI or production without config.
  console.warn('Firebase configuration is missing or incomplete. Provide REACT_APP_API_KEY, REACT_APP_PROJECT_ID and REACT_APP_AUTH_DOMAIN or set window.__FIREBASE_CONFIG__.');
}

// Initialize exports as nulls; components should check these before use
let auth = null;
let db = null;
let functions = null;

if (isValidConfig) {
  // Add a small log so developers can verify which API key is in use (safe for public keys)
  console.log('Initializing Firebase with projectId:', effectiveConfig.projectId);

  const app = initializeApp(effectiveConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);

  // Connect emulators when running locally
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('✅ Testing locally. Connecting to emulators...');
    try {
      // Only connect if emulators are actually running
      // Uncomment these if you want to use emulators:
      // connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      // connectFirestoreEmulator(db, '127.0.0.1', 8080);
      // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    } catch (e) {
      // If emulator connection fails, continue with production
      console.warn('Emulators not available, using production Firebase:', e.message || e);
    }
  }
}

const firebaseConfigured = !!isValidConfig;

// Add a helper to check if functions are available
export const isFunctionsAvailable = () => {
  return firebaseConfigured && functions !== null;
};

export { auth, db, functions, firebaseConfigured };
