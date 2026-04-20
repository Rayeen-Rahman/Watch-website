import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { cartCount, setIsCartOpen } = useCart();

  return (
    <>
      {/* Step 22: Top Campaign Bar */}
      <div className="campaign-bar">
        🚚 Free Delivery in Dhaka on orders above ৳2000
      </div>

      <nav className="store-navbar">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">W</div>
          WATCH<span>STORE</span>
        </Link>

        {/* Step 23: Center Search Bar */}
        <div className="navbar-search">
          <input type="text" placeholder="Search for premium watches..." />
          <button className="search-submit"><Search size={18} /></button>
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
