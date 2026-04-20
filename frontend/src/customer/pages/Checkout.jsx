import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ArrowLeft } from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, cartTotal, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Make sure to close the cart panel automatically if they landed here
  useEffect(() => {
    setIsCartOpen(false);
    if (cartItems.length === 0) {
      navigate('/');
    }
  }, [cartItems, navigate, setIsCartOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const orderPayload = {
      customerName: formData.customerName,
      phone: formData.phone,
      shippingAddress: {
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode
      },
      items: cartItems.map(item => ({
        product: item._id, // Must match product ID backend
        qty: item.qty
      })),
      paymentMethod: 'COD',
      total: cartTotal
    };

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to place order');
      
      // Successfully pushed to Database! Navigate to Success logic
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
        
        {/* Left Side: Forms */}
        <div className="checkout-form-section">
          <Link to="/" className="breadcrumb-back"><ArrowLeft size={16}/> Back to Store</Link>
          <h1 className="checkout-title">Checkout</h1>
          
          {error && <div className="checkout-error">{error}</div>}

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Contact Information</h3>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="customerName" required value={formData.customerName} onChange={handleChange} placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            <div className="form-section">
              <h3>Shipping Address</h3>
              <div className="form-group">
                <label>Street Address</label>
                <input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="123 Main St, Apt 4B" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input type="text" name="city" required value={formData.city} onChange={handleChange} placeholder="New York" />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input type="text" name="postalCode" required value={formData.postalCode} onChange={handleChange} placeholder="10001" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Payment Method</h3>
              <div className="payment-method-box">
                <div className="radio-select">
                  <input type="radio" id="cod" name="payment" checked readOnly />
                  <label htmlFor="cod">Cash on Delivery (COD)</label>
                </div>
                <p className="payment-note">Pay with cash upon delivery. No credit card required.</p>
              </div>
            </div>

            <button type="submit" className="btn-confirm-order" disabled={isSubmitting}>
              {isSubmitting ? 'PROCESSING...' : 'CONFIRM ORDER'}
            </button>
          </form>
        </div>

        {/* Right Side: Order Summary */}
        <div className="checkout-summary-section">
          <div className="summary-card">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item._id} className="summary-item">
                  <div className="summary-img">
                    {item.images && item.images[0] ? <img src={item.images[0]} alt={item.name} /> : <div>No Img</div>}
                    <span className="summary-qty-badge">{item.qty}</span>
                  </div>
                  <div className="summary-details">
                    <h4>{item.name}</h4>
                    <p>${(item.price * item.qty).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-totals">
              <div className="total-row"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
              <div className="total-row"><span>Shipping</span><span>Free</span></div>
              <div className="total-row final-total"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
