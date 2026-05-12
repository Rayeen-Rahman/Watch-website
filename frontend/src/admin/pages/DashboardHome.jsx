import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  ShoppingBag, Users, DollarSign, TrendingUp,
  Package, AlertTriangle, Clock, ChevronRight,
  ArrowUpRight, ArrowDownRight, Star, Search, X, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './DashboardHome.css';

/* ─────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────── */
const Skeleton = ({ w = '100%', h = 20, radius = 6 }) => (
  <div
    className="dash-skeleton"
    style={{ width: w, height: h, borderRadius: radius }}
  />
);

/* ─────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, label, value, sub, trend, color, loading }) => (
  <div className={`kpi-card kpi-${color}`}>
    <div className="kpi-top">
      <div className="kpi-icon-wrap">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <span className="kpi-label">{label}</span>
    </div>
    {loading ? (
      <Skeleton h={32} w="60%" />
    ) : (
      <div className="kpi-value">{value}</div>
    )}
    {sub && !loading && (
      <div className={`kpi-sub ${trend === 'up' ? 'kpi-up' : trend === 'down' ? 'kpi-down' : ''}`}>
        {trend === 'up' && <ArrowUpRight size={13} />}
        {trend === 'down' && <ArrowDownRight size={13} />}
        {sub}
      </div>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    pending:    'badge-pending',
    processing: 'badge-processing',
    shipped:    'badge-shipped',
    delivered:  'badge-delivered',
    cancelled:  'badge-cancelled',
    failed:     'badge-cancelled',
    paid:       'badge-delivered',
    Completed:  'badge-delivered',
    Pending:    'badge-pending',
  };
  return (
    <span className={`order-badge ${map[status] || 'badge-pending'}`}>
      {status}
    </span>
  );
};

/* ─────────────────────────────────────────────
   CUSTOM TOOLTIP FOR CHARTS
───────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="ct-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="ct-item">
          {p.name}: {currency ? `৳${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
const DashboardHome = () => {
  const { token } = useAuth();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  /* ── State ── */
  const [stats,         setStats]         = useState(null);
  const [revenueChart,  setRevenueChart]  = useState([]);
  const [recentOrders,  setRecentOrders]  = useState([]);
  const [topProducts,   setTopProducts]   = useState([]);
  const [chartRange,    setChartRange]    = useState(7);
  const [loading,       setLoading]       = useState(true);
  const [chartLoading,  setChartLoading]  = useState(false);
  const [error,         setError]         = useState(null);

  // ── Hero Product State ──
  const [heroProduct,    setHeroProduct]    = useState(null);
  const [showHeroPicker, setShowHeroPicker] = useState(false);
  const [allProducts,    setAllProducts]    = useState([]);
  const [heroSearch,     setHeroSearch]     = useState('');
  const [heroSaving,     setHeroSaving]     = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  /* ── Fetch KPIs, orders, products on mount ── */
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/admin/dashboard-stats`,          { headers }).then(r => r.json()),
      fetch(`${API}/api/admin/recent-orders?limit=8`,    { headers }).then(r => r.json()),
      fetch(`${API}/api/admin/popular-products?limit=5`, { headers }).then(r => r.json()),
    ])
      .then(([s, ro, pp]) => {
        setStats(s);
        setRecentOrders(Array.isArray(ro) ? ro : []);
        setTopProducts(Array.isArray(pp) ? pp : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

    // Fetch current hero product
    fetch(`${API}/api/admin/featured-product`, { headers })
      .then(r => r.json())
      .then(p => setHeroProduct(p || null))
      .catch(() => {});
  }, [token]); // eslint-disable-line

  /* ── Fetch chart data when range changes ── */
  useEffect(() => {
    setChartLoading(true);
    fetch(`${API}/api/admin/revenue-chart?days=${chartRange}`, { headers })
      .then(r => r.json())
      .then(data => {
        setRevenueChart(Array.isArray(data) ? data : []);
        setChartLoading(false);
      })
      .catch(() => setChartLoading(false));
  }, [token, chartRange]); // eslint-disable-line

  /* ── Helpers ── */
  const fmt = (n) => `৳${(n ?? 0).toLocaleString()}`;

  // ── Open hero picker: load all products ──
  const openHeroPicker = async () => {
    setHeroSearch('');
    setShowHeroPicker(true);
    if (allProducts.length > 0) return;
    try {
      const res  = await fetch(`${API}/api/products?limit=100`, { headers });
      const data = await res.json();
      setAllProducts(Array.isArray(data.products) ? data.products : []);
    } catch { /* silently ignore */ }
  };

  // ── Set a product as hero featured ──
  const setFeatured = async (productId) => {
    setHeroSaving(true);
    try {
      const res  = await fetch(`${API}/api/admin/set-featured/${productId}`, {
        method:  'PUT',
        headers: { ...headers },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setHeroProduct(data);
      setShowHeroPicker(false);
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setHeroSaving(false);
    }
  };

  // ── Resolve image URL (uploaded vs external) ──
  const resolveImg = (url) => url?.startsWith('/uploads') ? `${API}${url}` : url;

  /* ── Error state ── */
  if (error) {
    return (
      <div className="dash-error">
        <AlertTriangle size={32} />
        <p>Failed to load dashboard data.</p>
        <span>{error}</span>
      </div>
    );
  }

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <div className="dash-root">

      {/* ── PAGE HEADER ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">
            {new Date().toLocaleDateString('en-BD', {
              weekday: 'long', year: 'numeric',
              month: 'long', day: 'numeric'
            })}
          </p>
        </div>
        <Link to="/admin/orders" className="dash-cta-btn">
          View All Orders <ChevronRight size={15} />
        </Link>
      </div>

      {/* ── HERO PRODUCT WIDGET ── */}
      <div className="hero-widget">
        <div className="hero-widget-info">
          <div className="hero-widget-label">
            <Star size={14} strokeWidth={2} />
            Homepage Hero Product
          </div>
          {heroProduct ? (
            <>
              <div className="hero-widget-preview">
                {resolveImg(heroProduct.images?.[0]) ? (
                  <img
                    src={resolveImg(heroProduct.images[0])}
                    alt={heroProduct.name}
                    className="hero-widget-thumb"
                  />
                ) : (
                  <div className="hero-widget-thumb-placeholder"><Package size={20} /></div>
                )}
                <div className="hero-widget-text">
                  <strong>{heroProduct.name}</strong>
                  <span>{heroProduct.shortDescription || [heroProduct.movementType, heroProduct.caseSize].filter(Boolean).join(' · ') || 'No description'}</span>
                  <span className="hero-widget-price">{fmt(heroProduct.price)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="hero-widget-none">No featured product set — homepage shows a placeholder.</p>
          )}
        </div>
        <button className="hero-widget-btn" onClick={openHeroPicker}>
          {heroProduct ? 'Change Product' : 'Set Featured Product'}
        </button>
      </div>

      {/* ── KPI ROW ── */}
      <div className="kpi-row">
        <KpiCard
          icon={DollarSign}
          label="Total Revenue"
          value={loading ? '' : fmt(stats?.totalRevenue)}
          sub="From completed orders"
          color="green"
          loading={loading}
        />
        <KpiCard
          icon={ShoppingBag}
          label="Orders Today"
          value={loading ? '' : stats?.todayOrders ?? 0}
          sub="New since midnight"
          color="blue"
          loading={loading}
        />
        <KpiCard
          icon={Users}
          label="Total Users"
          value={loading ? '' : (stats?.totalUsers ?? 0).toLocaleString()}
          sub="Registered customers"
          color="purple"
          loading={loading}
        />
        <KpiCard
          icon={Package}
          label="Products"
          value={loading ? '' : stats?.totalProducts ?? 0}
          sub="Active in store"
          color="orange"
          loading={loading}
        />
        <KpiCard
          icon={Clock}
          label="Pending Orders"
          value={loading ? '' : stats?.pendingOrders ?? 0}
          sub="Awaiting processing"
          trend={stats?.pendingOrders > 0 ? 'down' : undefined}
          color="red"
          loading={loading}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Low Stock"
          value={loading ? '' : stats?.lowStockCount ?? 0}
          sub="Items ≤ 5 units"
          trend={stats?.lowStockCount > 0 ? 'down' : undefined}
          color="yellow"
          loading={loading}
        />
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="charts-row">

        {/* Revenue Area Chart */}
        <div className="chart-card chart-main">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Revenue Overview</h3>
              <p className="chart-card-sub">Delivered order earnings</p>
            </div>
            <div className="chart-range-tabs">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  className={`range-tab ${chartRange === d ? 'active' : ''}`}
                  onClick={() => setChartRange(d)}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div className="chart-body">
            {chartLoading ? (
              <div className="chart-loading">
                <Skeleton h={180} radius={8} />
              </div>
            ) : revenueChart.length === 0 ? (
              <div className="chart-empty">No revenue data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={revenueChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `৳${(v/1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip currency />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: '#6b7280', paddingTop: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#ordGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="chart-card chart-side">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-card-title">Top Products</h3>
              <p className="chart-card-sub">By units sold</p>
            </div>
            <Link to="/admin/products" className="chart-link">
              Manage <ChevronRight size={13} />
            </Link>
          </div>
          <div className="chart-body">
            {loading ? (
              <Skeleton h={180} radius={8} />
            ) : topProducts.length === 0 ? (
              <div className="chart-empty">No sales data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                    tickFormatter={v => v.length > 14 ? v.slice(0, 13) + '…' : v}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="totalSold"
                    name="Sold"
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Recent Orders + Popular Products ── */}
      <div className="bottom-row">

        {/* Recent Orders Table */}
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <h3 className="table-card-title">Recent Orders</h3>
              <p className="table-card-sub">Latest {recentOrders.length} orders</p>
            </div>
            <Link to="/admin/orders" className="chart-link">
              View all <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="table-skeletons">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="table-skeleton-row">
                  <Skeleton h={14} w="18%" />
                  <Skeleton h={14} w="22%" />
                  <Skeleton h={14} w="15%" />
                  <Skeleton h={14} w="18%" />
                  <Skeleton h={22} w="90px" radius={20} />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="table-empty">
              <ShoppingBag size={28} strokeWidth={1.5} />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="orders-table-wrap">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td className="order-id">
                        #{String(order._id).slice(-6).toUpperCase()}
                      </td>
                      <td className="order-customer">
                        <div className="customer-avatar">
                          {(order.customerName || order.user?.name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <span>{order.customerName || order.user?.name || 'Guest'}</span>
                      </td>
                      <td className="order-date">
                        {new Date(order.createdAt).toLocaleDateString('en-BD', {
                          month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td className="order-amount">
                        {fmt(order.total ?? order.totalPrice)}
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Popular Products List */}
        <div className="popular-card">
          <div className="table-card-header">
            <div>
              <h3 className="table-card-title">Popular Products</h3>
              <p className="table-card-sub">Most sold watches</p>
            </div>
            <Link to="/admin/products" className="chart-link">
              Manage <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="pop-skeletons">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="pop-skeleton-row">
                  <Skeleton h={44} w={44} radius={8} />
                  <div style={{ flex: 1 }}>
                    <Skeleton h={13} w="70%" />
                    <Skeleton h={11} w="40%" />
                  </div>
                  <Skeleton h={13} w={50} />
                </div>
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="table-empty">
              <Package size={28} strokeWidth={1.5} />
              <p>No product data yet</p>
            </div>
          ) : (
            <ul className="popular-list">
              {topProducts.map((p, i) => (
                <li key={p._id || i} className="popular-item">
                  <div className="popular-rank">{i + 1}</div>
                  <div className="popular-img-wrap">
                    {p.image ? (
                      <img
                        src={p.image.startsWith('/uploads') ? `${API}${p.image}` : p.image}
                        alt={p.name}
                        className="popular-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="popular-img-placeholder">
                        <Package size={18} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="popular-info">
                    <p className="popular-name">
                      {p.name?.length > 20 ? p.name.slice(0, 19) + '…' : p.name}
                    </p>
                    <p className="popular-price">
                      {fmt(p.price)}
                    </p>
                  </div>
                  <div className="popular-sold">
                    <span className="sold-num">{p.totalSold}</span>
                    <span className="sold-label">sold</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── HERO PRODUCT PICKER MODAL ─────────────────────── */}
      {showHeroPicker && (
        <div className="hero-picker-overlay" onClick={() => setShowHeroPicker(false)}>
          <div className="hero-picker-modal" onClick={e => e.stopPropagation()}>
            <div className="hero-picker-header">
              <div>
                <h3>Choose Hero Product</h3>
                <p>This product will appear in the homepage hero section</p>
              </div>
              <button className="hero-picker-close" onClick={() => setShowHeroPicker(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="hero-picker-search">
              <Search size={15} />
              <input
                type="search"
                placeholder="Search products…"
                value={heroSearch}
                onChange={e => setHeroSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="hero-picker-list">
              {allProducts
                .filter(p => p.name.toLowerCase().includes(heroSearch.toLowerCase()))
                .map(p => {
                  const img = resolveImg(p.images?.[0]);
                  const isCurrent = heroProduct?._id === p._id;
                  return (
                    <button
                      key={p._id}
                      className={`hero-picker-item ${isCurrent ? 'is-current' : ''}`}
                      onClick={() => !isCurrent && setFeatured(p._id)}
                      disabled={heroSaving}
                    >
                      <div className="hpi-img">
                        {img
                          ? <img src={img} alt={p.name} />
                          : <Package size={20} strokeWidth={1.5} />}
                      </div>
                      <div className="hpi-info">
                        <span className="hpi-name">{p.name}</span>
                        <span className="hpi-price">{fmt(p.price)}</span>
                      </div>
                      {isCurrent && (
                        <span className="hpi-badge"><Check size={12} /> Current</span>
                      )}
                    </button>
                  );
                })}
              {allProducts.filter(p => p.name.toLowerCase().includes(heroSearch.toLowerCase())).length === 0 && (
                <p className="hpi-empty">No products match your search.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardHome;
