import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const [toast, setToast] = useState({ message: '', error: false });
  const location = useLocation();

  const showToast = (message, error = false) => {
    setToast({ message, error });
    setTimeout(() => {
      setToast({ message: '', error: false });
    }, 4000);
  };

  // Collapse sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname]);

  return (
    <div className="admin-layout">
      {/* Mobile Sidebar Backdrop */}
      {!sidebarCollapsed && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
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
        onSave={() => showToast('Product added! Go to Products page to see it.')}
      />

      <AddCategoryPanel
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        showToast={showToast}
        onSave={() => showToast('Category added! Go to Categories page to see it.')}
      />

      <AddUserPanel
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        showToast={showToast}
        onSave={() => showToast('User added! Go to Users page to see them.')}
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
