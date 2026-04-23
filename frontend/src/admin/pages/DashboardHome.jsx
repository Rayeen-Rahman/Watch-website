import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, Users, DollarSign, ListTodo,
  Clock, Package, AlertTriangle, Plus, Trash2,
} from 'lucide-react';
import './DashboardHome.css';

const API = import.meta.env.VITE_API_URL;

const DashboardHome = () => {
  // ── Step 19–20: Real KPI stats ──────────────────────────────────────────────
  const [stats, setStats] = useState(null);

  // ── Step 21: Real recent orders ─────────────────────────────────────────────
  const [recentOrders, setRecentOrders] = useState([]);

  // ── Step 22: Real popular products + revenue chart ──────────────────────────
  const [popularProducts, setPopularProducts] = useState([]);
  const [chartData, setChartData] = useState([]);

  // ── Step 23: Functional Todo list ───────────────────────────────────────────
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem('adminTodos');
      return saved ? JSON.parse(saved) : [
        { id: 1, text: 'Restock Chronograph series', done: false },
        { id: 2, text: 'Verify pending orders',      done: false },
        { id: 3, text: 'Launch new layout',           done: false },
      ];
    } catch { return []; }
  });
  const [newTodo, setNewTodo] = useState('');

  const saveTodos = (updated) => {
    setTodos(updated);
    localStorage.setItem('adminTodos', JSON.stringify(updated));
  };

  const toggleTodo  = (id) => saveTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo  = (id) => saveTodos(todos.filter(t => t.id !== id));
  const addTodo     = ()   => {
    if (!newTodo.trim()) return;
    saveTodos([...todos, { id: Date.now(), text: newTodo.trim(), done: false }]);
    setNewTodo('');
  };

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    // Dashboard stats
    fetch(`${API}/api/admin/dashboard-stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});

    // Recent orders
    fetch(`${API}/api/admin/recent-orders?limit=8`)
      .then(r => r.json())
      .then(data => setRecentOrders(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Popular products
    fetch(`${API}/api/admin/popular-products?limit=5`)
      .then(r => r.json())
      .then(data => setPopularProducts(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Revenue chart
    fetch(`${API}/api/admin/revenue-chart?days=7`)
      .then(r => r.json())
      .then(data => setChartData(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fmt = (n) => (n ?? 0).toLocaleString();

  // Status badge helper
  const statusClass = (s = '') => {
    const v = s.toLowerCase();
    if (v === 'delivered' || v === 'completed') return 'tx-done';
    if (v === 'failed'    || v === 'cancelled') return 'tx-failed';
    return 'tx-pending';
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{ margin: 0, fontWeight: 500 }}>Admin Dashboard</h2>
      </div>

      <div className="dashboard-grid">

        {/* ── Step 19–20: 6 KPI Cards ─────────────────────────────────────── */}
        <div className="kpi-cards-row kpi-six">
          <div className="kpi-card">
            <div className="kpi-icon"><DollarSign size={22} /></div>
            <div className="kpi-info">
              <p>Total Revenue</p>
              <h3>৳{fmt(stats?.totalRevenue)}</h3>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon"><TrendingUp size={22} /></div>
            <div className="kpi-info">
              <p>Sales Today</p>
              <h3>{stats?.todayOrders ?? '—'} Orders</h3>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon"><Users size={22} /></div>
            <div className="kpi-info">
              <p>Total Users</p>
              <h3>{fmt(stats?.totalUsers)}</h3>
            </div>
          </div>
          <div className="kpi-card kpi-warning">
            <div className="kpi-icon"><Clock size={22} /></div>
            <div className="kpi-info">
              <p>Pending Orders</p>
              <h3>{stats?.pendingOrders ?? '—'}</h3>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon"><Package size={22} /></div>
            <div className="kpi-info">
              <p>Total Products</p>
              <h3>{fmt(stats?.totalProducts)}</h3>
            </div>
          </div>
          <div className="kpi-card kpi-danger">
            <div className="kpi-icon"><AlertTriangle size={22} /></div>
            <div className="kpi-info">
              <p>Low Stock Items</p>
              <h3>{stats?.lowStockCount ?? '—'}</h3>
            </div>
          </div>
        </div>

        {/* ── Step 22: Revenue Bar Chart ──────────────────────────────────── */}
        <div className="chart-container chart-full">
          <h3>Revenue — Last 7 Days</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 12 }} />
                <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '16px', color: '#A1A1A1', fontSize: '0.8rem' }} />
                <Bar dataKey="orders"  name="Orders"       fill="#FFFFFF"  radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Revenue (৳)"  fill="#6366F1"  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Bottom Row ──────────────────────────────────────────────────── */}
        <div className="bottom-row">

          {/* Step 21 + 24: Real recent orders with "View all" link */}
          <div className="dashboard-list-card">
            <div className="list-card-header">
              <h3>Latest Orders</h3>
              <Link to="/admin/orders" className="panel-link">View all orders →</Link>
            </div>
            <div className="transaction-list">
              {recentOrders.length === 0 ? (
                <p className="empty-state">No orders yet.</p>
              ) : recentOrders.map(o => (
                <div key={o._id} className="transaction-row">
                  <div className="tx-avatar">
                    {(o.customerName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="tx-info">
                    <span className="tx-name">{o.customerName || 'Customer'}</span>
                    <span className="tx-sub">#{o._id.toString().slice(-6).toUpperCase()} · {new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="tx-right">
                    <span className="tx-amount">৳{fmt(o.total)}</span>
                    <span className={`tx-status ${statusClass(o.status)}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 22 + 24: Real popular products with "Manage" link */}
          <div className="dashboard-list-card">
            <div className="list-card-header">
              <h3>Popular Products</h3>
              <Link to="/admin/products" className="panel-link">Manage products →</Link>
            </div>
            <div className="product-thumb-list">
              {popularProducts.length === 0 ? (
                <p className="empty-state">No sales data yet.</p>
              ) : popularProducts.map((p, i) => (
                <div key={i} className="product-thumb-row">
                  {p.image ? (
                    <img
                      src={p.image.startsWith('/uploads') ? `${API}${p.image}` : p.image}
                      alt={p.name}
                      className="product-thumb"
                    />
                  ) : (
                    <div className="product-thumb product-thumb-placeholder">
                      {(p.name || 'W').charAt(0)}
                    </div>
                  )}
                  <div className="product-thumb-info">
                    <span className="product-thumb-name">{p.name}</span>
                    <span className="product-thumb-price">৳{fmt(p.price)}</span>
                  </div>
                  <span className="product-thumb-sold">{p.totalSold} sold</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 23: Functional Todo List */}
          <div className="dashboard-list-card">
            <h3><ListTodo size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Todo List</h3>
            <div className="todo-date-pill">📅 {today}</div>
            <ul className="dash-list todo-list">
              {todos.map(t => (
                <li key={t.id} className={t.done ? 'todo-done' : ''}>
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggleTodo(t.id)}
                  />
                  <span>{t.text}</span>
                  <button className="todo-delete-btn" onClick={() => deleteTodo(t.id)} aria-label="Delete">
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="todo-add-row">
              <input
                type="text"
                placeholder="Add new task..."
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTodo()}
              />
              <button onClick={addTodo} className="todo-add-btn" aria-label="Add task">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardHome;
