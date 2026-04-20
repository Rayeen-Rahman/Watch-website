import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Homepage.css';

const Homepage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  // STEP 12: Connected to real Database API
  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        // Grab up to 8 products for the Homepage featured section
        setProducts(data.products ? data.products.slice(0, 8) : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchBestSellers();
  }, []);

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-label">THE 2024 COLLECTION</div>
          <h1>Discover Perfection</h1>
          <p>Engineered for exact precision and aesthetic perfection. Discover our latest collection of premium luxury timepieces.</p>
          <a href="#collection" className="btn-shop-now">
            Explore Collection <ArrowRight size={18} />
          </a>
          <div className="hero-trust">
            <span>🛡️ 2 Year Warranty</span>
            <span className="trust-divider">|</span>
            <span>✓ Auth Guarantee</span>
          </div>
        </div>
        <div className="hero-image-container">
           {/* Fallback abstract premium visual representing a minimalist watch face */}
           <div className="premium-watch-placeholder">
             <div className="floating-spec-card">
               <strong>Sapphire Glass</strong>
               <span>Scratch Resistant</span>
             </div>
           </div>
        </div>
      </section>

      {/* Best Sellers Collection Grid */}
      <section id="collection" className="collection-section">
        <div className="section-header">
          <h2>Featured Timepieces</h2>
          <Link to="/category/all" className="link-view-all">View All Collection</Link>
        </div>

        {loading ? (
          <div className="product-slider">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton-card" style={{minWidth: '280px'}}></div>)}
          </div>
        ) : error ? (
          <div className="error-message" style={{color: 'red', textAlign:'center'}}>Failed to load collection: {error}</div>
        ) : products.length === 0 ? (
          <div className="empty-message" style={{textAlign:'center', padding:'50px'}}>No watches are currently available in the database. Head to the Admin Dashboard to add some!</div>
        ) : (
          <div className="product-slider">
            {products.map(product => (
              <Link to={`/product/${product._id}`} key={product._id} className="product-card" style={{textDecoration:'none', color:'inherit'}}>
                <div className="product-image-wrapper">
                  {product.discount > 0 && (
                    <div className="discount-badge">
                      -{product.discount}%
                    </div>
                  )}
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div className="img-placeholder">No Image</div>
                  )}
                  {/* Glassmorphism Micro-animation on hover */}
                  <button className="add-to-cart-btn" onClick={(e) => {
                    e.preventDefault();
                    addToCart(product, 1);
                  }}>Quick Add</button>
                </div>
                <div className="product-info">
                  <h3 className="truncate-title">{product.name}</h3>
                  <div className="price-row" style={{display:'flex', gap:'8px', alignItems:'center'}}>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                    {product.oldPrice > product.price && (
                      <p className="old-price" style={{textDecoration:'line-through', color:'#999', fontSize:'0.9rem', margin:0}}>${product.oldPrice.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Homepage;
