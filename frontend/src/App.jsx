import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './admin/layouts/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import CustomerLayout from './customer/layouts/CustomerLayout';
import ProtectedAdminRoute from './admin/components/ProtectedAdminRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer Site Routes */}
        <Route path="/*" element={<CustomerLayout />} />

        {/* Admin Login — public, no auth required */}
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
      </Routes>
    </Router>
  );
}

export default App;
