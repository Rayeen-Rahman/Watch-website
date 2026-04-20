import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, Users, DollarSign, ListTodo } from 'lucide-react';
import './DashboardHome.css';

const DashboardHome = () => {
  // Mock data specifically for the charts as requested by plan
  const revenueData = [
    { name: 'Mon', revenue: 400 },
    { name: 'Tue', revenue: 300 },
    { name: 'Wed', revenue: 550 },
    { name: 'Thu', revenue: 200 },
    { name: 'Fri', revenue: 700 },
    { name: 'Sat', revenue: 900 },
    { name: 'Sun', revenue: 650 },
  ];

  const visitorData = [
    { name: '10am', visitors: 120 },
    { name: '12pm', visitors: 300 },
    { name: '2pm', visitors: 450 },
    { name: '4pm', visitors: 200 },
    { name: '6pm', visitors: 600 },
  ];

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
              <h3>$14,230.50</h3>
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
                <BarChart data={revenueData}>
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip cursor={{fill: '#222'}} contentStyle={{backgroundColor: '#111', border: '1px solid #333'}} />
                  <Bar dataKey="revenue" fill="#FFFFFF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container">
            <h3>Live Visitors</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{backgroundColor: '#111', border: '1px solid #333'}} />
                  <Line type="monotone" dataKey="visitors" stroke="#22C55E" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="bottom-row">
          <div className="dashboard-list-card">
            <h3>Latest Transactions</h3>
            <ul className="dash-list">
              <li><span>Order #1A2B</span> <strong>$299.99</strong></li>
              <li><span>Order #8F9A</span> <strong>$159.00</strong></li>
              <li><span>Order #4C5D</span> <strong>$420.00</strong></li>
            </ul>
          </div>
          
          <div className="dashboard-list-card">
            <h3>Popular Products</h3>
            <ul className="dash-list">
              <li><span>Chronograph Obsidian</span> <strong>45 Sold</strong></li>
              <li><span>Silver Horizon</span> <strong>32 Sold</strong></li>
              <li><span>Sapphire Night</span> <strong>28 Sold</strong></li>
            </ul>
          </div>

          <div className="dashboard-list-card">
            <h3><ListTodo size={18} style={{marginRight: '8px'}}/> Todo List</h3>
            <ul className="dash-list todo-list">
              <li><input type="checkbox" /> Restock Chronograph series</li>
              <li><input type="checkbox" /> Verify pending orders</li>
              <li><input type="checkbox" /> Launch new layout</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardHome;
