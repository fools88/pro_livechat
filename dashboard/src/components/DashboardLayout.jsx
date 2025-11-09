// /dashboard/src/components/DashboardLayout.jsx
// (VERSI V12 - FINAL - FIX DUPLIKAT)

import React, { Suspense } from 'react';

const DashboardSidebar = React.lazy(() => import('./DashboardSidebar'));
const DashboardHeader = React.lazy(() => import('./DashboardHeader'));

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Suspense fallback={<div className="sidebar-placeholder" />}>
        <DashboardSidebar />
      </Suspense>

      <div className="content-wrapper">
        <Suspense fallback={<header className="main-header"><div className="header-title"><h3>Pro Chat Admin</h3></div></header>}>
          <DashboardHeader />
        </Suspense>

        <main className="main-content">
          {children}
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;