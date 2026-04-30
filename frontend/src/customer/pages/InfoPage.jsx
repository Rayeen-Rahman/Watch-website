import React from 'react';
import { Link } from 'react-router-dom';
import './InfoPage.css';

const InfoPage = ({ page }) => {

  const content = {
    faq: {
      title: 'Frequently Asked Questions',
      sections: [
        {
          q: 'Do you offer Cash on Delivery?',
          a: 'Yes! Cash on Delivery is available across all of Bangladesh. You pay the delivery agent directly when your order arrives.',
        },
        {
          q: 'How long does delivery take?',
          a: 'Inside Dhaka: 24–48 hours. Outside Dhaka: 3–5 business days via standard courier.',
        },
        {
          q: 'What is your return/exchange policy?',
          a: 'We offer a 7-day easy exchange policy. If your product is defective or damaged on arrival, please contact us with photos and we\'ll arrange a replacement.',
        },
        {
          q: 'Are the watches genuine?',
          a: 'Yes. All watches listed on Watch Vault are 100% authentic. We work directly with authorized distributors and brand representatives.',
        },
        {
          q: 'Can I track my order?',
          a: 'Yes. Once your order is dispatched, you will receive a tracking number via phone or email.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'Currently we accept Cash on Delivery (COD). Online payment via bKash/Nagad integration is coming soon.',
        },
      ],
    },
    shipping: {
      title: 'Shipping & Returns',
      sections: [
        {
          q: 'Delivery Areas & Timelines',
          a: 'We deliver across Bangladesh.\n\n• Inside Dhaka: 24–48 hours\n• Outside Dhaka: 3–5 business days\n\nFree delivery on orders above ৳2,000.',
        },
        {
          q: 'Shipping Costs',
          a: 'Inside Dhaka: Free on orders above ৳2,000 — otherwise ৳60.\nOutside Dhaka: ৳120 flat rate.',
        },
        {
          q: 'Exchange Policy',
          a: 'We accept exchanges within 7 days of delivery. The item must be unused, undamaged, and in its original packaging. Contact us to initiate an exchange.',
        },
        {
          q: 'Return Policy',
          a: 'We do not offer cash refunds, but will happily exchange defective or incorrect items. Photo evidence of the issue is required.',
        },
        {
          q: 'How to Request an Exchange',
          a: 'Email us at support@watchvault.com or call +880-XXXXXXXXX with your order number and a description of the issue. We will respond within 24 hours.',
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      sections: [
        {
          q: 'Information We Collect',
          a: 'We collect your name, phone number, and delivery address when you place an order. If you create an account, we also collect your email address.',
        },
        {
          q: 'How We Use Your Information',
          a: 'Your data is used solely to process and deliver your orders, and to communicate with you about your purchase. We do not sell or share your personal information with third parties.',
        },
        {
          q: 'Data Security',
          a: 'Your data is stored securely. Passwords are hashed and never stored in plain text. Payment information is processed via secure COD — we do not store any card or bKash credentials.',
        },
        {
          q: 'Cookies',
          a: 'We use cookies to keep you logged in and to remember your cart. No third-party advertising cookies are used.',
        },
        {
          q: 'Your Rights',
          a: 'You may request deletion of your account and associated data at any time by contacting us at support@watchvault.com.',
        },
      ],
    },
    contact: {
      title: 'Contact Us',
      sections: [
        {
          q: 'Customer Support',
          a: 'For order inquiries, exchanges, or general support:\n\nPhone: +880-XXXXXXXXX\nEmail: support@watchvault.com\nHours: Sat–Thu, 10:00 AM – 8:00 PM (BD Time)',
        },
        {
          q: 'Business Inquiries',
          a: 'For wholesale, brand partnerships, or business collaborations:\n\nEmail: business@watchvault.com',
        },
        {
          q: 'Social Media',
          a: 'Follow us for new arrivals and exclusive offers:\n\nInstagram: @watchvault.bd\nFacebook: facebook.com/watchvault',
        },
      ],
    },
  };

  const pageData = content[page];
  if (!pageData) return null;

  return (
    <div className="info-page">
      <nav className="breadcrumb-trail">
        <Link to="/">Home</Link>
        <span className="bc-sep">›</span>
        <span className="bc-current">{pageData.title}</span>
      </nav>

      <div className="info-container">
        <h1 className="info-title">{pageData.title}</h1>

        <div className="info-sections">
          {pageData.sections.map((s, i) => (
            <div key={i} className="info-section">
              <h3 className="info-q">{s.q}</h3>
              <p className="info-a">{s.a}</p>
            </div>
          ))}
        </div>

        <div className="info-back">
          <Link to="/" className="btn-info-back">← Back to Store</Link>
        </div>
      </div>
    </div>
  );
};

export default InfoPage;
