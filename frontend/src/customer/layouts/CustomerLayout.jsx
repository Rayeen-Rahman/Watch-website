import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Homepage from '../pages/Homepage';
import ProductDetail from '../pages/ProductDetail';
import CategoryPage from '../pages/CategoryPage';
import Checkout from '../pages/Checkout';
import Success from '../pages/Success';
import CartPanel from '../components/CartPanel';
import { CartProvider } from '../context/CartContext';
import '../customerTheme.css';

const CustomerLayout = () => {
  // Apply a body class specifically for the customer layout so CSS rules don't bleed into Admin Dashboard
  useEffect(() => {
    document.body.classList.add('customer-view');
    return () => {
      document.body.classList.remove('customer-view');
    }
  }, []);

  return (
    <CartProvider>
      <div className="store-layout">
        <Navbar />
        <main className="store-main">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<Success />} />
          </Routes>
        </main>
        <Footer />
        <CartPanel />
      </div>
    </CartProvider>
  );
};

export default CustomerLayout;
