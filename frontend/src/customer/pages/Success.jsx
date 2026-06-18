import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Clock, ArrowRight, ShoppingBag } from 'lucide-react';
import './Success.css';

const Success = () => {
  const [animate, setAnimate] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const placed = sessionStorage.getItem('orderPlaced');
    if (!placed) {
      // No valid order — redirect home and replace history so back button
      // doesn't loop back to this page
      navigate('/', { replace: true });
      return;
    }
    // Consume the flag immediately
    sessionStorage.removeItem('orderPlaced');
    setAllowed(true);
    // Trigger entrance animation after mount
    requestAnimationFrame(() => setAnimate(true));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Don't render anything until guard passes — prevents flash + back-button replay
  if (!allowed) return null;

  return (
    <div className={`success-page ${animate ? 'success-visible' : ''}`}>

      {/* ── Animated check icon ─────────────────────────────────────────── */}
      <div className="success-icon-ring">
        <CheckCircle size={56} strokeWidth={1.5} className="success-check" />
      </div>

      {/* ── Heading ────────────────────────────────────────────────────── */}
      <h1 className="success-heading">Order Confirmed!</h1>
      <p className="success-sub">
        Your timepiece is on its way. You'll receive it shortly via Cash on Delivery.
      </p>

      {/* ── Info cards ─────────────────────────────────────────────────── */}
      <div className="success-cards">
        <div className="success-card">
          <Package size={24} strokeWidth={1.5} />
          <div>
            <strong>Being Packaged</strong>
            <span>Our team is preparing your order with care.</span>
          </div>
        </div>
        <div className="success-card">
          <Clock size={24} strokeWidth={1.5} />
          <div>
            <strong>Delivery ETA</strong>
            <span>3–5 business days within Bangladesh.</span>
          </div>
        </div>
        <div className="success-card">
          <ShoppingBag size={24} strokeWidth={1.5} />
          <div>
            <strong>Cash on Delivery</strong>
            <span>No payment needed until your order arrives.</span>
          </div>
        </div>
      </div>

      {/* ── CTA buttons ────────────────────────────────────────────────── */}
      <div className="success-actions">
        <Link to="/" className="btn-success-primary">
          Continue Shopping <ArrowRight size={16} />
        </Link>
        <Link to="/category/all" className="btn-success-ghost">
          Browse Collection
        </Link>
      </div>

      <p className="success-note">
        Questions? Email us at <strong>rayeenrahman1@gmail.com</strong> or call <strong>+880-1716950416</strong>.{' '}
        <Link to="/info/contact" style={{ color: 'inherit', textDecoration: 'underline' }}>Contact page →</Link>
      </p>
    </div>
  );
};

export default Success;
