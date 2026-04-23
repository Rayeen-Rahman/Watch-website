import React, { useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Products from '../pages/Products';
import Users from '../pages/Users';
import Orders from '../pages/Orders';
import Categories from '../pages/Categories';
import Inventory from '../pages/Inventory';
import DashboardHome from '../pages/DashboardHome';
import AddProductPanel from '../components/AddProductPanel';
import AddCategoryPanel from '../components/AddCategoryPanel';
import AddUserPanel from '../components/AddUserPanel';
import '../adminTheme.css';

const AdminLayout = () => {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState({ message: '', error: false });

  const showToast = (message, error = false) => {
    setToast({ message, error });
    setTimeout(() => {
      setToast({ message: '', error: false });
    }, 4000);
  };

  return (
    <div className="admin-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
        onOpenAddCategory={() => setIsAddCategoryOpen(true)}
        onOpenAddUser={() => setIsAddUserOpen(true)}
      />
      <div className="admin-main">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<DashboardHome showToast={showToast} />} />
            <Route path="/products"   element={<Products   showToast={showToast} />} />
            <Route path="/users"      element={<Users      showToast={showToast} />} />
            <Route path="/orders"     element={<Orders     showToast={showToast} />} />
            <Route path="/categories" element={<Categories showToast={showToast} />} />
            <Route path="/inventory"  element={<Inventory  showToast={showToast} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>

      <AddProductPanel
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        showToast={showToast}
      />

      <AddCategoryPanel
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        showToast={showToast}
      />

      <AddUserPanel
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        showToast={showToast}
      />

      {toast.message && (
        <div className={`toast-notification ${toast.error ? 'toast-error' : ''}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
