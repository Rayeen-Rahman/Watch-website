import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './customer/context/CartContext.jsx';
import { CategoryProvider } from './context/CategoryContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CategoryProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </CategoryProvider>
    </AuthProvider>
  </React.StrictMode>
);
