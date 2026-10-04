import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Eye, Users, MousePointerClick, Globe, Monitor, Smartphone,
  Tablet, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle,
  RefreshCw, Trash2, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API } from '../../utils/api';
import './Analytics.css';

/* ─────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────── */
const Skeleton = ({ w = '100%', h = 20, radius = 6 }) => (
  <div className="an-skeleton" style={{ width: w, height: h, borderRadius: radius }} />
);

/* ─────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, label, value, change, suffix = '', color, loading }) => {
  const hasChange = change !== null && change !== undefined;
  const isUp   = hasChange && change > 0;
  const isDown = hasChange && change < 0;
  const isFlat = hasChange && change === 0;
  return (
    <div className={`an-kpi an-kpi-${color}`}>
      <div className="an-kpi-top">
        <div className="an-kpi-icon"><Icon size={18} strokeWidth={1.8} /></div>
        <span className="an-kpi-label">{label}</span>
      </div>
      {loading
        ? <Skeleton h={34} w="55%" />
        : <div className="an-kpi-value">{value}{suffix && <span className="an-kpi-suffix">{suffix}</span>}</div>
      }
      {hasChange && !loading && (
        <div className={`an-kpi-change ${isUp ? 'an-up' : isDown ? 'an-down' : 'an-flat'}`}>
          {isUp   && <ArrowUpRight   size={13} />}
          {isDown && <ArrowDownRight size={13} />}
          {isFlat && <Minus          size={13} />}
          {isUp ? '+' : ''}{change}% vs prev period
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   CUSTOM CHART TOOLTIP
───────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <p className="an-tt-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="an-tt-item">
          {p.name}: <strong>{p.value.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   DEVICE ICON MAP
───────────────────────────────────────────── */
const DeviceIcon = ({ type }) => {
  if (type === 'mobile')  return <Smartphone size={15} />;
  if (type === 'tablet')  return <Tablet     size={15} />;
  if (type === 'desktop') return <Monitor    size={15} />;
  return <Globe size={15} />;
};

const DEVICE_COLORS = {
  desktop: '#6366f1',
  mobile:  '#22c55e',
  tablet:  '#f59e0b',
  unknown: '#6b7280',
  bot:     '#374151',
};

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#6b7280'];

/* ─────────────────────────────────────────────
   MAIN ANALYTICS PAGE
───────────────────────────────────────────── */
const Analytics = ({ showToast }) => {
  const { token, handleUnauthorized, loading: authLoading } = useAuth();

  const [days,          setDays]          = useState(7);
  const [overview,      setOverview]      = useState(null);
  const [traffic,       setTraffic]       = useState([]);
  const [topPages,      setTopPages]      = useState([]);
  const [devices,       setDevices]       = useState({ total: 0, breakdown: [] });
  const [countries,     setCountries]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState(null);
  const [clearing,      setClearing]      = useState(false);
  const [confirmClear,  setConfirmClear]  = useState(false);


  /* ── Fetch all analytics data ── */
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);

    // Build headers fresh inside the callback so it always uses the current token
    const authHeaders = { Authorization: `Bearer ${token}` };

    const fetchJson = async (url) => {
      const r = await fetch(url, { headers: authHeaders });
      if (r.status === 401) { handleUnauthorized(); throw new Error('Unauthorized'); }
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || 'Request failed');
      return data;
    };

    try {
      const [ov, tr, tp, dv, co] = await Promise.all([
        fetchJson(`${API}/api/analytics/overview?days=${days}`),
        fetchJson(`${API}/api/analytics/traffic?days=${days}`),
        fetchJson(`${API}/api/analytics/top-pages?days=${days}&limit=10`),
        fetchJson(`${API}/api/analytics/devices?days=${days}`),
        fetchJson(`${API}/api/analytics/countries?days=${days}&limit=8`),
      ]);

      setOverview(ov);
      setTraffic(Array.isArray(tr) ? tr : []);
      setTopPages(Array.isArray(tp) ? tp : []);
      setDevices(dv || { total: 0, breakdown: [] });
      setCountries(Array.isArray(co) ? co : []);
    } catch (err) {
      if (err.message !== 'Unauthorized') setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, days, handleUnauthorized]); // eslint-disable-line

  useEffect(() => {
    if (authLoading || !token) return;
    fetchAll();
  }, [fetchAll, authLoading]); // eslint-disable-line

  /* ── Clear all logs ── */
  const handleClear = async () => {
    setClearing(true);
    try {
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const r = await fetch(`${API}/api/analytics/clear`, {
        method:  'DELETE',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ confirm: true }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || 'Failed');
      showToast && showToast(data.message || 'Analytics cleared ✓');
      setConfirmClear(false);
      fetchAll(true);
    } catch (err) {
      showToast
        ? showToast(`Error: ${err.message}`, true)
        : alert(err.message);
    } finally {
      setClearing(false);
    }
  };

  /* ── Error state ── */
  if (error) {
    return (
      <div className="an-error">
        <AlertTriangle size={32} />
        <p>Failed to load analytics data.</p>
        <span>{error}</span>
        <button onClick={() => fetchAll()} className="an-retry-btn">Retry</button>
      </div>
    );
  }

  const maxPageViews = topPages[0]?.views || 1;

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="an-root">

      {/* ── PAGE HEADER ── */}
      <div className="an-header">
        <div>
          <h1 className="an-title">
            <TrendingUp size={22} strokeWidth={2} className="an-title-icon" />
            Visitor Analytics
          </h1>
          <p className="an-subtitle">
            Storefront traffic — admin-only, never shown to customers
          </p>
        </div>
        <div className="an-header-actions">
          {/* Day range selector */}
          <div className="an-range-tabs">
            {[7, 14, 30].map(d => (
              <button
                key={d}
                className={`an-range-tab ${days === d ? 'active' : ''}`}
                onClick={() => setDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
          {/* Refresh button */}
          <button
            className="an-action-btn"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshCw size={15} className={refreshing ? 'an-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {/* Clear data button */}
          {!confirmClear ? (
            <button
              className="an-action-btn an-danger-btn"
              onClick={() => setConfirmClear(true)}
              title="Clear all analytics data"
            >
              <Trash2 size={15} /> Clear Data
            </button>
          ) : (
            <div className="an-confirm-bar">
              <span>Are you sure?</span>
              <button
                className="an-confirm-yes"
                onClick={handleClear}
                disabled={clearing}
              >
                {clearing ? 'Clearing…' : 'Yes, Clear All'}
              </button>
              <button
                className="an-confirm-no"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="an-kpi-row">
        <KpiCard
          icon={Eye}
          label="Page Views"
          value={loading ? '' : (overview?.pageViews ?? 0).toLocaleString()}
          change={overview?.pageViewsChange}
          color="indigo"
          loading={loading}
        />
        <KpiCard
          icon={Users}
          label="Unique Visitors"
          value={loading ? '' : (overview?.uniqueVisits ?? 0).toLocaleString()}
          change={overview?.uniqueVisitsChange}
          color="green"
          loading={loading}
        />
        <KpiCard
          icon={MousePointerClick}
          label="Pages / Visit"
          value={loading ? '' : overview?.avgPagesPerVisit ?? '–'}
          color="purple"
          loading={loading}
        />
        <KpiCard
          icon={Globe}
          label="Countries Tracked"
          value={loading ? '' : countries.length}
          color="orange"
          loading={loading}
        />
      </div>

      {/* ── TRAFFIC CHART ── */}
      <div className="an-card an-chart-card">
        <div className="an-card-header">
          <div>
            <h2 className="an-card-title">Traffic Over Time</h2>
            <p className="an-card-sub">Daily page views & unique visitors</p>
          </div>
        </div>
        <div className="an-chart-body">
          {loading ? (
            <Skeleton h={220} radius={8} />
          ) : traffic.length === 0 ? (
            <div className="an-empty">No traffic data yet — visit the storefront to start tracking.</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={traffic} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="uvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
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
                  width={40}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="Page Views"
                  stroke="#6366f1"
                  fill="url(#pvGrad)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#6366f1' }}
                />
                <Area
                  type="monotone"
                  dataKey="uniqueVisits"
                  name="Unique Visitors"
                  stroke="#22c55e"
                  fill="url(#uvGrad)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#22c55e' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW: Top Pages + Device Breakdown + Countries ── */}
      <div className="an-bottom-row">

        {/* Top Pages */}
        <div className="an-card an-top-pages-card">
          <div className="an-card-header">
            <h2 className="an-card-title">Top Pages</h2>
            <p className="an-card-sub">Most visited paths ({days}d)</p>
          </div>
          <div className="an-top-pages-list">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="an-page-row an-page-row-skeleton">
                  <Skeleton h={14} w="55%" />
                  <Skeleton h={14} w="20%" />
                </div>
              ))
            ) : topPages.length === 0 ? (
              <div className="an-empty">No page data yet.</div>
            ) : (
              topPages.map((p, i) => (
                <div key={i} className="an-page-row">
                  <div className="an-page-left">
                    <span className="an-page-rank">#{i + 1}</span>
                    <span className="an-page-path" title={p.path}>{p.path}</span>
                  </div>
                  <div className="an-page-right">
                    <div className="an-page-bar-wrap">
                      <div
                        className="an-page-bar"
                        style={{ width: `${Math.round((p.views / maxPageViews) * 100)}%` }}
                      />
                    </div>
                    <span className="an-page-views">{p.views.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="an-card an-device-card">
          <div className="an-card-header">
            <h2 className="an-card-title">Devices</h2>
            <p className="an-card-sub">By page views ({days}d)</p>
          </div>
          {loading ? (
            <Skeleton h={160} radius={8} />
          ) : devices.total === 0 ? (
            <div className="an-empty">No device data yet.</div>
          ) : (
            <>
              <div className="an-pie-wrap">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={devices.breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="views"
                    >
                      {devices.breakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={DEVICE_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value.toLocaleString()} views`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="an-device-legend">
                {devices.breakdown.map((d, i) => (
                  <div key={i} className="an-device-row">
                    <div className="an-device-left">
                      <span
                        className="an-device-dot"
                        style={{ background: DEVICE_COLORS[d.name] || PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <DeviceIcon type={d.name} />
                      <span className="an-device-name">{d.name}</span>
                    </div>
                    <div className="an-device-right">
                      <span className="an-device-pct">{d.percent}%</span>
                      <span className="an-device-views">{d.views.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Countries */}
        <div className="an-card an-countries-card">
          <div className="an-card-header">
            <h2 className="an-card-title">Top Countries</h2>
            <p className="an-card-sub">
              Requires Cloudflare CDN for country detection.
            </p>
          </div>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="an-country-row">
                <Skeleton h={14} w="70%" />
                <Skeleton h={14} w="15%" />
              </div>
            ))
          ) : countries.length === 0 ? (
            <div className="an-empty">
              No country data yet.
              <br />
              <small>Country tracking requires Cloudflare proxy.</small>
            </div>
          ) : (
            <div className="an-country-list">
              {countries.map((c, i) => (
                <div key={i} className="an-country-row">
                  <div className="an-country-left">
                    <span className="an-country-rank">#{i + 1}</span>
                    <span className="an-country-flag">
                      {/* Use emoji flag from country code */}
                      {c.country
                        ? String.fromCodePoint(
                            ...[...c.country.toUpperCase()].map(ch => 0x1F1E0 - 65 + ch.charCodeAt(0))
                          )
                        : '🌐'}
                    </span>
                    <span className="an-country-name">{c.country || 'Unknown'}</span>
                  </div>
                  <span className="an-country-views">{c.views.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>{/* end an-bottom-row */}

      {/* ── DATA NOTE ── */}
      <p className="an-note">
        🔒 Analytics are admin-only. Visitor IPs are hashed daily and never stored in plain text. Data auto-deletes after 90 days.
      </p>

    </div>
  );
};

export default Analytics;
