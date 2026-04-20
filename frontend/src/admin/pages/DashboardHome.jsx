import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, ListTodo } from 'lucide-react';
import './DashboardHome.css';

const DashboardHome = () => {
  // Mock data specifically for the charts as requested by plan
  const revenueData = [
    { name: 'Mon', orders: 400, successful: 320 },
    { name: 'Tue', orders: 300, successful: 250 },
    { name: 'Wed', orders: 550, successful: 480 },
    { name: 'Thu', orders: 200, successful: 160 },
    { name: 'Fri', orders: 700, successful: 610 },
    { name: 'Sat', orders: 900, successful: 780 },
    { name: 'Sun', orders: 650, successful: 540 },
  ];

  const visitorDonutData = [
    { name: 'Direct', value: 400 },
    { name: 'Social', value: 300 },
    { name: 'Email', value: 200 },
    { name: 'Other', value: 100 },
  ];
  const DONUT_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#3A3A3A'];
  const totalVisitors = visitorDonutData.reduce((a, b) => a + b.value, 0);

  const totalVisitorsData = [
    { name: 'Mon', mobile: 120, desktop: 200 },
    { name: 'Tue', mobile: 200, desktop: 300 },
    { name: 'Wed', mobile: 150, desktop: 400 },
    { name: 'Thu', mobile: 280, desktop: 350 },
    { name: 'Fri', mobile: 320, desktop: 500 },
    { name: 'Sat', mobile: 390, desktop: 620 },
    { name: 'Sun', mobile: 250, desktop: 480 },
  ];

  const transactions = [
    { id: '#1A2B', name: 'Ahmad Reza', initials: 'AR', amount: '৳29,999', status: 'Completed' },
    { id: '#8F9A', name: 'Mina Khan',  initials: 'MK', amount: '৳15,900', status: 'Completed' },
    { id: '#4C5D', name: 'Omar Faruq', initials: 'OF', amount: '৳42,000', status: 'Pending'   },
    { id: '#2E3F', name: 'Sadia Islam', initials: 'SI', amount: '৳18,500', status: 'Completed' },
  ];

  const popularProducts = [
    { name: 'Chronograph Obsidian', price: '৳45,000', sold: 45, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop' },
    { name: 'Silver Horizon', price: '৳32,000', sold: 32, img: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=80&h=80&fit=crop' },
    { name: 'Sapphire Night', price: '৳28,500', sold: 28, img: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=80&h=80&fit=crop' },
  ];

  const today = new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' });



  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{margin:0, fontWeight: 500}}>Admin Dashboard</h2>
      </div>

      <div className="dashboard-grid">
        
        {/* KPI Cards */}
        <div className="kpi-cards-row">
          <div className="kpi-card">
            <div className="kpi-icon"><DollarSign size={24} /></div>
            <div className="kpi-info">
              <p>Total Revenue</p>
              <h3>৳14,230.50</h3>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon"><TrendingUp size={24} /></div>
            <div className="kpi-info">
              <p>Sales Today</p>
              <h3>24 Orders</h3>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon"><Users size={24} /></div>
            <div className="kpi-info">
              <p>Active Users</p>
              <h3>1,420</h3>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <div className="chart-container">
            <h3>Revenue (Last 7 Days)</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} barGap={4}>
                  <XAxis dataKey="name" stroke="#666" tick={{fontSize:12}} />
                  <YAxis stroke="#666" tick={{fontSize:12}} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#111', border: '1px solid #333', borderRadius:'8px'}} />
                  <Legend wrapperStyle={{paddingTop:'16px', color:'#A1A1A1', fontSize:'0.8rem'}} />
                  <Bar dataKey="orders" name="Orders" fill="#FFFFFF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="successful" name="Successful" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Step 47: Donut Chart - Visitor Breakdown */}
          <div className="chart-container">
            <h3>Visitor Breakdown</h3>
            <div className="chart-wrapper donut-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visitorDonutData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {visitorDonutData.map((entry, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor:'#111',border:'1px solid #333',borderRadius:'8px'}} />
                  <Legend wrapperStyle={{color:'#A1A1A1',fontSize:'0.8rem'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-label">
                <span className="donut-total">{totalVisitors.toLocaleString()}</span>
                <span className="donut-caption">Total</span>
              </div>
            </div>
            <p className="chart-trend">↑ Trending up by 5.2% this month</p>
          </div>
        </div>

        {/* Bottom Row - Steps 48, 50, 51 */}
        <div className="bottom-row">
          {/* Step 48: Transactions with avatars */}
          <div className="dashboard-list-card">
            <h3>Latest Transactions</h3>
            <div className="transaction-list">
              {transactions.map(t => (
                <div key={t.id} className="transaction-row">
                  <div className="tx-avatar">{t.initials}</div>
                  <div className="tx-info">
                    <span className="tx-name">{t.name}</span>
                    <span className="tx-sub">Order Payment · {t.id}</span>
                  </div>
                  <div className="tx-right">
                    <span className="tx-amount">{t.amount}</span>
                    <span className={`tx-status ${t.status === 'Pending' ? 'tx-pending' : 'tx-done'}`}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 50: Popular Products with thumbnails */}
          <div className="dashboard-list-card">
            <h3>Popular Products</h3>
            <div className="product-thumb-list">
              {popularProducts.map((p, i) => (
                <div key={i} className="product-thumb-row">
                  <img src={p.img} alt={p.name} className="product-thumb" />
                  <div className="product-thumb-info">
                    <span className="product-thumb-name">{p.name}</span>
                    <span className="product-thumb-price">{p.price}</span>
                  </div>
                  <span className="product-thumb-sold">{p.sold} sold</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 51: Todo with date pill */}
          <div className="dashboard-list-card">
            <h3><ListTodo size={18} style={{marginRight: '8px'}}/> Todo List</h3>
            <div className="todo-date-pill">📅 {today}</div>
            <ul className="dash-list todo-list">
              <li><input type="checkbox" /> Restock Chronograph series</li>
              <li><input type="checkbox" /> Verify pending orders</li>
              <li><input type="checkbox" /> Launch new layout</li>
            </ul>
          </div>
        </div>

        {/* Step 49: Total Visitors dual-line chart */}
        <div className="chart-container visitors-chart-large">
          <h3>Total Visitors — Mobile vs Desktop</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={totalVisitorsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="name" stroke="#666" tick={{fontSize:12}} />
                <YAxis stroke="#666" tick={{fontSize:12}} />
                <Tooltip contentStyle={{backgroundColor:'#111',border:'1px solid #333',borderRadius:'8px'}} />
                <Legend wrapperStyle={{color:'#A1A1A1',fontSize:'0.8rem'}} />
                <Line type="monotone" dataKey="mobile" name="Mobile" stroke="#6366F1" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="desktop" name="Desktop" stroke="#22C55E" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardHome;
