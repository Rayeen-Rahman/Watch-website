import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CartPanel.css';

const CartPanel = () => {
  const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-slide-panel" onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h3>Your Bag ({cartItems.length})</h3>
          <button className="cart-close-btn" onClick={() => setIsCartOpen(false)}><X size={20} /></button>
        </div>

        <div className="cart-items-container">
          {cartItems.length === 0 ? (
            <div className="cart-empty-message">Your shopping bag is currently empty.</div>
          ) : (
            cartItems.map(item => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-img">
                  {item.images && item.images[0] ? <img src={item.images[0]} alt={item.name} /> : <div className="cart-no-img">No Img</div>}
                </div>
                <div className="cart-item-details">
                  <div className="cart-item-top">
                    <h4>{item.name}</h4>
                    <button className="cart-item-remove" aria-label="Remove item" onClick={() => removeFromCart(item._id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="cart-item-price">${item.price.toFixed(2)}</p>
                  <div className="cart-item-qty">
                    <button onClick={() => updateQuantity(item._id, item.qty - 1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQuantity(item._id, item.qty + 1)}>+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total-row">
            <span>Subtotal</span>
            <strong>${cartTotal.toFixed(2)}</strong>
          </div>
          <p className="cart-disclaimer">Shipping & taxes calculated at checkout</p>
          <button
            className="btn-checkout"
            disabled={cartItems.length === 0}
            onClick={() => {
              setIsCartOpen(false);
              navigate('/checkout'); // Ready for Step 15
            }}
          >
            GO TO CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPanel;
