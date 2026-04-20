import React, { useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Products from '../pages/Products';
import Users from '../pages/Users';
import Orders from '../pages/Orders';
import DashboardHome from '../pages/DashboardHome';
import AddProductPanel from '../components/AddProductPanel';
import AddCategoryPanel from '../components/AddCategoryPanel';
import '../adminTheme.css';

const AdminLayout = () => {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', error: false });

  const showToast = (message, error = false) => {
    setToast({ message, error });
    setTimeout(() => {
      setToast({ message: '', error: false });
    }, 4000); // Hide after 4s
  };

  return (
    <div className="admin-layout">
      <Sidebar 
        onOpenAddProduct={() => setIsAddProductOpen(true)} 
        onOpenAddCategory={() => setIsAddCategoryOpen(true)} 
      />
      <div className="admin-main">
        <Header />
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/products" element={<Products />} />
            <Route path="/users" element={<Users />} />
            <Route path="/orders" element={<Orders />} />
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

      {toast.message && (
        <div className={`toast-notification ${toast.error ? 'toast-error' : ''}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
