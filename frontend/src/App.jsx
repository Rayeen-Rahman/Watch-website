import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './admin/layouts/AdminLayout';
import CustomerLayout from './customer/layouts/CustomerLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer Site Routes (Delegated to layout) */}
        <Route path="/*" element={<CustomerLayout />} />
        
        {/* Admin Dashboard Routes */}
        <Route path="/admin/*" element={<AdminLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
