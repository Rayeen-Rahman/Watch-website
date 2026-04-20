import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Inbox, Calendar, Search, Settings, Package, Users, ShoppingCart } from 'lucide-react';

const Sidebar = ({ onOpenAddProduct, onOpenAddCategory }) => {
  return (
    <div className="admin-sidebar">
      <div className="sidebar-logo">
        <div style={{width:'30px', height:'30px', backgroundColor:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <span style={{color:'#000', fontWeight:'bold', fontSize:'14px'}}>W</span>
        </div>
        <h2>WATCH Admin</h2>
      </div>
      
      <div className="sidebar-menu">
        <span className="menu-title">Application</span>
        <NavLink to="/admin" end className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}><Home size={18}/> Home</NavLink>
        <NavLink to="/admin/inbox" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}><Inbox size={18}/> Inbox</NavLink>
        <NavLink to="/admin/calendar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}><Calendar size={18}/> Calendar</NavLink>
        <NavLink to="/admin/search" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}><Search size={18}/> Search</NavLink>
        <NavLink to="/admin/settings" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}><Settings size={18}/> Settings</NavLink>

        <span className="menu-title">Products</span>
        <NavLink to="/admin/products" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}><Package size={18}/> See All Products</NavLink>
        <div className="menu-item" style={{cursor:'pointer'}} onClick={onOpenAddProduct}><span className="icon-plus">+</span> Add Product</div>
        <div className="menu-item" style={{cursor:'pointer'}} onClick={onOpenAddCategory}><span className="icon-plus">+</span> Add Category</div>

        <span className="menu-title">Users</span>
        <NavLink to="/admin/users" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}><Users size={18}/> See All Users</NavLink>
        <div className="menu-item"><span className="icon-plus">+</span> Add User</div>

        <span className="menu-title">Orders / Payments</span>
        <NavLink to="/admin/orders" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}><ShoppingCart size={18}/> See All Transactions</NavLink>
        <div className="menu-item"><span className="icon-plus">+</span> Add Order</div>
      </div>

      <div className="sidebar-footer">
         <div className="user-avatar">J</div>
         <div>
            <div style={{fontSize:'0.9rem'}}>John Doe</div>
            <div style={{fontSize:'0.75rem', color:'var(--admin-text-secondary)'}}>Admin</div>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;
