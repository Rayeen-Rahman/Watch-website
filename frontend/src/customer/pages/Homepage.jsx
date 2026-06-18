import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import './Homepage.css';

import { API, resolveImg } from '../../utils/api';

const heroFallback = '/hero_watch.png';

const Homepage = () => {
  const [collection,   setCollection]   = useState([]);
  const [bestSellers,  setBestSellers]  = useState([]);
  const [featuredProd, setFeaturedProd] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const bestSellersRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [collRes, bsRes, featRes] = await Promise.allSettled([
        fetch(`${API}/api/products?limit=8`),
        fetch(`${API}/api/products?bestSeller=true&limit=8`),
        fetch(`${API}/api/products/featured`),
      ]);

      if (collRes.status === 'fulfilled' && collRes.value.ok) {
        const d = await collRes.value.json();
        setCollection(d.products || []);
      }
      if (bsRes.status === 'fulfilled' && bsRes.value.ok) {
        const d = await bsRes.value.json();
        setBestSellers(d.products || []);
      }
      if (featRes.status === 'fulfilled' && featRes.value.ok) {
        const d = await featRes.value.json();
        setFeaturedProd(d);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const scrollBestSellers = (dir) =>
    bestSellersRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <div className="homepage">

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-inner">

          {/* LEFT PANEL — text */}
          <div className="hero-panel hero-panel-left">
            <div className="hero-content">
              <div className="hero-label">THE {new Date().getFullYear()} COLLECTION</div>
              <h1>Find Your Perfect Watch</h1>
              <p>
                Discover precision engineering paired with timeless design.
                Elevate your presence with a timepiece crafted for the modern individual.
              </p>
              <button
                className="btn-shop-now"
                onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
              >
                SHOP NOW
              </button>
              <div className="hero-trust">
                <span>✔ Cash on Delivery</span>
                <span className="trust-divider">|</span>
                <span>✔ Fast Delivery</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — image + floating card */}
          <div className="hero-panel hero-panel-right">
            <div className="hero-image-container">
              <div className="hero-watch-wrapper">
                {featuredProd?.images?.[0] ? (
                  <img
                    src={resolveImg(featuredProd.images[0])}
                    alt={featuredProd.name}
                    className="hero-watch-img"
                    width="480"
                    height="480"
                    fetchpriority="high"
                  />
                ) : (
                  <img
                    src={heroFallback}
                    alt="Premium Chronograph Watch"
                    className="hero-watch-img"
                    width="480"
                    height="480"
                    fetchpriority="high"
                  />
                )}

                {/* Floating featured product card */}
                {featuredProd ? (
                  <Link
                    to={`/product/${featuredProd._id}`}
                    className="floating-spec-card floating-spec-link"
                  >
                    {featuredProd.images?.[0] && (
                      <img
                        src={resolveImg(featuredProd.images[0])}
                        alt={featuredProd.name}
                        className="floating-thumb"
                        loading="lazy"
                        width="56"
                        height="56"
                      />
                    )}
                    <div className="floating-info">
                      <span className="floating-label">⚡ Featured</span>
                      <strong>{featuredProd.name}</strong>
                      <span>
                        {featuredProd.shortDescription ||
                          [featuredProd.movementType, featuredProd.caseSize]
                            .filter(Boolean).join(' · ')}
                      </span>
                      <span className="floating-price">
                        ৳{(featuredProd.price ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── WATCH COLLECTION ───────────────────────────────────────────────── */}
      <section id="collection" className="collection-section">
        <div className="section-inner">
          <div className="section-header centered-header">
            <h2>Watch Collection</h2>
            <p className="section-subtitle-center">Explore our full range of meticulously crafted pieces, designed to stand the test of time.</p>
          </div>

          {loading ? (
            <div className="product-grid">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          ) : error ? (
            <div className="error-message">Failed to load collection: {error}</div>
          ) : collection.length === 0 ? (
            <div className="empty-message">
              No watches yet. Head to the Admin Dashboard to add products!
            </div>
          ) : (
            <>
              <div className="product-grid">
                {collection.slice(0, 8).map(p => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              <div className="view-all-wrap">
                <Link to="/category/all" className="link-view-all-centered">VIEW ALL WATCHES</Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── BEST SELLERS ───────────────────────────────────────────────────── */}
      {!loading && bestSellers.length > 0 && (
        <section className="collection-section best-sellers-section">
          <div className="section-inner">
            <div className="section-header best-sellers-header">
              <div>
                <h2 className="section-label">Best Sellers</h2>
                <p className="section-subtitle-sm">Our most sought-after timepieces, curated by connoisseurs.</p>
              </div>
              <div className="slider-nav-buttons">
                <button
                  className="slider-nav-btn"
                  onClick={() => scrollBestSellers(-1)}
                  aria-label="Previous"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  className="slider-nav-btn"
                  onClick={() => scrollBestSellers(1)}
                  aria-label="Next"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="product-slider" ref={bestSellersRef}>
              {bestSellers.map(p => (
                <ProductCard key={`bs-${p._id}`} product={p} sliderCard />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default Homepage;
