import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Inbox, Calendar, Search, Settings, Package, Users, ShoppingCart } from 'lucide-react';

const Sidebar = ({ collapsed, onOpenAddProduct, onOpenAddCategory, onOpenAddUser }) => {
  return (
    <div className={`admin-sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div style={{width:'30px', height:'30px', backgroundColor:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
          <span style={{color:'#000', fontWeight:'bold', fontSize:'14px'}}>W</span>
        </div>
        {!collapsed && <h2>WATCH Admin</h2>}
      </div>

      <div className="sidebar-menu">
        {!collapsed && <span className="menu-title">Application</span>}
        <NavLink to="/admin" end className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Home">
          <Home size={18}/>{!collapsed && ' Home'}
        </NavLink>
        <NavLink to="/admin/inbox" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Inbox">
          <Inbox size={18}/>{!collapsed && ' Inbox'}
        </NavLink>
        <NavLink to="/admin/calendar" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Calendar">
          <Calendar size={18}/>{!collapsed && ' Calendar'}
        </NavLink>
        <NavLink to="/admin/search" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Search">
          <Search size={18}/>{!collapsed && ' Search'}
        </NavLink>
        <NavLink to="/admin/settings" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="Settings">
          <Settings size={18}/>{!collapsed && ' Settings'}
        </NavLink>

        {!collapsed && <span className="menu-title">Products</span>}
        <NavLink to="/admin/products" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="All Products">
          <Package size={18}/>{!collapsed && ' See All Products'}
        </NavLink>
        <div className="menu-item" style={{cursor:'pointer'}} onClick={onOpenAddProduct} title="Add Product">
          <span className="icon-plus">+</span>{!collapsed && ' Add Product'}
        </div>
        <div className="menu-item" style={{cursor:'pointer'}} onClick={onOpenAddCategory} title="Add Category">
          <span className="icon-plus">+</span>{!collapsed && ' Add Category'}
        </div>

        {!collapsed && <span className="menu-title">Users</span>}
        <NavLink to="/admin/users" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="All Users">
          <Users size={18}/>{!collapsed && ' See All Users'}
        </NavLink>
        <div className="menu-item" style={{cursor:'pointer'}} onClick={onOpenAddUser} title="Add User"><span className="icon-plus">+</span>{!collapsed && ' Add User'}</div>

        {!collapsed && <span className="menu-title">Orders / Payments</span>}
        <NavLink to="/admin/orders" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`} title="All Orders">
          <ShoppingCart size={18}/>{!collapsed && ' See All Transactions'}
        </NavLink>
        <div className="menu-item" title="Add Order"><span className="icon-plus">+</span>{!collapsed && ' Add Order'}</div>
      </div>

      <div className="sidebar-footer">
        <div className="user-avatar">J</div>
        {!collapsed && (
          <div>
            <div style={{fontSize:'0.9rem'}}>John Doe</div>
            <div style={{fontSize:'0.75rem', color:'var(--admin-text-secondary)'}}>Admin</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
