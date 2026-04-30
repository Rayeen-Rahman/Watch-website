import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Settings, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoginModal from './LoginModal';

const API = import.meta.env.VITE_API_URL;

const Navbar = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout }             = useAuth();
  const navigate = useNavigate();

  const [showLogin,      setShowLogin]      = useState(false);
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [mobileSearch,   setMobileSearch]   = useState(false);
  const [mobileQuery,    setMobileQuery]    = useState('');

  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) navigate(`/category/all?search=${encodeURIComponent(q)}`);
  };

  const handleMobileSearch = (e) => {
    e.preventDefault();
    const q = mobileQuery.trim();
    if (q) {
      navigate(`/category/all?search=${encodeURIComponent(q)}`);
      setMobileSearch(false);
      setMobileQuery('');
    }
  };

  return (
    <>
      {/* ── Campaign Bar ── */}
      <div className="campaign-bar">
        🚚 Free Delivery in Dhaka on orders above ৳2,000
      </div>

      {/* ── Main Navbar ── */}
      <nav className="store-navbar">

        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect x="14" y="1" width="18" height="18" rx="2"
              transform="rotate(45 14 1)" fill="none" stroke="currentColor" strokeWidth="2"/>
            <rect x="14" y="7" width="10" height="10" rx="1"
              transform="rotate(45 14 7)" fill="currentColor" opacity="0.9"/>
          </svg>
          WATCH
        </Link>

        {/* ── Center Search Bar ── */}
        <form className="navbar-search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search Product"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit" className="search-submit" aria-label="Submit search">
            <Search size={16} />
          </button>
        </form>

        {/* ── Right icons ── */}
        <div className="navbar-icons">

          {/* Mobile only: Search toggle icon */}
          <button
            className="icon-btn mobile-search-toggle"
            aria-label="Search"
            onClick={() => setMobileSearch(s => !s)}
          >
            <Search size={20} strokeWidth={1.5} />
          </button>

          {/* User icon or Login */}
          {!user ? (
            <button
              className="icon-btn"
              aria-label="Login"
              onClick={() => setShowLogin(true)}
            >
              <User size={20} strokeWidth={1.5} />
            </button>
          ) : (
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                className="icon-btn"
                onClick={() => setShowUserMenu(m => !m)}
                aria-label="User menu"
              >
                <User size={20} strokeWidth={1.5} />
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-user-name">{user.name?.split(' ')[0]}</div>
                  <Link to="/orders"  onClick={() => setShowUserMenu(false)}>My Orders</Link>
                  <Link to="/profile" onClick={() => setShowUserMenu(false)}>Profile</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setShowUserMenu(false)}>
                      <Settings size={13} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="dropdown-logout">
                    <LogOut size={13} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cart */}
          <button
            className="icon-btn cart-btn"
            aria-label="Open cart"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

        </div>
      </nav>

      {/* \u2500\u2500 Mobile Search Bar (slides below navbar) \u2500\u2500 */}
      {mobileSearch && (
        <div className="mobile-search-bar">
          <form onSubmit={handleMobileSearch} role="search">
            <input
              type="search"
              placeholder="Search watches…"
              value={mobileQuery}
              onChange={e => setMobileQuery(e.target.value)}
              autoFocus
              aria-label="Mobile search"
            />
            <button type="submit" aria-label="Submit search">
              <Search size={16} />
            </button>
          </form>
        </div>
      )}

      {/* \u2500\u2500 Login Modal \u2500\u2500 */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Navbar;
