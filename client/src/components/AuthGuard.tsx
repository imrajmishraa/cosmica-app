import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'hsl(var(--bg-primary))',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="animate-spin"
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.05)',
              borderTopColor: 'hsl(var(--primary))',
              borderRadius: '50%',
              margin: '0 auto 16px',
            }}
          />
          <p
            className="animate-pulse-glow"
            style={{
              color: 'hsl(var(--text-secondary))',
              fontSize: '15px',
              fontWeight: 500,
            }}
          >
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const GuestGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
