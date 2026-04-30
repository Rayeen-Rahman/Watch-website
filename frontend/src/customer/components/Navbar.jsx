import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoginModal from './LoginModal';

const API = import.meta.env.VITE_API_URL;

const Navbar = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout }             = useAuth();
  const navigate = useNavigate();

  const [categories,   setCategories]   = useState([]);
  const [showLogin,    setShowLogin]    = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userMenuRef = useRef(null);

  // Fetch categories
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => {});
  }, []);

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

  return (
    <>
      {/* ── Campaign Bar ── */}
      <div className="campaign-bar">
        🚚 Free Delivery in Dhaka on orders above ৳2,000
      </div>

      {/* ── Main Navbar ── */}
      <nav className="store-navbar">

        {/* Logo */}
        <Link to="/" className="navbar-logo" style={{ letterSpacing: '2px', fontSize: '1.2rem', fontWeight: '800' }}>
          WATCH
        </Link>

        {/* ── Category Nav (minimalist) ── */}
        <nav className="navbar-cats" style={{ gap: '20px' }}>
          <Link to="/category/all" className="nav-cat-link">All Watches</Link>
          {categories.slice(0, 2).map(c => (
            <Link key={c._id} to={`/category/${c.slug}`} className="nav-cat-link">
              {c.name}
            </Link>
          ))}
        </nav>

        {/* ── Right icons ── */}
        <div className="navbar-icons">

          {/* Cart */}
          <button
            className="icon-btn cart-btn"
            aria-label="Open cart"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          {/* Not logged in → small Login button */}
          {!user && (
            <button
              className="btn-navbar-login"
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>
          )}

          {/* Logged in → User avatar + dropdown */}
          {user && (
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                className="btn-user-avatar"
                onClick={() => setShowUserMenu(m => !m)}
                aria-label="User menu"
              >
                <User size={15} />
                <span className="navbar-username">{user.name?.split(' ')[0]}</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
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

        </div>
      </nav>

      {/* ── Login Modal ── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Navbar;
