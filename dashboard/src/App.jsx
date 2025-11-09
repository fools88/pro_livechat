// /dashboard/src/App.jsx

import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom'; // (A) Import "Rute"

// Lazy-load halaman untuk mengurangi initial bundle
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'))
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'))
import ProtectedRoute from './components/ProtectedRoute';
import AuthRedirect from './components/AuthRedirect';
const WebsitePage = React.lazy(() => import('./pages/WebsitePage'))
const AIPage = React.lazy(() => import('./pages/AIPage'))
const TeamPage = React.lazy(() => import('./pages/TeamPage'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'))

function App() {
  return (
    <div className="app-container">
      <Suspense fallback={<div className="loading">Loading…</div>}>
        <Routes>

        {/* 1. Rute Auth (Login & Register) - Dijaga AuthRedirect */}
        <Route path="/login" element={
          <AuthRedirect>
            <LoginPage />
          </AuthRedirect>
        } />

        <Route path="/register" element={
          <AuthRedirect>
            <RegisterPage />
          </AuthRedirect>
        } />

        <Route path="/settings/websites" element={ // <-- RUTE BARU
          <ProtectedRoute>
            <WebsitePage />
          </ProtectedRoute>
        } />

        {/* 2. Rute Protected (Dashboard) - Dijaga ProtectedRoute */}
        {/* SEMUA RUTE PENTING DIBUNGKUS DENGAN ProtectedRoute */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/settings/ai" element={ // <-- RUTE BARU
          <ProtectedRoute>
            <AIPage />
          </ProtectedRoute>
        } />

        <Route path="/settings/team" element={ // <-- RUTE BARU
          <ProtectedRoute>
            <TeamPage />
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />

        {/* 3. Rute 404 */}
        <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;