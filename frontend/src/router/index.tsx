import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';
import { Sidebar } from '../components/layout/Sidebar';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { FleetPage } from '../pages/FleetPage';
import { DriversPage } from '../pages/DriversPage';
import { TripsPage } from '../pages/TripsPage';
import { MaintenancePage } from '../pages/MaintenancePage';
import { FuelExpensePage } from '../pages/FuelExpensePage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const role = useAuthStore(s => s.role);
  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/fleet"
                  element={
                    <RoleRoute roles={['Fleet Manager', 'Dispatcher', 'Safety Officer']}>
                      <FleetPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/drivers"
                  element={
                    <RoleRoute roles={['Fleet Manager', 'Safety Officer']}>
                      <DriversPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/trips"
                  element={
                    <RoleRoute roles={['Fleet Manager', 'Dispatcher']}>
                      <TripsPage />
                    </RoleRoute>
                  }
                />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route
                  path="/fuel"
                  element={
                    <RoleRoute roles={['Fleet Manager', 'Financial Analyst']}>
                      <FuelExpensePage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <RoleRoute roles={['Fleet Manager', 'Financial Analyst']}>
                      <ReportsPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RoleRoute roles={['Fleet Manager']}>
                      <SettingsPage />
                    </RoleRoute>
                  }
                />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
