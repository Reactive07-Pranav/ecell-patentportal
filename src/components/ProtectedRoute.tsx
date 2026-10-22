import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { COORDINATOR, INSTITUTION } from '../config/constants';
import type { AppRole } from '../types/database.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  allowedRoles?: AppRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, allowedRoles }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '64px 0', textAlign: 'center' }}>
        <p>Verifying university credentials and session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isDenied =
    (requiredRole && currentUser.role !== requiredRole) ||
    (allowedRoles && !allowedRoles.includes(currentUser.role));

  if (isDenied) {
    // If super admin accidentally visits patent inspection, redirect to supervision dashboard
    if (currentUser.role === 'super_admin') {
      return <Navigate to="/superadmin/dashboard" replace />;
    }

    // If coordinator admin accidentally visits student drafting workspace, redirect to coordinator docket
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    // Student attempting to access coordinator console
    return (
      <div className="container" style={{ padding: '64px 0' }}>
        <div
          className="card"
          style={{ maxWidth: '600px', margin: '0 auto', borderColor: 'var(--color-danger-border)' }}
        >
          <div className="card-header" style={{ backgroundColor: 'var(--color-danger-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
              <ShieldAlert size={20} />
              <h3 style={{ margin: 0, color: 'var(--color-danger)' }}>
                Unauthorized Administrative Access
              </h3>
            </div>
          </div>
          <div className="card-body">
            <p style={{ marginBottom: '16px' }}>
              Access to the administrative patent screening console is restricted to Patent Coordinator{' '}
              <strong>{COORDINATOR.FULL_NAME}</strong> and authorized officers of the {INSTITUTION.DEPARTMENTS.IPR_CELL}.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Current signed-in account: <strong>{currentUser.university_email}</strong> ({currentUser.role}).
            </p>
          </div>
          <div className="card-footer">
            <Link to="/dashboard" className="btn btn-outline">
              Return to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
