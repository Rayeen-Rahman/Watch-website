import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Banknote, RefreshCcw, ArrowRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="store-footer">

      {/* Trust Section */}
      <div className="trust-features-section">
        <div className="trust-feature">
          <Truck strokeWidth={1.5} size={36} />
          <div className="trust-text">
            <strong>Fast Delivery</strong>
            <span>Secure &amp; tracked shipping</span>
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

      {/* Footer Columns — Step 40 */}
      <div className="footer-content">

        {/* Col 1: Brand */}
        <div className="footer-col">
          <Link to="/" className="footer-brand-logo">
            WATCH VAULT
          </Link>
          <p style={{color: 'var(--store-text-light)', fontSize: '0.88rem', lineHeight: '1.7', marginTop: '14px'}}>
            Crafting timeless pieces for the modern man. Designed with precision, worn with purpose.
          </p>
        </div>

        {/* Col 2: Explore */}
        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Shop</Link></li>
            <li><Link to="/category/all">Collections</Link></li>
            <li><Link to="/heritage">Heritage</Link></li>
            <li><Link to="/journal">Journal</Link></li>
          </ul>
        </div>

        {/* Col 3: Customer Care */}
        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/shipping">Shipping &amp; Returns</Link></li>
            <li><Link to="/faq">Care Guide</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        {/* Col 4: Newsletter — Step 40 */}
        <div className="footer-col">
          <h4>The Atelier Journal</h4>
          <p style={{color: 'var(--store-text-light)', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 16px 0'}}>
            Stay updated on new releases and exclusive offers.
          </p>
          <div className="newsletter-form">
            <input type="email" placeholder="Email address..." />
            <button aria-label="Subscribe"><ArrowRight size={16} /></button>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Watch Vault. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
