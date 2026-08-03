// src/router/ProtectedRoute.jsx
// -----------------------------------------------------------------------
// Wraps any route that requires authentication. Centralising this
// check here means individual pages (Dashboard, ChatPage, etc.) never
// need to know about auth state at all - they simply render, trusting
// this wrapper already confirmed the user is logged in.
// -----------------------------------------------------------------------

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Loader } from '../components/common/Loader.jsx';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Avoid a flash-redirect to /login while we're still checking for
    // an existing session cookie on app load.
    return (
      <div className="flex h-screen items-center justify-center bg-void">
        <Loader label="Waking up Nova..." />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
