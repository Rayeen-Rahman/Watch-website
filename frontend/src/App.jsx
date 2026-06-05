import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './admin/layouts/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import CustomerLayout from './customer/layouts/CustomerLayout';
import ProtectedAdminRoute from './admin/components/ProtectedAdminRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Login — public, must be BEFORE the wildcard customer route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Dashboard — protected, admin role required */}
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
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
