import React, { useState, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import './Products.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openKebab, setOpenKebab] = useState(null);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Step 57: normalize status to a CSS-friendly key
  const getStatusClass = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'success' || s === 'completed') return 'status-delivered';
    if (s === 'failed' || s === 'cancelled' || s === 'canceled') return 'status-failed';
    return 'status-pending';
  };

  // Pagination
  const totalRows = orders.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const pageRows = orders.slice(startIdx, startIdx + rowsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(pageRows.map(o => o._id));
    else setSelectedIds([]);
  };
  const handleSelectOne = (e, id) => {
    if (e.target.checked) setSelectedIds(prev => [...prev, id]);
    else setSelectedIds(prev => prev.filter(x => x !== id));
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{ margin: 0, fontWeight: 500 }}>Orders Management</h2>
      </div>

      {loading ? <div>Loading transactions...</div> : error ? (
        <div className="error-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === pageRows.length && pageRows.length > 0}
                  />
                </th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Date</th>
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
                      onChange={(e) => handleSelectOne(e, order._id)}
                    />
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                    #{order._id.substring(18, 24).toUpperCase()}
                  </td>
                  <td style={{ fontWeight: 500 }}>{order.customerName}</td>
                  <td>{order.phone}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>৳{order.total?.toLocaleString()}</td>
                  <td>
                    {/* Step 57: correct status badge colors */}
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ position: 'relative' }}>
                    <button
                      className="btn-icon kebab-btn"
                      onClick={() => setOpenKebab(openKebab === order._id ? null : order._id)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openKebab === order._id && (
                      <div className="kebab-menu">
                        <button>👁️ View</button>
                        <button>✏️ Update Status</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No transactions found.</td></tr>
              )}
            </tbody>
          </table>

          {/* Step 58: Pagination footer */}
          <div className="table-footer">
            <span className="footer-selected">{selectedIds.length} of {totalRows} row(s) selected.</span>
            <div className="footer-right">
              <span className="footer-label">Rows per page:</span>
              <select
                className="rows-per-page-select"
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="footer-label">{safePage} of {totalPages}</span>
              <div className="page-nav-btns">
                <button onClick={() => setCurrentPage(1)} disabled={safePage === 1} title="First">|◀</button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} title="Prev">◀</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} title="Next">▶</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} title="Last">▶|</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Orders;
