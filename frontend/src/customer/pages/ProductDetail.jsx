import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronDown, ChevronUp, Heart, Truck, Banknote, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState('details');
  const [showStickyCart, setShowStickyCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [wishlisted, setWishlisted] = useState(false);
  const relatedSliderRef = useRef(null);
  const { addToCart } = useCart();

  useEffect(() => {
    window.scrollTo(0, 0);

    const API = import.meta.env.VITE_API_URL;
    const resolveImg = (url) => url?.startsWith('/uploads') ? `${API}${url}` : url;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found in the database');
        const data = await res.json();
        setProduct(data);
        // Resolve image URLs for /uploads paths
        const firstImg = data.images?.[0] ? resolveImg(data.images[0]) : '';
        setActiveImage(firstImg);

        // Step 30: fetch related by same category
        try {
          const catParam = data.category?._id ? `&category=${data.category._id}` : '';
          const relatedRes = await fetch(`${API}/api/products?limit=8${catParam}`);
          if (relatedRes.ok) {
            const relatedData = await relatedRes.json();
            const filtered = (relatedData.products || []).filter(p => p._id !== id).slice(0, 6);
            setRelatedProducts(filtered);
          }
        } catch (e) {
          console.error('Could not fetch related products', e);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchProduct();

    const handleScroll = () => {
      setShowStickyCart(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  // Step 45: Related slider scroll
  const scrollRelated = (dir) => {
    if (relatedSliderRef.current) {
      relatedSliderRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="detail-loading-skeleton">
          <div className="skeleton-img"></div>
          <div className="skeleton-content"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <h2 style={{ color: 'var(--store-text)' }}>{error || 'Product not found'}</h2>
          <Link to="/" className="breadcrumb-trail" style={{ marginTop: '20px', display: 'inline-block' }}>← Back to Collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">

      {/* Step 44: Breadcrumb trail — HOME > COLLECTIONS > [category] > [name] */}
      <nav className="breadcrumb-trail" aria-label="breadcrumb">
        <Link to="/">Home</Link>
        <span className="bc-sep">›</span>
        <Link to="/category/all">Collections</Link>
        {product.category && (
          <>
            <span className="bc-sep">›</span>
            <Link to={`/category/${product.category.slug || 'all'}`}>
              {product.category.name || 'Category'}
            </Link>
          </>
        )}
        <span className="bc-sep">›</span>
        <span className="bc-current">{product.name}</span>
      </nav>

      <div className="detail-container">

        {/* ── LEFT: Image Gallery ── */}
        <div className="gallery-section">
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-list">
              {product.images.map((img, index) => {
                const resolved = img?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${img}` : img;
                return (
                  <div
                    key={index}
                    className={`thumbnail ${activeImage === resolved ? 'active' : ''}`}
                    onClick={() => setActiveImage(resolved)}
                  >
                    <img src={resolved} alt={`${product.name} view ${index + 1}`} />
                  </div>
                );
              })}
              {/* Step 45: Video play thumb placeholder if 3+ images */}
              {product.images.length >= 3 && (
                <div className="thumbnail thumb-video">
                  <div className="play-icon-wrap">▶</div>
                </div>
              )}
            </div>
          )}

          <div className="main-image">
            {activeImage ? (
              <img src={activeImage} alt={product.name} />
            ) : (
              <div className="img-placeholder" style={{ color: '#999' }}>No Image Available</div>
            )}
            {/* Step 45: Heart/wishlist icon on image */}
            <button
              className={`wishlist-btn ${wishlisted ? 'wishlisted' : ''}`}
              onClick={() => setWishlisted(!wishlisted)}
              aria-label="Add to wishlist"
            >
              <Heart size={20} fill={wishlisted ? '#e44' : 'none'} color={wishlisted ? '#e44' : '#555'} />
            </button>
            {product.discount > 0 && (
              <div className="product-page-discount">-{product.discount}%</div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Product Info ── */}
        <div className="info-section">

          {/* Step 43: Category label + POPULAR ITEM badge */}
          <div className="product-meta-row">
            {product.category && (
              <span className="product-category-label">
                {product.category.name?.toUpperCase()} COLLECTION
              </span>
            )}
            {product.tag === 'popular' && (
              <span className="popular-badge">🔥 POPULAR ITEM</span>
            )}
          </div>

          {product.brand && <span className="detail-brand">{product.brand}</span>}
          <h1 className="detail-title">{product.name}</h1>

          {/* Price row with SAVE badge */}
          <div className="detail-price-row">
            <span className="detail-price">৳{product.price.toLocaleString()}</span>
            {product.oldPrice > product.price && (
              <>
                <span className="detail-old-price">৳{product.oldPrice.toLocaleString()}</span>
                <span className="save-badge">SAVE ৳{(product.oldPrice - product.price).toLocaleString()}</span>
              </>
            )}
          </div>

          {/* Product short description */}
          {product.description && (
            <p className="detail-description">{product.description}</p>
          )}

          {/* Step 41: Quantity on own row */}
          <div className="quantity-row">
            <div className="quantity-selector">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          {/* Step 41: ADD TO CART — full width, own row */}
          <button className="btn-add-to-cart" onClick={() => addToCart(product, quantity)}>
            <ShoppingBag size={20} /> ADD TO CART
          </button>

          {/* Step 41: BUY NOW — full width outline, below Add to Cart */}
          <button className="btn-buy-now" onClick={handleBuyNow}>
            BUY NOW
          </button>

          {/* Step 42: COD / Delivery / Exchange trust lines */}
          <div className="trust-lines">
            <div className="trust-line">
              <Banknote size={16} strokeWidth={1.5} />
              <span>Cash on Delivery Available</span>
            </div>
            <div className="trust-line">
              <Truck size={16} strokeWidth={1.5} />
              <span>Fast Delivery (3–5 days)</span>
            </div>
            <div className="trust-line">
              <RefreshCcw size={16} strokeWidth={1.5} />
              <span>Easy Exchange Policy</span>
            </div>
          </div>

          {/* Accordion Sections */}
          <div className="accordion-sections">
            {/* Watch Specs */}
            {(product.movementType || product.caseSize || product.dialColor || product.strapMaterial || product.waterResistance || product.gender) && (
              <div className="accordion-item">
                <button className="accordion-header" onClick={() => toggleAccordion('specs')}>
                  Watch Specifications
                  {activeAccordion === 'specs' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {activeAccordion === 'specs' && (
                  <div className="accordion-content">
                    <table className="specs-table">
                      <tbody>
                        {product.movementType   && <tr><td>Movement</td><td>{product.movementType}</td></tr>}
                        {product.caseSize       && <tr><td>Case Size</td><td>{product.caseSize}</td></tr>}
                        {product.dialColor      && <tr><td>Dial Color</td><td>{product.dialColor}</td></tr>}
                        {product.strapMaterial  && <tr><td>Strap</td><td>{product.strapMaterial}</td></tr>}
                        {product.waterResistance && <tr><td>Water Resistance</td><td>{product.waterResistance}</td></tr>}
                        {product.gender         && <tr><td>Gender</td><td>{product.gender}</td></tr>}
                        {product.brand          && <tr><td>Brand</td><td>{product.brand}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Product Details */}
            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleAccordion('details')}>
                Product Details
                {activeAccordion === 'details' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {activeAccordion === 'details' && (
                <div className="accordion-content">
                  <p>{product.description || 'Premium design and superior build quality.'}</p>
                </div>
              )}
            </div>

            {/* Delivery */}
            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleAccordion('delivery')}>
                Delivery
                {activeAccordion === 'delivery' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {activeAccordion === 'delivery' && (
                <div className="accordion-content">
                  <p><strong>Inside Dhaka:</strong> Delivered within 24–48 hours. Free delivery on orders over ৳2,000.</p>
                  <p><strong>Outside Dhaka:</strong> Delivered within 3–5 business days via standard courier.</p>
                  <p>Cash on Delivery is available for all regions.</p>
                </div>
              )}
            </div>

            {/* Exchange & Return */}
            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleAccordion('exchange')}>
                Exchange &amp; Return
                {activeAccordion === 'exchange' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {activeAccordion === 'exchange' && (
                <div className="accordion-content">
                  <p>We offer a 7-day easy exchange policy. If the product is defective or damaged, contact our support team.</p>
                  <p>Items must be unused and in their original packaging.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── RELATED PRODUCTS — Step 45: with prev/next arrows ── */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section">
          <div className="related-header">
            <div>
              <h2>Best Sellers</h2>
              <p className="related-subtitle">Our most sought-after timepieces, curated by enthusiasts.</p>
            </div>
            <div className="slider-nav-buttons">
              <button className="slider-nav-btn" onClick={() => scrollRelated(-1)} aria-label="Previous">
                <ChevronLeft size={18} />
              </button>
              <button className="slider-nav-btn" onClick={() => scrollRelated(1)} aria-label="Next">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="related-slider" ref={relatedSliderRef}>
            {relatedProducts.map(rel => (
              <div className="related-card" key={rel._id}>
                <Link to={`/product/${rel._id}`} className="related-card-link">
                  <div className="related-img-wrap">
                    {rel.images?.[0] ? (
                      <img
                        src={rel.images[0].startsWith('/uploads') ? `${import.meta.env.VITE_API_URL}${rel.images[0]}` : rel.images[0]}
                        alt={rel.name}
                      />
                    ) : (
                      <div className="img-placeholder">{(rel.brand || 'W').charAt(0)}</div>
                    )}
                    {rel.oldPrice > rel.price && (
                      <div className="related-discount-badge">
                        ৳{(rel.oldPrice - rel.price).toLocaleString()} OFF
                      </div>
                    )}
                  </div>
                  <div className="related-info">
                    <h3>{rel.name}</h3>
                    <div className="related-price-row">
                      <span className="related-price">৳{rel.price.toLocaleString()}</span>
                      {rel.oldPrice > rel.price && (
                        <span className="related-old-price">৳{rel.oldPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="related-card-actions">
                  <Link to={`/product/${rel._id}`} className="btn-related-buy">Buy Now</Link>
                  <button
                    className="btn-related-cart"
                    onClick={() => addToCart(rel, 1)}
                    aria-label="Add to cart"
                  >
                    <ShoppingBag size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Add to Cart Bar */}
      <div className={`sticky-cart-bar ${showStickyCart ? 'visible' : ''}`}>
        <div className="sticky-product-info">
          {activeImage && <img src={activeImage} alt={product.name} />}
          <div>
            <h4>{product.name}</h4>
            <p>৳{product.price.toLocaleString()}</p>
          </div>
        </div>
        <button
          className="btn-add-to-cart"
          style={{ height: '45px', padding: '0 28px', fontSize: '0.95rem', borderRadius: '6px', width: 'auto', flex: 'none' }}
          onClick={() => addToCart(product, quantity)}
        >
          <ShoppingBag size={18} /> Add to Cart
        </button>
      </div>

    </div>
  );
};

export default ProductDetail;
