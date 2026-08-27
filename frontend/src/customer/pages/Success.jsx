import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Clock, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Success.css';

const Success = () => {
  const [animate, setAnimate] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();
  const [oid, setOid] = useState('');
  const [trackingToken, setTrackingToken] = useState('');
  const { reloadCartFromStorage } = useCart();

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
    const orderId = sessionStorage.getItem('lastOrderId') || '';
    if (orderId) {
      setOid(orderId);
      sessionStorage.removeItem('lastOrderId');
    }
    const tToken = sessionStorage.getItem('lastOrderTrackingToken');
    if (tToken) {
      setTrackingToken(tToken);
      sessionStorage.removeItem('lastOrderTrackingToken');
    }
    setAllowed(true);

    // Restore cart if it was saved during Buy Now AND we actually completed it (Bug #25)
    const completedBuyNow = sessionStorage.getItem("completedBuyNow");
    const saved = sessionStorage.getItem("savedCartBeforeBuyNow");
    if (completedBuyNow === "true" && saved) {
      localStorage.setItem("watchCart", saved);
      reloadCartFromStorage();   // ← update React state immediately
    }
    // Always clean up the flags
    sessionStorage.removeItem("savedCartBeforeBuyNow");
    sessionStorage.removeItem("completedBuyNow");

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
      {oid && (
        <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '-8px', marginBottom: '16px' }}>
          Order Reference: <strong style={{ color: '#333' }}>#{oid.slice(-8).toUpperCase()}</strong>
        </p>
      )}
      {trackingToken && (
        <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '8px', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px auto', border: '1px solid #e0e0e0' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#555' }}>Your Guest Tracking Token:</p>
          <code style={{ display: 'block', fontSize: '1rem', color: '#111', fontWeight: 'bold', userSelect: 'all', padding: '8px', background: '#fff', borderRadius: '4px', border: '1px dashed #ccc' }}>{trackingToken}</code>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#888' }}>Please save this token. You will need it to track your order.</p>
        </div>
      )}
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
        <Link to="/orders" className="btn-success-primary">
          Track My Order <ArrowRight size={16} />
        </Link>
        <Link to="/" className="btn-success-ghost">
          Continue Shopping
        </Link>
        <Link to="/category/all" className="btn-success-ghost">
          Browse Collection
        </Link>
      </div>

      <p className="success-note">
        Questions? Email us at <strong>support@artifactbd.com</strong> or call <strong>+880-1716950416</strong>.{' '}
        <Link to="/info/contact" style={{ color: 'inherit', textDecoration: 'underline' }}>Contact page →</Link>
      </p>
    </div>
  );
};

export default Success;
