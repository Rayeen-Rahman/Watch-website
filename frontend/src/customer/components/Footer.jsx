import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Banknote, RefreshCcw } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="store-footer">
      <div className="trust-features-section">
        <div className="trust-feature">
          <Truck strokeWidth={1.5} size={36} />
          <div className="trust-text">
            <strong>Fast Delivery</strong>
            <span>Secure & tracked shipping</span>
          </div>
        </div>
        <div className="trust-feature" style={{borderLeft: '1px solid var(--store-border)', borderRight: '1px solid var(--store-border)'}}>
          <Banknote strokeWidth={1.5} size={36} />
          <div className="trust-text">
            <strong>Cash on Delivery</strong>
            <span>Pay directly at your door</span>
          </div>
        </div>
        <div className="trust-feature">
          <RefreshCcw strokeWidth={1.5} size={36} />
          <div className="trust-text">
            <strong>Easy Exchange</strong>
            <span>7-day hassle free return</span>
          </div>
        </div>
      </div>

      <div className="footer-content">
        <div className="footer-col">
          <Link to="/" className="navbar-logo" style={{marginBottom: '20px'}}>
            <div className="logo-icon">W</div>
            WATCH<span>STORE</span>
          </Link>
          <p style={{color: 'var(--store-text-light)', fontSize: '0.9rem', lineHeight: '1.6'}}>
            Premium timepieces engineered for exact precision and aesthetic perfection.
          </p>
        </div>
        
        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/category/men">Men's Watches</Link></li>
            <li><Link to="/category/women">Women's Watches</Link></li>
            <li><Link to="/category/smartwatches">Smartwatches</Link></li>
            <li><Link to="/category/new">New Arrivals</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Support</h4>
          <ul>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/shipping">Shipping & Returns</Link></li>
            <li><Link to="/warranty">Warranty</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Watch Store Inc. All rights reserved. (Demo)
      </div>
    </footer>
  );
};

export default Footer;
