import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, PhoneCall } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './OrderHistoryPage.css';

import { API } from '../../utils/api';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: '#F59E0B', Icon: Clock },
  processing: { label: 'Processing', color: '#6366F1', Icon: Package },
  shipped:    { label: 'Shipped',    color: '#3B82F6', Icon: Truck },
  delivered:  { label: 'Delivered',  color: '#22C55E', Icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: '#EF4444', Icon: XCircle },
  failed:     { label: 'Cancelled',  color: '#EF4444', Icon: XCircle },
};

/* Renders a list of order cards — used both for authenticated and guest views */
function renderOrderList(orders) {
  return orders.map(order => {
    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const StatusIcon = cfg.Icon;
    // Support current schema (products[]) and any legacy shape (orderItems[])
    const items = order.products || order.orderItems || [];
    return (
      <div key={order._id} className="order-card">
        <div className="order-card-header">
          <div>
            <p className="order-id">Order #{order._id.slice(-8).toUpperCase()}</p>
            <p className="order-date">
              {new Date(order.createdAt).toLocaleDateString('en-BD', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <span className="order-status-badge" style={{ color: cfg.color, borderColor: cfg.color }}>
            <StatusIcon size={13} /> {cfg.label}
          </span>
        </div>

        <div className="order-items-preview">
          {items.slice(0, 3).map((item, i) => {
            // Schema: { product: ObjectId, quantity, price } — populated name comes via .populate()
            const name  = item.name || item.product?.name || 'Watch';
            const qty   = item.quantity ?? item.qty ?? 1;
            const price = item.price ?? 0;
            return (
              <div key={i} className="order-item-row">
                <span className="order-item-name">{name}</span>
                <span className="order-item-qty">× {qty}</span>
                <span className="order-item-price">৳{(price * qty).toLocaleString()}</span>
              </div>
            );
          })}
          {items.length > 3 && (
            <p className="order-more">+{items.length - 3} more items</p>
          )}
        </div>

        <div className="order-card-footer">
          <span className="order-payment">COD</span>
          {/* Support both field names: total (current schema) and totalPrice (legacy) */}
          <span className="order-total">
            Total: <strong>৳{(order.total ?? order.totalPrice ?? 0).toLocaleString()}</strong>
          </span>
        </div>
      </div>
    );
  });
}

const OrderHistoryPage = () => {
  const { user, token, handleUnauthorized } = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [trackingToken, setTrackingToken] = useState('');
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('token'); // 'token' or 'phone'
  const [orderIdInput, setOrderIdInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  useEffect(() => {
    const prefilledToken = sessionStorage.getItem('lastOrderTrackingToken');
    if (prefilledToken && !user) {
      setTrackingToken(prefilledToken);
      sessionStorage.removeItem('lastOrderTrackingToken');
    }
  }, [user]);

  useEffect(() => {
    if (!token || !user) { setLoading(false); return; }

    // Admins see all orders
    if (user.role === 'admin') {
      fetch(`${API}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => {
          if (r.status === 401) { handleUnauthorized(); throw new Error('Session expired'); }
          if (!r.ok) throw new Error('Failed to load orders');
          return r.json();
        })
        .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
        .catch((err) => { setError(err.message === 'Session expired' ? 'Session expired — please log in again.' : 'Failed to load orders'); setLoading(false); });
    } else {
      // Regular customers: GET /api/orders/myorders
      fetch(`${API}/api/orders/myorders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => {
          if (r.status === 401) { handleUnauthorized(); throw new Error('Session expired'); }
          if (!r.ok) throw new Error('Failed to load orders');
          return r.json();
        })
        .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
        .catch((err) => { setError(err.message === 'Session expired' ? 'Session expired — please log in again.' : 'Failed to load orders'); setLoading(false); });
    }
  }, [token, user]);

  const handleTokenLookup = async (e) => {
    e.preventDefault();
    if (!trackingToken.trim()) return;
    setLoading(true);
    setError('');
    setSearched(false);
    try {
      const res  = await fetch(`${API}/api/orders/lookup?token=${encodeURIComponent(trackingToken.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No order found');
      setOrders(data && data._id ? [data] : []);
      setSearched(true);
    } catch (err) {
      setError(err.message || 'Failed to search orders. Please check your token and try again.');
      setOrders([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLookup = async (e) => {
    e.preventDefault();
    if (!orderIdInput.trim() || !phoneInput.trim()) return;
    setLoading(true);
    setError('');
    setSearched(false);
    try {
      const res = await fetch(`${API}/api/orders/lookup-by-phone?orderId=${encodeURIComponent(orderIdInput.trim())}&phone=${encodeURIComponent(phoneInput.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No order found');
      setOrders(data && data._id ? [data] : []);
      setSearched(true);
    } catch (err) {
      setError(err.message || 'Failed to search orders. Please check details and try again.');
      setOrders([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  /* ── Guest view: phone lookup ── */
  if (!user) {
    return (
      <div className="orders-empty">
        <Package size={60} strokeWidth={1} />
        <h2>Track Your Order</h2>
        <p style={{ fontSize: '0.88rem', color: '#666', marginTop: '4px' }}>
          For security, you can search up to 5 times every 15 minutes.
        </p>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <button
            onClick={() => { setActiveTab('token'); setError(''); setSearched(false); }}
            style={{
              background: 'none',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              color: activeTab === 'token' ? '#000' : '#888',
              borderBottom: activeTab === 'token' ? '2px solid #000' : 'none',
              paddingBottom: '5px'
            }}
          >
            Track with Token
          </button>
          <button
            onClick={() => { setActiveTab('phone'); setError(''); setSearched(false); }}
            style={{
              background: 'none',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              color: activeTab === 'phone' ? '#000' : '#888',
              borderBottom: activeTab === 'phone' ? '2px solid #000' : 'none',
              paddingBottom: '5px'
            }}
            style={{ background: 'none', border: 'none', borderBottom: activeTab === 'phone' ? '2px solid #000' : '2px solid transparent', padding: '8px 16px', cursor: 'pointer', fontWeight: activeTab === 'phone' ? 600 : 400, color: activeTab === 'phone' ? '#000' : '#666', fontFamily: 'inherit' }}
          >
            Track with Phone & ID
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
          For security, you can search up to 5 times every 15 minutes.
        </p>

        {activeTab === 'token' ? (
          <form
            onSubmit={handleTokenLookup}
            style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <input
              type="text"
              placeholder="Guest Tracking Token (e.g. tr_xxx)"
              value={trackingToken}
              onChange={e => setTrackingToken(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', color: '#111', background: '#fff', minWidth: '280px' }}
            />
            <button
              type="submit"
              style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle size={14} /> Track Order
            </button>
          </form>
        ) : (
          <form
            onSubmit={handlePhoneLookup}
            style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input
                type="text"
                placeholder="Order ID (e.g. 64b3ef...)"
                value={orderIdInput}
                onChange={e => setOrderIdInput(e.target.value)}
                style={{ padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', color: '#111', background: '#fff', minWidth: '220px' }}
              />
              <input
                type="text"
                placeholder="Phone Number (e.g. 017xx)"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                style={{ padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', color: '#111', background: '#fff', minWidth: '220px' }}
              />
            </div>
            <button
              type="submit"
              style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle size={14} /> Track Order
            </button>
          </form>
        )}

        {loading && <p style={{ marginTop: '16px', color: '#888' }}>Searching…</p>}
        {error   && <p style={{ marginTop: '16px', color: '#e44', fontSize: '0.9rem' }}>{error}</p>}
        {searched && !loading && orders.length === 0 && (
          <p style={{ marginTop: '16px', color: '#888', fontSize: '0.9rem' }}>No order found with those details.</p>
        )}
        {searched && !loading && orders.length > 0 && (
          <div className="orders-list" style={{ marginTop: '24px', maxWidth: '700px', margin: '24px auto 0' }}>
            {renderOrderList(orders)}
          </div>
        )}
      </div>
    );
  }

  /* ── Authenticated view ── */
  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1 className="orders-heading"><Package size={22} strokeWidth={1.5} /> My Orders</h1>

        {loading && <p className="orders-loading">Loading your orders…</p>}
        {error   && <p className="orders-error">{error}</p>}

        {/* Since authenticated customers fetch automatically, we don't need a lookup form here anymore.
            If orders list is empty after load, we just show "No orders yet". */}
        {!loading && orders.length === 0 && (
          <div className="orders-empty-inner">
            <Package size={48} strokeWidth={1} />
            <h3>No orders yet</h3>
            <p>You haven't placed any orders yet.</p>
            <Link to="/category/all" className="btn-orders-shop">Start Shopping</Link>
          </div>
        )}

        <div className="orders-list">
          {renderOrderList(orders)}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
