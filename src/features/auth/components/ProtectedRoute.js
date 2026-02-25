/* src/components/auth/ProtectedRoute.js */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps any page that requires authentication.
 * 
 * HOW IT WORKS:
 * - AuthProvider already blocks ALL rendering until auth state resolves
 * - So by the time ProtectedRoute renders, 'loading' is always false
 * - If user is null (not signed in), redirect to /signin
 * - The 'from' location is saved so after login the user returns to where they were
 * 
 * USAGE in App.js:
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
 *   } />
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  // Not logged in → redirect to signin, saving intended destination
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Admin-only route but user isn't admin → redirect to dashboard
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;