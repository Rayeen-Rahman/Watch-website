import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => (
  <div className="not-found-page">
    <div className="not-found-content">
      <p className="not-found-code">404</p>
      <h1 className="not-found-title">Page Not Found</h1>
      <p className="not-found-desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="not-found-actions">
        <Link to="/" className="btn-nf-home">Go Home</Link>
        <Link to="/category/all" className="btn-nf-shop">Browse Watches</Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
