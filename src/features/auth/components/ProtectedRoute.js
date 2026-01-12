import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../../../components/UI/LoadingScreen';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // 1. Show standardized loader
  if (loading) {
    return <LoadingScreen />;
  }

  // 2. Redirect if not authenticated
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;

