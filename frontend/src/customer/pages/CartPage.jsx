import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <ShoppingBag size={64} strokeWidth={1} className="cart-empty-icon" />
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any watches yet.</p>
        <Link to="/category/all" className="btn-cart-shop">Browse Collection</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1 className="cart-heading">
          <ShoppingBag size={24} strokeWidth={1.5} /> Shopping Cart
          <span className="cart-count-label">({cartCount} item{cartCount !== 1 ? 's' : ''})</span>
        </h1>

        <div className="cart-layout">
          {/* ── Item List ─────────────────────────────────────── */}
          <div className="cart-items">
            {cartItems.map(item => {
              const img = item.images?.[0]
                ? (item.images[0].startsWith('/uploads')
                  ? `${API}${item.images[0]}`
                  : item.images[0])
                : null;

              return (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-img-wrap">
                    {img
                      ? <img src={img} alt={item.name} className="cart-item-img" />
                      : <div className="cart-item-img-placeholder" />
                    }
                  </div>

                  <div className="cart-item-info">
                    <Link to={`/product/${item._id}`} className="cart-item-name">
                      {item.name}
                    </Link>
                    {item.brand && <p className="cart-item-brand">{item.brand}</p>}
                    <p className="cart-item-price">৳{(item.price ?? 0).toLocaleString()}</p>
                  </div>

                  <div className="cart-item-actions">
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item._id, item.qty - 1)}
                        disabled={item.qty <= 1}
                        aria-label="Decrease"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="qty-value">{item.qty}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item._id, item.qty + 1)}
                        aria-label="Increase"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <p className="cart-item-subtotal">
                      ৳{((item.price ?? 0) * item.qty).toLocaleString()}
                    </p>

                    <button
                      className="cart-remove-btn"
                      onClick={() => removeFromCart(item._id)}
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Order Summary ─────────────────────────────────── */}
          <div className="cart-summary">
            <h3 className="summary-heading">Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>৳{cartTotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span className="summary-free">
                {cartTotal >= 2000 ? 'FREE' : '৳80'}
              </span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>৳{(cartTotal + (cartTotal >= 2000 ? 0 : 80)).toLocaleString()}</span>
            </div>

            <Link to="/checkout" className="btn-checkout">
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
            <Link to="/category/all" className="btn-continue-shopping">
              ← Continue Shopping
            </Link>

            {cartTotal < 2000 && (
              <p className="free-delivery-hint">
                Add ৳{(2000 - cartTotal).toLocaleString()} more for free delivery!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
