import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary'; 
import reportWebVitals from './reportWebVitals';
// --- FIX START: Import AuthProvider ---
import { AuthProvider } from './features/auth/context/AuthContext'; 
// --- FIX END ---

import './styles/global.css'; 

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* --- FIX START: Wrap App with AuthProvider --- */}
      <AuthProvider>
        <App />
      </AuthProvider>
      {/* --- FIX END --- */}
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();