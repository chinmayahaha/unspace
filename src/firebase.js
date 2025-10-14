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

// Add this line right before initializing
console.log("API Key being used:", process.env.REACT_APP_API_KEY);


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Initialize the services you'll use
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// 3. This is the MOST IMPORTANT part for local development.
// It checks if you are running the app locally and connects to the emulators.
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  console.log("✅ Testing locally. Connecting to emulators...");
  
  // Point to the Auth emulator
  connectAuthEmulator(auth, "http://localhost:9099");
  
  // Point to the Firestore emulator
  connectFirestoreEmulator(db, "localhost", 8080);
  // Point to the Functions emulator (default port 5001)
  connectFunctionsEmulator(functions, "localhost", 5001);
}

// 4. Export the services so you can use them in your components
export { auth, db, functions };
