import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, PhoneCall } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './OrderHistoryPage.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: '#F59E0B', Icon: Clock },
  processing: { label: 'Processing', color: '#6366F1', Icon: Package },
  shipped:    { label: 'Shipped',    color: '#3B82F6', Icon: Truck },
  delivered:  { label: 'Delivered',  color: '#22C55E', Icon: CheckCircle },
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
  const { user, token } = useAuth();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!token || !user) { setLoading(false); return; }

    // Admins see all orders; regular customers use phone lookup below
    if (user.role === 'admin') {
      fetch(`${API}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => { setError('Failed to load orders'); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const handlePhoneLookup = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API}/api/orders/lookup?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch {
      setError('Failed to search orders. Please try again.');
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
        <p>Enter the phone number you used at checkout to find your orders.</p>
        <form
          onSubmit={handlePhoneLookup}
          style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <input
            type="tel"
            placeholder="+880 1700 000000"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit', fontSize: '0.9rem', color: '#111', background: '#fff', minWidth: '220px' }}
          />
          <button
            type="submit"
            style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PhoneCall size={14} /> Find Orders
          </button>
        </form>
        {loading && <p style={{ marginTop: '16px', color: '#888' }}>Searching…</p>}
        {error   && <p style={{ marginTop: '16px', color: '#e44', fontSize: '0.9rem' }}>{error}</p>}
        {searched && !loading && orders.length === 0 && (
          <p style={{ marginTop: '16px', color: '#888', fontSize: '0.9rem' }}>No orders found for that phone number.</p>
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

        {!loading && orders.length === 0 && (
          <div className="orders-empty-inner">
            <Package size={48} strokeWidth={1} />
            <h3>No orders yet</h3>
            <p>Your placed orders will appear here.</p>
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
