import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('watchCart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      localStorage.removeItem('watchCart'); // clear corrupted data
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('watchCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Refresh cart item prices/stock from server on mount
  useEffect(() => {
    if (cartItems.length === 0) return;
    const API = import.meta.env.VITE_API_URL || '';
    const refreshCart = async () => {
      const updated = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const res = await fetch(`${API}/api/products/${item._id}`);
            if (!res.ok) return item;
            const fresh = await res.json();
            return {
              ...item,
              price: fresh.price,
              stock: fresh.stock,
              name: fresh.name,
              images: fresh.images,
            };
          } catch {
            return item;
          }
        })
      );
      setCartItems(updated);
    };
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on app load

  const addToCart = (product, quantity = 1, openCart = true) => {
    setCartItems(prev => {
      const existing = prev.find(item => item._id === product._id);
      const maxStock = product.stock ?? Infinity;
      // Store only the fields needed for display + ordering
      // This keeps localStorage small and avoids deeply stale product data
      const cartItem = {
        _id:    product._id,
        name:   product.name,
        price:  product.price,
        images: product.images,
        brand:  product.brand,
        stock:  product.stock,
      };
      if (existing) {
        // Clamp at available stock
        const newQty = Math.min(existing.qty + quantity, maxStock);
        return prev.map(item =>
          item._id === product._id ? { ...item, qty: newQty } : item
        );
      }
      return [...prev, { ...cartItem, qty: Math.min(quantity, maxStock) }];
    });
    if (openCart) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item._id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return removeFromCart(id);
    setCartItems(prev => prev.map(item => {
      if (item._id !== id) return item;
      // Clamp at available stock
      const maxStock = item.stock ?? Infinity;
      return { ...item, qty: Math.min(quantity, maxStock) };
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const reloadCartFromStorage = () => {
    try {
      const saved = localStorage.getItem('watchCart');
      if (saved) setCartItems(JSON.parse(saved));
    } catch {
      // Ignore parse errors
    }
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      reloadCartFromStorage,
      cartTotal,
      cartCount,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
