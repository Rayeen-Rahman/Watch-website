import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerLayout from './customer/layouts/CustomerLayout';
import ProtectedAdminRoute from './admin/components/ProtectedAdminRoute';
import ScrollToTop from './ScrollToTop';

const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin'));

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Admin Login — public, must be BEFORE the wildcard customer route */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>Loading Login...</div>}>
              <AdminLogin />
            </Suspense>
          }
        />

        {/* Admin Dashboard — protected, admin role required */}
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>Loading Dashboard...</div>}>
                <AdminLayout />
              </Suspense>
            </ProtectedAdminRoute>
          }
        />

        {/* Customer Site Routes — wildcard MUST come last */}
        <Route path="/*" element={<CustomerLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
