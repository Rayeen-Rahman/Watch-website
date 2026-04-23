import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './admin/layouts/AdminLayout';
import CustomerLayout from './customer/layouts/CustomerLayout';
import ProtectedAdminRoute from './admin/components/ProtectedAdminRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer Site Routes */}
        <Route path="/*" element={<CustomerLayout />} />

        {/* Admin Dashboard Routes — Step 18: protected */}
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
