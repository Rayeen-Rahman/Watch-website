import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Package, Users, ShoppingCart,
  Tag, Layers,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin',            icon: Home,         label: 'Dashboard', end: true },
      { to: '/admin/orders',     icon: ShoppingCart,  label: 'Orders'               },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/products',   icon: Package,       label: 'Products'             },
      { to: '/admin/categories', icon: Tag,           label: 'Categories'           },
      { to: '/admin/inventory',  icon: Layers,        label: 'Inventory'            },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/users',      icon: Users,         label: 'Users'                },
    ],
  },
];

const Sidebar = ({ collapsed, onOpenAddProduct, onOpenAddCategory, onOpenAddUser }) => {
  const { user } = useAuth();

  return (
    <div className={`admin-sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>

      {/* Logo */}
      <div className="sidebar-logo">
        <img
          src="/logo.png"
          alt="Artifact BD"
          style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }}
        />
        {!collapsed && <h2>Artifact BD</h2>}
      </div>

      {/* Quick-action buttons */}
      {!collapsed && (
        <div className="sidebar-quick-actions">
          <button className="quick-action-btn" onClick={onOpenAddProduct}>
            + Product
          </button>
          <button className="quick-action-btn" onClick={onOpenAddCategory}>
            + Category
          </button>
          <button className="quick-action-btn" onClick={onOpenAddUser}>
            + User
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="sidebar-menu">
        {NAV_SECTIONS.map(section => (
          <div key={section.label} className="sidebar-section">
            {!collapsed && (
              <span className="menu-title">{section.label}</span>
            )}
            {section.items.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Footer — shows logged-in user info */}
      <div className="sidebar-footer">
        <div className="user-avatar">
          {user?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              {user?.name || 'Admin'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>
              {user?.role === 'admin' ? 'Administrator' : user?.role || 'Staff'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
