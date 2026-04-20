import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import heroWatchImg from '../../assets/hero_watch.png';
import './Homepage.css';

const Homepage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const bestSellersRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data.products ? data.products.slice(0, 8) : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Step 38: compute "৳X OFF" savings label
  const getSavingsLabel = (product) => {
    if (product.oldPrice && product.oldPrice > product.price) {
      const saved = (product.oldPrice - product.price).toFixed(0);
      return `৳${Number(saved).toLocaleString()} OFF`;
    }
    return null;
  };

  // Step 39: prev/next scroll handlers
  const scrollBestSellers = (dir) => {
    if (bestSellersRef.current) {
      bestSellersRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  // Reusable product card (Steps 37, 38)
  const ProductCard = ({ product, keyPrefix }) => {
    const savings = getSavingsLabel(product);
    return (
      <div className="product-card" key={`${keyPrefix}-${product._id}`}>
        <Link to={`/product/${product._id}`} className="product-card-link">
          <div className="product-image-wrapper">
            {savings && <div className="discount-badge">{savings}</div>}
            {product.images && product.images[0] ? (
              <img src={product.images[0]} alt={product.name} />
            ) : (
              <div className="img-placeholder">No Image</div>
            )}
          </div>
          <div className="product-info">
            <h3 className="truncate-title">{product.name}</h3>
            <div className="price-row">
              <p className="product-price">৳{product.price.toLocaleString()}</p>
              {product.oldPrice > product.price && (
                <p className="old-price">৳{product.oldPrice.toLocaleString()}</p>
              )}
            </div>
          </div>
        </Link>
        {/* Step 37: Always-visible Buy Now + Cart buttons */}
        <div className="card-actions">
          <Link to={`/product/${product._id}`} className="btn-card-buy">Buy Now</Link>
          <button
            className="btn-card-cart"
            aria-label="Add to cart"
            onClick={() => addToCart(product, 1)}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="homepage">

      {/* ── HERO SECTION (Steps 34, 35) ── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-label">THE 2024 COLLECTION</div>
          <h1>Find Your Perfect Watch</h1>
          <p>Discover precision engineering paired with timeless design. Elevate your presence with a timepiece crafted for the modern individual.</p>
          <a href="#collection" className="btn-shop-now">SHOP NOW</a>
          <div className="hero-trust">
            <span>✔ Cash on Delivery</span>
            <span className="trust-divider">|</span>
            <span>✔ Fast Delivery</span>
          </div>
        </div>

        {/* Step 34: Real watch image */}
        <div className="hero-image-container">
          <img src={heroWatchImg} alt="Premium Chronograph Watch" className="hero-watch-img" />
          {/* Step 35: Floating card with product name + spec + price */}
          <div className="floating-spec-card">
            <strong>Chronograph Pro</strong>
            <span>Automatic Movement • 42mm</span>
            <span className="floating-price">৳45,000</span>
          </div>
        </div>
      </section>

      {/* ── WATCH COLLECTION (Steps 36, 37, 38, 39) ── */}
      <section id="collection" className="collection-section">
        {/* Step 36: Centered title + subtitle */}
        <div className="section-header centered-header">
          <h2>Watch Collection</h2>
          <p className="section-subtitle">Explore our full range of meticulously crafted pieces, designed to stand the test of time.</p>
        </div>

        {loading ? (
          <div className="product-grid">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : error ? (
          <div className="error-message">Failed to load collection: {error}</div>
        ) : products.length === 0 ? (
          <div className="empty-message">No watches yet. Head to the Admin Dashboard to add products!</div>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <ProductCard product={product} keyPrefix="col" key={product._id} />
            ))}
          </div>
        )}

        {/* Step 36: "View All Watches" centered below grid */}
        {products.length > 0 && (
          <div className="view-all-wrap">
            <Link to="/category/all" className="link-view-all-centered">VIEW ALL WATCHES</Link>
          </div>
        )}
      </section>

      {/* ── BEST SELLERS (Steps 39) ── */}
      {products.length > 0 && (
        <section className="collection-section best-sellers-section">
          <div className="section-header best-sellers-header">
            <div>
              <h2>Best Sellers</h2>
              {/* Step 39: subtitle text */}
              <p className="section-subtitle" style={{ marginTop: '6px', marginBottom: 0 }}>
                Our most sought-after timepieces, curated by enthusiasts.
              </p>
            </div>
            {/* Step 39: prev/next arrow buttons */}
            <div className="slider-nav-buttons">
              <button className="slider-nav-btn" onClick={() => scrollBestSellers(-1)} aria-label="Previous">
                <ChevronLeft size={18} />
              </button>
              <button className="slider-nav-btn" onClick={() => scrollBestSellers(1)} aria-label="Next">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="product-slider" ref={bestSellersRef}>
            {products.slice(0, 6).map(product => (
              <div className="product-card slider-card" key={`bs-${product._id}`}>
                <Link to={`/product/${product._id}`} className="product-card-link">
                  <div className="product-image-wrapper">
                    {getSavingsLabel(product) && (
                      <div className="discount-badge">{getSavingsLabel(product)}</div>
                    )}
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="img-placeholder">No Image</div>
                    )}
                  </div>
                  <div className="product-info">
                    <h3 className="truncate-title">{product.name}</h3>
                    <div className="price-row">
                      <p className="product-price">৳{product.price.toLocaleString()}</p>
                      {product.oldPrice > product.price && (
                        <p className="old-price">৳{product.oldPrice.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="card-actions">
                  <Link to={`/product/${product._id}`} className="btn-card-buy">Buy Now</Link>
                  <button
                    className="btn-card-cart"
                    aria-label="Add to cart"
                    onClick={() => addToCart(product, 1)}
                  >
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default Homepage;
