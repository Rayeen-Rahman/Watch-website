import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { cartCount, setIsCartOpen } = useCart();

  return (
    <>
      {/* Campaign Bar */}
      <div className="campaign-bar">
        🚚 Free Delivery in Dhaka on orders above ৳2000
      </div>

      <nav className="store-navbar">
        {/* Step 33: Diamond SVG logo */}
        <Link to="/" className="navbar-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="14" y="1" width="18" height="18" rx="2" transform="rotate(45 14 1)" fill="none" stroke="currentColor" strokeWidth="2"/>
            <rect x="14" y="7" width="10" height="10" rx="1" transform="rotate(45 14 7)" fill="currentColor" opacity="0.3"/>
          </svg>
          WATCH
        </Link>

        {/* Step 33: Redesigned search bar — dark border + black button */}
        <div className="navbar-search">
          <input type="text" placeholder="Search Product" />
          <button className="search-submit">
            <Search size={16} />
          </button>
        </div>

        <div className="navbar-icons">
          <button className="icon-btn" aria-label="User Account">
            <User size={22} strokeWidth={1.5} />
          </button>
          <button className="icon-btn" aria-label="Cart" onClick={() => setIsCartOpen(true)}>
            <ShoppingBag size={22} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>
    </>
  );
};
export default Navbar;
