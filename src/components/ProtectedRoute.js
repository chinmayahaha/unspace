import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0A84FF, #1C1C1E)',
        color: '#FFFFFF'
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '1.2rem'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/signin" replace />;
};

export default ProtectedRoute;
