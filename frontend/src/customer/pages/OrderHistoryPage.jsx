import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './OrderHistoryPage.css';

const API = import.meta.env.VITE_API_URL;

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: '#F59E0B', Icon: Clock },
  processing: { label: 'Processing', color: '#6366F1', Icon: Package },
  shipped:    { label: 'Shipped',    color: '#3B82F6', Icon: Truck },
  delivered:  { label: 'Delivered',  color: '#22C55E', Icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  color: '#EF4444', Icon: XCircle },
};

const OrderHistoryPage = () => {
  const { user, token } = useAuth();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${API}/api/orders/myorders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load orders'); setLoading(false); });
  }, [token]);

  if (!user) {
    return (
      <div className="orders-empty">
        <Package size={60} strokeWidth={1} />
        <h2>Sign in to view your orders</h2>
        <p>You need to be logged in to see your order history.</p>
      </div>
    );
  }

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
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.Icon;
            return (
              <div key={order._id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <p className="order-id">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="order-date">{new Date(order.createdAt).toLocaleDateString('en-BD', { year:'numeric', month:'long', day:'numeric' })}</p>
                  </div>
                  <span className="order-status-badge" style={{ color: cfg.color, borderColor: cfg.color }}>
                    <StatusIcon size={13} /> {cfg.label}
                  </span>
                </div>

                <div className="order-items-preview">
                  {order.orderItems?.slice(0, 3).map((item, i) => (
                    <div key={i} className="order-item-row">
                      <span className="order-item-name">{item.name}</span>
                      <span className="order-item-qty">× {item.qty}</span>
                      <span className="order-item-price">৳{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                  {order.orderItems?.length > 3 && (
                    <p className="order-more">+{order.orderItems.length - 3} more items</p>
                  )}
                </div>

                <div className="order-card-footer">
                  <span className="order-payment">{order.paymentMethod || 'COD'}</span>
                  <span className="order-total">Total: <strong>৳{(order.totalPrice ?? 0).toLocaleString()}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
