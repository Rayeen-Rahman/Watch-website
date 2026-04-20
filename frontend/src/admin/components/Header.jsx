import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, MessageSquare, Moon, Sun, Menu } from 'lucide-react';

const Header = ({ onToggleSidebar }) => {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);

  const formatTitle = (pathname) => {
    if (pathname === '/admin') return 'Dashboard';
    const parts = pathname.split('/');
    const current = parts[parts.length - 1];
    return current.charAt(0).toUpperCase() + current.slice(1);
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

      {/* Right: actions */}
      <div className="header-actions">
        <button
          className="header-icon-btn"
          onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="header-icon-btn" title="Messages">
          <MessageSquare size={18} />
        </button>
        <button className="header-icon-btn" title="Notifications">
          <Bell size={18} />
        </button>
        {/* User avatar */}
        <div className="header-avatar" title="Admin User">J</div>
      </div>
    </div>
  );
};

export default Header;
