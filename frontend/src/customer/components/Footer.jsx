import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Banknote, RefreshCcw, ArrowRight, Globe, Share2, Mail } from 'lucide-react';


const API = import.meta.env.VITE_API_URL;

const Footer = () => {
  const [categories, setCategories] = useState([]);

  // Step 35: Load real categories for the Explore column
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d.slice(0, 5) : []))
      .catch(() => {});
  }, []);

  return (
    <footer className="store-footer">

      {/* ── Trust Section ─────────────────────────────────────────────────── */}
      <div className="trust-features-section">
        <div className="trust-feature">
          <Truck strokeWidth={1.5} size={36} />
          <div className="trust-text">
            <strong>Fast Delivery</strong>
            <span>Secure &amp; tracked shipping</span>
          </div>
        </div>
        <div className="trust-feature"
          style={{ borderLeft: '1px solid var(--store-border)', borderRight: '1px solid var(--store-border)' }}>
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

      {/* ── Footer Columns ────────────────────────────────────────────────── */}
      <div className="footer-content">

        {/* Col 1: Brand */}
        <div className="footer-col">
          <Link to="/" className="footer-brand-logo">WATCH VAULT</Link>
          <p style={{ color: 'var(--store-text-light)', fontSize: '0.88rem', lineHeight: '1.7', marginTop: '14px', marginBottom: '20px' }}>
            Crafting timeless pieces for the modern individual. Designed with precision, worn with purpose.
          </p>
          {/* Social icons */}
          <div className="footer-social">
            <a href="#" aria-label="Email"   className="social-icon"><Mail   size={18} strokeWidth={1.5} /></a>
            <a href="#" aria-label="Website" className="social-icon"><Globe  size={18} strokeWidth={1.5} /></a>
            <a href="#" aria-label="Share"   className="social-icon"><Share2 size={18} strokeWidth={1.5} /></a>
          </div>

        </div>

        {/* Col 2: Collections — Step 35: real dynamic categories */}
        <div className="footer-col">
          <h4>Collections</h4>
          <ul>
            <li><Link to="/category/all">All Watches</Link></li>
            {categories.map(c => (
              <li key={c._id}>
                <Link to={`/category/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Customer Care */}
        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul>
            <li><Link to="/category/all">Shop All</Link></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#shipping">Shipping &amp; Returns</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ul>
        </div>

        {/* Col 4: Newsletter */}
        <div className="footer-col">
          <h4>The Atelier Journal</h4>
          <p style={{ color: 'var(--store-text-light)', fontSize: '0.88rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            Stay updated on new releases and exclusive offers.
          </p>
          <div className="newsletter-form">
            <input type="email" placeholder="Email address…" />
            <button aria-label="Subscribe"><ArrowRight size={16} /></button>
          </div>
          <p style={{ color: 'var(--store-text-light)', fontSize: '0.75rem', marginTop: '10px', lineHeight: 1.4 }}>
            By subscribing you agree to our privacy policy. No spam, ever.
          </p>
        </div>

      </div>

      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Watch Vault. All rights reserved. Made with ❤️ in Bangladesh.
      </div>
    </footer>
  );
};

export default Footer;
