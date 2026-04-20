import React, { useState, useEffect } from 'react';
import { Eye, Edit } from 'lucide-react';
import './Products.css'; // Inheriting shared table styles

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

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

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{margin:0, fontWeight: 500}}>Orders Management</h2>
      </div>

      {loading ? (
        <div>Loading transactions...</div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td style={{fontFamily:'monospace', color:'var(--admin-text-secondary)'}}>
                    {order._id.substring(18, 24).toUpperCase()}
                  </td>
                  <td style={{fontWeight: 500}}>{order.customerName}</td>
                  <td>{order.phone}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td style={{fontWeight: 600}}>${order.total.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="View Details"><Eye size={16}/></button>
                      <button className="btn-icon" title="Update Status"><Edit size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan="7" style={{textAlign:'center', padding:'30px'}}>No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default Orders;
