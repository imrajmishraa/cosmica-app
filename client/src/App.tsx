import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { AssetProvider } from './context/AssetContext.js';
import { AuthGuard, GuestGuard, AdminGuard } from './components/AuthGuard.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { Dashboard } from './pages/Dashboard.js';
import { AdminDashboard } from './pages/AdminDashboard.js';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AssetProvider>
        <BrowserRouter>
          <Routes>
            {/* Authenticated route */}
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />

            {/* Admin route */}
            <Route
              path="/admin"
              element={
                <AuthGuard>
                  <AdminGuard>
                    <AdminDashboard />
                  </AdminGuard>
                </AuthGuard>
              }
            />

            {/* Guest routes */}
            <Route
              path="/login"
              element={
                <GuestGuard>
                  <Login />
                </GuestGuard>
              }
            />
            <Route
              path="/register"
              element={
                <GuestGuard>
                  <Register />
                </GuestGuard>
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AssetProvider>
    </AuthProvider>
  );
};

export default App;
