import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ArrowLeft, CheckCircle, ShoppingBag } from 'lucide-react';
import './Checkout.css';

const API = import.meta.env.VITE_API_URL;

/** Resolve /uploads paths to absolute backend URL */
const resolveImg = (url) =>
  url?.startsWith('/uploads') ? `${API}${url}` : url;

const Checkout = () => {
  const { cartItems, cartTotal, clearCart, setIsCartOpen } = useCart();
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

  // Close cart panel + redirect empty carts
  useEffect(() => {
    setIsCartOpen(false);
    if (cartItems.length === 0) navigate('/');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length]);

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
    } else if (!/^[+]?[\d\s\-()]{7,15}$/.test(formData.phone.trim())) {
      errs.phone = 'Enter a valid phone number';
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

    const orderPayload = {
      customerName: formData.customerName.trim(),
      phone: formData.phone.trim(),
      address: [formData.address, formData.city, formData.postalCode]
        .filter(Boolean).join(', '),
      products: cartItems.map(item => ({
        product: item._id,
        quantity: item.qty,
        price: item.price,
      })),
      total: cartTotal,
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
      clearCart();
      navigate('/success');
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) return null;

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
              {cartItems.map(item => {
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
                <span>Subtotal ({cartItems.reduce((a, i) => a + i.qty, 0)} items)</span>
                <span>৳{cartTotal.toLocaleString()}</span>
              </div>
              <div className="total-row">
                <span>Shipping</span>
                <span className="free-shipping">Free</span>
              </div>
              <div className="total-row final-total">
                <span>Total</span>
                <span>৳{cartTotal.toLocaleString()}</span>
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
