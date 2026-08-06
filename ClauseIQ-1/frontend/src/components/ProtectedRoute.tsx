import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-400 font-medium animate-pulse">Initializing ClauseIQ...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page but save current location for potential return
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user && !user.is_admin) {
    // Redirect general users to their dashboard if trying to hit admin
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
