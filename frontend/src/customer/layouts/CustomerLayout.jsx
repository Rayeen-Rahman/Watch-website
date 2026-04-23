import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Homepage from '../pages/Homepage';
import ProductDetail from '../pages/ProductDetail';
import CategoryPage from '../pages/CategoryPage';
import CartPage from '../pages/CartPage';
import Checkout from '../pages/Checkout';
import Success from '../pages/Success';
import OrderHistoryPage from '../pages/OrderHistoryPage';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';
import CartPanel from '../components/CartPanel';
import '../customerTheme.css';

const CustomerLayout = () => {
  // Apply a body class specifically for the customer layout so CSS rules don't bleed into Admin Dashboard
  useEffect(() => {
    document.body.classList.add('customer-view');
    return () => {
      document.body.classList.remove('customer-view');
    };
  }, []);

  return (
    <div className="store-layout">
      <Navbar />
      <main className="store-main">
        <Routes>
          <Route path="/"                element={<Homepage />} />
          <Route path="/product/:id"     element={<ProductDetail />} />
          <Route path="/category/:slug"  element={<CategoryPage />} />
          <Route path="/category"        element={<CategoryPage />} />
          <Route path="/cart"            element={<CartPage />} />
          <Route path="/checkout"        element={<Checkout />} />
          <Route path="/success"         element={<Success />} />
          <Route path="/orders"          element={<OrderHistoryPage />} />
          <Route path="/profile"         element={<ProfilePage />} />
          <Route path="*"               element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <CartPanel />
    </div>
  );
};

export default CustomerLayout;
