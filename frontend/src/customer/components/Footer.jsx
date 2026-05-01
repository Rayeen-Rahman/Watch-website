import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Banknote, RefreshCcw, ArrowRight, Mail } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [email, setEmail]           = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d.slice(0, 5) : []))
      .catch(() => {});
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Store locally for now (no backend email service yet)
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="store-footer">

      {/* ──────────────────────────────────────────────────────────────────────────────────────────── */}
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

      {/* ──────────────────────────────────────────────────────────────────────────────────────────── */}
      <div className="footer-content">

        {/* Col 1: Brand */}
        <div className="footer-col">
          <Link to="/" className="footer-brand-logo">WATCH VAULT</Link>
          <p className="footer-brand-desc">
            Crafting timeless pieces for the modern individual. Designed with precision, worn with purpose.
          </p>
          <div className="footer-social">
            <a href="mailto:hello@watchvault.com" aria-label="Email" className="social-icon"><Mail size={16} strokeWidth={1.5} /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
          </div>
        </div>

        {/* Col 2: Collections */}
        <div className="footer-col">
          <h4>Collections</h4>
          <ul>
            <li><Link to="/category/all">All Watches</Link></li>
            {categories.map(c => (
              <li key={c._id}><Link to={`/category/${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </div>

        {/* Col 3: Customer Care — link to real pages */}
        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul>
            <li><Link to="/category/all">Shop All</Link></li>
            <li><Link to="/info/faq">FAQ</Link></li>
            <li><Link to="/info/shipping">Shipping &amp; Returns</Link></li>
            <li><Link to="/info/privacy">Privacy Policy</Link></li>
            <li><Link to="/info/contact">Contact Us</Link></li>
          </ul>
        </div>

        {/* Col 4: Newsletter */}
        <div className="footer-col">
          <h4>The Atelier Journal</h4>
          <p className="footer-newsletter-desc">
            Stay updated on new releases and exclusive offers.
          </p>
          {subscribed ? (
            <p className="footer-subscribed">✓ You're subscribed! Thank you.</p>
          ) : (
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Email address…"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                aria-label="Email for newsletter"
              />
              <button type="submit" aria-label="Subscribe">
                <ArrowRight size={16} />
              </button>
            </form>
          )}
          <p className="footer-privacy-note">
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
