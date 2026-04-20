import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, MessageSquare, Moon } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  
  // Format the title based on the path
  const formatTitle = (pathname) => {
    if (pathname === '/admin') return 'Dashboard';
    const parts = pathname.split('/');
    const current = parts[parts.length - 1];
    return current.charAt(0).toUpperCase() + current.slice(1);
  };

  return (
    <div className="admin-header">
      <div className="header-title">
        {formatTitle(location.pathname)}
      </div>
      <div className="header-actions">
         <MessageSquare size={20} color="var(--admin-text-secondary)" />
         <Bell size={20} color="var(--admin-text-secondary)" />
         <Moon size={20} color="var(--admin-text-secondary)" />
      </div>
    </div>
  );
};

export default Header;
