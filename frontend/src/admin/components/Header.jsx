import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

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

      {/* Right: user avatar */}
      <div className="header-actions">
        <div className="header-avatar" title={user?.name || 'Admin User'}>
          {avatarInitial}
        </div>
      </div>
    </div>
  );
};

export default Header;
