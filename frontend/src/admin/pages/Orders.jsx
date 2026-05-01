import React, { useState, useEffect, useCallback } from 'react';
import { MoreHorizontal, X, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Products.css';
import './Orders.css';

const API = import.meta.env.VITE_API_URL;

const STATUS_OPTIONS = ['pending', 'delivered', 'failed'];

const statusClass = (s = '') => {
  const v = s.toLowerCase();
  if (v === 'delivered') return 'status-delivered';
  if (v === 'failed')    return 'status-failed';
  return 'status-pending';
};

// ── Order Detail Modal ────────────────────────────────────────────────────────
const OrderModal = ({ order, onClose }) => {
  if (!order) return null;
  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="order-modal" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="order-modal-body">
          <div className="order-info-grid">
            <div><span className="info-label">Customer</span><span>{order.customerName}</span></div>
            <div><span className="info-label">Phone</span><span>{order.phone}</span></div>
            <div><span className="info-label">Address</span><span>{order.address}</span></div>
            <div><span className="info-label">Date</span><span>{new Date(order.createdAt).toLocaleString()}</span></div>
            <div><span className="info-label">Status</span>
              <span className={`status-badge ${statusClass(order.status)}`}>{order.status}</span>
            </div>
            <div><span className="info-label">Total</span><span style={{ fontWeight: 700 }}>৳{(order.total ?? 0).toLocaleString()}</span></div>
          </div>

          <h4 style={{ margin: '20px 0 12px', color: 'var(--admin-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Items Ordered
          </h4>
          <div className="order-items-list">
            {(order.products || []).map((item, i) => (
              <div key={i} className="order-item-row">
                <span className="order-item-name">
                  {item.product?.name || `Product #${i + 1}`}
                </span>
                <span className="order-item-qty">× {item.quantity}</span>
                <span className="order-item-price">৳{(item.price ?? 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Orders Page ──────────────────────────────────────────────────────────
const Orders = ({ showToast }) => {
  const { token } = useAuth();
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openKebab,   setOpenKebab]   = useState(null);
  const [viewOrder,   setViewOrder]   = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');
  const [updatingId,   setUpdatingId]   = useState(null);

  const toast = showToast || ((msg, err) => err ? alert(msg) : null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Status update ───────────────────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API}/api/orders/${id}/status`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
      setOpenKebab(null);
      toast('Order status updated.');
    } catch (err) { toast(err.message, true); }
    finally { setUpdatingId(null); }
  };

  // ── Filter + search ─────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch = !search ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.phone?.includes(search) ||
      o._id.slice(-6).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage   = Math.min(currentPage, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const handleSelectAll = (e) =>
    setSelectedIds(e.target.checked ? pageRows.map(o => o._id) : []);
  const handleSelectOne = (e, id) =>
    setSelectedIds(e.target.checked ? [...selectedIds, id] : selectedIds.filter(x => x !== id));

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{ margin: 0, fontWeight: 500 }}>Orders Management</h2>
        <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
          {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div className="orders-filter-row">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search name, phone, order ID..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setCurrentPage(1); } }}
          />
        </div>
        <button className="btn-icon-sm" onClick={() => { setSearch(searchInput); setCurrentPage(1); }}>
          <Search size={14} />
        </button>
        <button className="btn-icon-sm" onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter('all'); setCurrentPage(1); }}>
          <RefreshCw size={14} />
        </button>
        <div className="status-filter-tabs">
          {['all', 'pending', 'delivered', 'failed'].map(s => (
            <button
              key={s}
              className={`filter-tab ${statusFilter === s ? 'filter-tab-active' : ''}`}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 30, color: 'var(--admin-text-secondary)' }}>Loading orders...</div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" onChange={handleSelectAll}
                    checked={selectedIds.length === pageRows.length && pageRows.length > 0} />
                </th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(order => (
                <tr key={order._id} className={selectedIds.includes(order._id) ? 'selected-row' : ''}>
                  <td>
                    <input type="checkbox"
                      checked={selectedIds.includes(order._id)}
                      onChange={e => handleSelectOne(e, order._id)} />
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                    #{order._id.slice(-6).toUpperCase()}
                  </td>
                  <td style={{ fontWeight: 500 }}>{order.customerName}</td>
                  <td style={{ color: 'var(--admin-text-secondary)' }}>{order.phone}</td>
                  <td style={{ color: 'var(--admin-text-secondary)' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{ color: 'var(--admin-text-secondary)' }}>{(order.products || []).length} item(s)</td>
                  <td style={{ fontWeight: 600 }}>৳{(order.total ?? 0).toLocaleString()}</td>
                  <td>
                    {/* ── Inline status dropdown ── */}
                    <select
                      className={`status-select status-select-${(order.status || 'pending').toLowerCase()}`}
                      value={order.status || 'pending'}
                      disabled={updatingId === order._id}
                      onChange={e => updateStatus(order._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ position: 'relative' }}>
                    <button className="btn-icon kebab-btn"
                      onClick={() => setOpenKebab(openKebab === order._id ? null : order._id)}>
                      <MoreHorizontal size={16} />
                    </button>
                    {openKebab === order._id && (
                      <div className="kebab-menu">
                        <button onClick={() => { setViewOrder(order); setOpenKebab(null); }}>
                          👁️ View Details
                        </button>
                        {STATUS_OPTIONS.filter(s => s !== order.status).map(s => (
                          <button key={s} onClick={() => updateStatus(order._id, s)}>
                            → Mark as {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 30 }}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination footer */}
          <div className="table-footer">
            <span className="footer-selected">{selectedIds.length} of {filtered.length} row(s) selected.</span>
            <div className="footer-right">
              <span className="footer-label">Rows per page:</span>
              <select className="rows-per-page-select" value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="footer-label">{safePage} of {totalPages}</span>
              <div className="page-nav-btns">
                <button onClick={() => setCurrentPage(1)}           disabled={safePage === 1}          title="First">|◀</button>
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={safePage === 1}          title="Prev">◀</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={safePage === totalPages} title="Next">▶</button>
                <button onClick={() => setCurrentPage(totalPages)}   disabled={safePage === totalPages} title="Last">▶|</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewOrder && <OrderModal order={viewOrder} onClose={() => setViewOrder(null)} />}
    </div>
  );
};

export default Orders;
