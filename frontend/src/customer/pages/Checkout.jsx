import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, CheckCircle, ShoppingBag } from 'lucide-react';
import './Checkout.css';

import { API, resolveImg } from '../../utils/api';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart, setIsCartOpen } = useCart();
  const { user, token, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  useEffect(() => {
    const hasData = Object.values(formData).some(v => v.trim().length > 0);
    if (!hasData || orderSubmitted) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, orderSubmitted]);

  // BUY NOW mode: read a single item from sessionStorage instead of full cart
  const isBuyNow = new URLSearchParams(window.location.search).get('mode') === 'buynow';
  const buyNowRaw = sessionStorage.getItem('buyNowItem');
  const buyNowItem = buyNowRaw ? JSON.parse(buyNowRaw) : null;
  // The items we actually check out: either just the Buy Now product, or the full cart
  const checkoutItems = isBuyNow && buyNowItem
    ? [{ ...buyNowItem.product, qty: buyNowItem.quantity }]
    : cartItems;
  const checkoutTotal = checkoutItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // Close cart panel + redirect empty carts
  useEffect(() => {
    setIsCartOpen(false);
    // Only redirect to home if cart is empty AND we have NOT just submitted an order
    // The 500ms delay prevents the race condition where clearCart fires before
    // navigate('/success') has been called by handleSubmit
    if (checkoutItems.length === 0 && !orderSubmitted) {
      const timer = setTimeout(() => navigate('/'), 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutItems.length, orderSubmitted]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  // ── Step 32: Client-side validation ─────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!formData.customerName.trim()) errs.customerName = 'Name is required';
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^(\+?880|0)[1-9]\d{8,9}$/.test(formData.phone.trim().replace(/[\s\-()]/g, ''))) {
      errs.phone = 'Enter a valid Bangladeshi phone number (e.g. 01700000000)';
    }
    if (!formData.address.trim()) errs.address = 'Address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate first
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setIsSubmitting(true);

    // B-04 fix: city-aware shipping cost (matches InfoPage shipping info)
    const isInsideDhaka = formData.city.trim().toLowerCase().includes('dhaka');
    const shippingCost  = checkoutTotal >= 2000 ? 0 : (isInsideDhaka ? 80 : 120);

    const orderPayload = {
      customerName: formData.customerName.trim(),
      phone: formData.phone.trim(),
      address: [formData.address, formData.city, formData.postalCode]
        .filter(Boolean).join(', '),
      products: checkoutItems.map(item => ({
        product:  item._id,
        name:     item.name || 'Watch',  // B-06 fix: persist name at order time
        quantity: item.qty,
        price:    item.price,
      })),
      total: checkoutTotal + shippingCost,
    };

    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order');

      // ── Step 32: Clear cart after successful order ─────────────────────────
      setOrderSubmitted(true);
      if (isBuyNow) {
        sessionStorage.removeItem('buyNowItem');
      } else {
        clearCart();
      }
      sessionStorage.setItem('orderPlaced', 'true');
      sessionStorage.setItem('lastOrderId', data._id || '');

      // Auto-save the checkout phone to user profile if logged in and no phone saved yet
      if (user && token && !user.phone && formData.phone) {
        try {
          const profileRes = await fetch(`${API}/api/users/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: user.name, email: user.email, phone: formData.phone }),
          });
          if (profileRes.ok) {
            const updated = await profileRes.json();
            login({ ...user, phone: updated.phone || formData.phone }, token);
          }
        } catch (e) {
          // Non-critical — order already placed, just couldn't save phone
          console.warn('Could not auto-save phone to profile:', e);
        }
      }

      navigate('/success');
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (checkoutItems.length === 0) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-container">

        {/* ── Left: Forms ──────────────────────────────────────────────────── */}
        <div className="checkout-form-section">
          <Link to="/" className="breadcrumb-back">
            <ArrowLeft size={16} /> Back to Store
          </Link>
          <h1 className="checkout-title">Checkout</h1>

          {error && <div className="checkout-error">⚠ {error}</div>}

          <form className="checkout-form" onSubmit={handleSubmit} noValidate>

            {/* Contact */}
            <div className="form-section">
              <h3>Contact Information</h3>
              <div className={`form-group ${fieldErrors.customerName ? 'field-error' : ''}`}>
                <label>Full Name *</label>
                <input type="text" name="customerName"
                  value={formData.customerName} onChange={handleChange}
                  placeholder="John Doe" />
                {fieldErrors.customerName && (
                  <span className="field-error-msg">{fieldErrors.customerName}</span>
                )}
              </div>
              <div className={`form-group ${fieldErrors.phone ? 'field-error' : ''}`}>
                <label>Phone Number *</label>
                <input type="tel" name="phone"
                  value={formData.phone} onChange={handleChange}
                  placeholder="+880 1700 000000" />
                {fieldErrors.phone && (
                  <span className="field-error-msg">{fieldErrors.phone}</span>
                )}
              </div>
            </div>

            {/* Shipping */}
            <div className="form-section">
              <h3>Shipping Address</h3>
              <div className={`form-group ${fieldErrors.address ? 'field-error' : ''}`}>
                <label>Street Address *</label>
                <input type="text" name="address"
                  value={formData.address} onChange={handleChange}
                  placeholder="House 12, Road 5, Block B" />
                {fieldErrors.address && (
                  <span className="field-error-msg">{fieldErrors.address}</span>
                )}
              </div>
              <div className="form-row">
                <div className={`form-group ${fieldErrors.city ? 'field-error' : ''}`}>
                  <label>City *</label>
                  <input type="text" name="city"
                    value={formData.city} onChange={handleChange}
                    placeholder="Dhaka" />
                  {fieldErrors.city && (
                    <span className="field-error-msg">{fieldErrors.city}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input type="text" name="postalCode"
                    value={formData.postalCode} onChange={handleChange}
                    placeholder="1212" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="form-section">
              <h3>Payment Method</h3>
              <div className="payment-method-box">
                <div className="radio-select">
                  <input type="radio" id="cod" name="payment" checked readOnly />
                  <label htmlFor="cod">Cash on Delivery (COD)</label>
                </div>
                <p className="payment-note">
                  Pay with cash upon delivery. No credit card required.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn-confirm-order"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="btn-spinner">Processing…</span>
              ) : (
                <><CheckCircle size={18} /> CONFIRM ORDER</>
              )}
            </button>
          </form>
        </div>

        {/* ── Right: Order Summary ─────────────────────────────────────────── */}
        <div className="checkout-summary-section">
          <div className="summary-card">
            <h3>
              <ShoppingBag size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Order Summary
            </h3>
            <div className="summary-items">
              {checkoutItems.map(item => {
                const imgSrc = resolveImg(item.images?.[0]);
                return (
                  <div key={item._id} className="summary-item">
                    <div className="summary-img">
                      {imgSrc
                        ? <img src={imgSrc} alt={item.name} />
                        : <div className="summary-img-placeholder">
                          {(item.brand || item.name || 'W').charAt(0)}
                        </div>
                      }
                      <span className="summary-qty-badge">{item.qty}</span>
                    </div>
                    <div className="summary-details">
                      <h4>{item.name}</h4>
                      {item.brand && <p className="summary-brand">{item.brand}</p>}
                      <p>৳{(item.price * item.qty).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="summary-totals">
              <div className="total-row">
                <span>Subtotal ({checkoutItems.reduce((a, i) => a + i.qty, 0)} items)</span>
                <span>৳{checkoutTotal.toLocaleString()}</span>
              </div>
              <div className="total-row">
                <span>
                  Delivery
                  {formData.city.trim() && (
                    <small style={{ display:'block', color:'#999', fontSize:'0.72rem' }}>
                      {formData.city.trim().toLowerCase().includes('dhaka') ? 'Inside Dhaka' : 'Outside Dhaka'}
                    </small>
                  )}
                </span>
                <span className={checkoutTotal >= 2000 ? 'free-shipping' : ''}>
                  {checkoutTotal >= 2000
                    ? 'FREE'
                    : !formData.city.trim()
                    ? 'Enter city'
                    : `৳${formData.city.trim().toLowerCase().includes('dhaka') ? 80 : 120}`}
                </span>
              </div>
              <div className="total-row final-total">
                <span>Total</span>
                <span>
                  {checkoutTotal >= 2000
                    ? `৳${checkoutTotal.toLocaleString()} (Free shipping)`
                    : !formData.city.trim()
                    ? `৳${(checkoutTotal + 80).toLocaleString()} (estimated)`
                    : `৳${(checkoutTotal + (formData.city.trim().toLowerCase().includes('dhaka') ? 80 : 120)).toLocaleString()}`
                  }
                </span>
              </div>
            </div>

            <p className="checkout-guarantee">
              🔒 Secure checkout · Cash on Delivery
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
