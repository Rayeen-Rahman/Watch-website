import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const formatTitle = (pathname) => {
    if (pathname === '/admin') return 'Dashboard';
    const parts = pathname.split('/');
    const current = parts[parts.length - 1];
    return current.charAt(0).toUpperCase() + current.slice(1);
  };

  // Derive avatar initial from logged-in user name
  const avatarInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : 'A';

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-header">
      {/* Left: hamburger + page title */}
      <div className="header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="header-title">
          {formatTitle(location.pathname)}
        </div>
      </div>

      {/* Right: user avatar + logout */}
      <div className="header-actions">
        <div className="header-avatar" title={user?.name || 'Admin User'}>
          {avatarInitial}
        </div>
        <button
          className="header-logout-btn"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
};

export default Header;
