import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/signin" replace />;

  return isAdmin ? children : <Navigate to="/" replace />;
};

export default AdminRoute;
