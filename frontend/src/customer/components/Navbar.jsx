import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, X, Menu, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import LoginModal from './LoginModal';

const API = import.meta.env.VITE_API_URL;

const Navbar = () => {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, logout }             = useAuth();
  const navigate = useNavigate();

  const [searchQuery,  setSearchQuery]  = useState('');
  const [categories,   setCategories]   = useState([]);
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [catDropOpen,  setCatDropOpen]  = useState(false);
  const [showLogin,    setShowLogin]    = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const dropRef     = useRef(null);
  const userMenuRef = useRef(null);
  const inputRef    = useRef(null);

  // ── Fetch categories for nav links ──────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setCatDropOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/category/all?search=${encodeURIComponent(q)}`);
      setSearchQuery('');
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <>
      {/* ── Campaign Bar ──────────────────────────────────────────────────── */}
      <div className="campaign-bar">
        🚚 Free Delivery in Dhaka on orders above ৳2,000
      </div>

      {/* ── Main Navbar ───────────────────────────────────────────────────── */}
      <nav className="store-navbar">

        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="14" y="1" width="18" height="18" rx="2"
              transform="rotate(45 14 1)" fill="none" stroke="currentColor" strokeWidth="2"/>
            <rect x="14" y="7" width="10" height="10" rx="1"
              transform="rotate(45 14 7)" fill="currentColor" opacity="0.3"/>
          </svg>
          WATCH
        </Link>

        {/* ── Desktop Search ─────────────────────────────────────────────── */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search watches, brands…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search"
          />
          {searchQuery && (
            <button type="button" className="search-clear-btn"
              onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}>
              <X size={14} />
            </button>
          )}
          <button type="submit" className="search-submit" aria-label="Submit search">
            <Search size={16} />
          </button>
        </form>

        {/* ── Desktop Category Nav ──────────────────────────────────────── */}
        <div className="navbar-cats">
          <Link to="/category/all" className="nav-cat-link">All</Link>
          {categories.slice(0, 4).map(c => (
            <Link key={c._id} to={`/category/${c.slug}`} className="nav-cat-link">
              {c.name}
            </Link>
          ))}
          {categories.length > 4 && (
            <div className="cat-more-wrap" ref={dropRef}>
              <button
                className="nav-cat-link nav-cat-more"
                onClick={() => setCatDropOpen(p => !p)}
              >
                More <ChevronDown size={13} />
              </button>
              {catDropOpen && (
                <div className="cat-dropdown">
                  {categories.slice(4).map(c => (
                    <Link key={c._id} to={`/category/${c.slug}`}
                      className="cat-dropdown-link"
                      onClick={() => setCatDropOpen(false)}>
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Auth + Cart icons ─────────────────────────────────────────── */}
        <div className="navbar-icons">

          {/* Cart */}
          <button
            className="icon-btn cart-btn"
            aria-label="Open cart"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingBag size={22} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          {/* Not logged in → Login button */}
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
                <User size={18} />
                <span className="navbar-username">{user.name?.split(' ')[0]}</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <Link to="/orders"  onClick={() => setShowUserMenu(false)}>My Orders</Link>
                  <Link to="/profile" onClick={() => setShowUserMenu(false)}>Profile</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setShowUserMenu(false)}>
                      <Settings size={14} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="dropdown-logout">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="icon-btn mobile-menu-btn"
            aria-label="Menu"
            onClick={() => setMenuOpen(p => !p)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ───────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="mobile-menu">
          <form className="mobile-search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search watches…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit"><Search size={16} /></button>
          </form>
          <nav className="mobile-nav-links">
            <Link to="/category/all" onClick={() => setMenuOpen(false)}>All Watches</Link>
            {categories.map(c => (
              <Link key={c._id} to={`/category/${c.slug}`}
                onClick={() => setMenuOpen(false)}>
                {c.name}
              </Link>
            ))}
          </nav>
          {/* Mobile auth section */}
          <div className="mobile-auth">
            {!user ? (
              <button className="btn-navbar-login" onClick={() => { setShowLogin(true); setMenuOpen(false); }}>
                Login / Register
              </button>
            ) : (
              <div className="mobile-user-info">
                <span>👤 {user.name}</span>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="mobile-logout-btn">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Login Modal ───────────────────────────────────────────────────── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};

export default Navbar;
