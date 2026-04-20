import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState('details');
  const [showStickyCart, setShowStickyCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found in the database');
        const data = await res.json();
        setProduct(data);
        setActiveImage(data.images && data.images.length > 0 ? data.images[0] : '');

        // Fetch related products (e.g. all products, then filter out the current one)
        try {
          const relatedRes = await fetch('http://localhost:5000/api/products');
          if (relatedRes.ok) {
            const relatedData = await relatedRes.json();
            if (relatedData.products) {
              setRelatedProducts(relatedData.products.filter(p => p._id !== id).slice(0, 4));
            }
          }
        } catch(e) {
          console.error("Could not fetch related products", e);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchProduct();

    const handleScroll = () => {
      // Show sticky cart when user scrolls down 300px
      if (window.scrollY > 300) {
        setShowStickyCart(true);
      } else {
        setShowStickyCart(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? null : section);
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
        <div className="detail-error" style={{textAlign:'center', padding:'100px 0'}}>
          <h2 style={{color:'var(--store-text)'}}>{error}</h2>
          <Link to="/" className="breadcrumb-back" style={{marginTop:'20px'}}><ArrowLeft size={18}/> Back to Collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <Link to="/" className="breadcrumb-back"><ArrowLeft size={16}/> Back to Collection</Link>
      
      <div className="detail-container">
        
        {/* Left: Image Gallery */}
        <div className="gallery-section">
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-list">
              {product.images.map((img, index) => (
                <div 
                  key={index} 
                  className={`thumbnail ${activeImage === img ? 'active' : ''}`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`${product.name} view ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
          
          <div className="main-image">
            {activeImage ? (
              <img src={activeImage} alt={product.name} />
            ) : (
              <div className="img-placeholder" style={{color:'#999'}}>No Image Available</div>
            )}
            {product.discount > 0 && <div className="product-page-discount">-{product.discount}%</div>}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="info-section">
          <h1 className="detail-title">{product.name}</h1>
          <div className="price-row" style={{display:'flex', gap:'15px', alignItems:'center', marginBottom:'40px'}}>
            <p className="detail-price" style={{margin:0}}>${product.price.toFixed(2)}</p>
            {product.oldPrice > product.price && (
              <>
                <p className="old-price" style={{textDecoration:'line-through', color:'#999', fontSize:'1.2rem', margin:0}}>${product.oldPrice.toFixed(2)}</p>
                <div className="save-badge" style={{backgroundColor:'rgba(34, 197, 94, 0.1)', border: '1px solid #22C55E', color:'#22C55E', padding:'4px 10px', borderRadius:'50px', fontWeight:'bold', fontSize:'0.85rem'}}>
                  SAVE ${(product.oldPrice - product.price).toFixed(2)}
                </div>
              </>
            )}
          </div>
          
          <div className="detail-actions">
            <div className="quantity-selector">
               <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
               <span>{quantity}</span>
               <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            
            <button className="btn-add-to-cart" onClick={() => addToCart(product, quantity)}>
              <ShoppingBag size={20} /> Add to Cart
            </button>
            <button className="btn-buy-now" onClick={() => { addToCart(product, quantity); window.location.href = '/checkout'; }}>
              Buy Now
            </button>
          </div>

          {/* Accordion Sections */}
          <div className="accordion-sections">
            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleAccordion('details')}>
                Product Details
                {activeAccordion === 'details' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
              {activeAccordion === 'details' && (
                <div className="accordion-content">
                  <p>{product.description || 'Premium design and superior build quality. Excellent timekeeping accuracy.'}</p>
                  <ul style={{marginTop: '10px', paddingLeft: '20px'}}>
                    <li>Water resistant up to 50 meters</li>
                    <li>Scratch-resistant sapphire crystal</li>
                    <li>Automatic movement</li>
                  </ul>
                </div>
              )}
            </div>
            
            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleAccordion('delivery')}>
                Delivery
                {activeAccordion === 'delivery' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
              {activeAccordion === 'delivery' && (
                <div className="accordion-content">
                  <p><strong>Inside Dhaka:</strong> Delivered within 24-48 hours. Free delivery on orders over $200.</p>
                  <p><strong>Outside Dhaka:</strong> Delivered within 3-5 business days via standard courier services.</p>
                  <p>Cash on Delivery is available for all regions.</p>
                </div>
              )}
            </div>

            <div className="accordion-item">
              <button className="accordion-header" onClick={() => toggleAccordion('exchange')}>
                Exchange & Return
                {activeAccordion === 'exchange' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
              </button>
              {activeAccordion === 'exchange' && (
                <div className="accordion-content">
                  <p>We offer a 7-day easy exchange policy. If the product is defective or damaged, you can exchange it by contacting our support.</p>
                  <p>Items must be unused and in their original packaging.</p>
                </div>
              )}
            </div>
          </div>

          {/* Premium details block */}
          <div className="premium-guarantees">
            <div className="guarantee-item">
               <strong>Free Shipping</strong>
               <span>On all orders over $200 securely delivered.</span>
            </div>
            <div className="guarantee-item">
               <strong>2-Year Warranty</strong>
               <span>Official manufacturer guarantee on internals.</span>
            </div>
            <div className="guarantee-item">
               <strong>Secure Payment</strong>
               <span>Cash on delivery available at checkout.</span>
            </div>
          </div>

        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="related-products-section" style={{marginTop: '100px', borderTop: '1px solid var(--store-border)', paddingTop: '50px'}}>
          <h2 style={{fontSize: '2rem', marginBottom: '30px', fontWeight: '700'}}>You May Also Like</h2>
          <div className="product-slider" style={{display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', scrollSnapType: 'x mandatory'}}>
            {relatedProducts.map(rel => (
              <Link to={`/product/${rel._id}`} key={rel._id} className="related-card" style={{minWidth: '280px', flex: '0 0 auto', scrollSnapAlign: 'start', textDecoration: 'none', color: 'inherit'}}>
                <div style={{backgroundColor: 'var(--store-surface)', borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/5', marginBottom: '15px', position: 'relative'}}>
                  {rel.images && rel.images[0] ? (
                    <img src={rel.images[0]} alt={rel.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999'}}>No Image</div>
                  )}
                  {rel.discount > 0 && (
                    <div className="discount-badge" style={{position: 'absolute', top: '10px', left: '10px', backgroundColor: '#22C55E', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'}}>
                      -{rel.discount}%
                    </div>
                  )}
                </div>
                <h3 style={{fontSize: '1.1rem', margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{rel.name}</h3>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <p style={{margin: 0, fontWeight: '600', color: 'var(--store-accent)'}}>${rel.price.toFixed(2)}</p>
                  {rel.oldPrice > rel.price && (
                    <p style={{margin: 0, textDecoration: 'line-through', color: '#999', fontSize: '0.9rem'}}>${rel.oldPrice.toFixed(2)}</p>
                  )}
                </div>
              </Link>
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
            <p>${product.price.toFixed(2)}</p>
          </div>
        </div>
        <div className="detail-actions" style={{ marginBottom: 0, gap: '15px' }}>
          <button className="btn-add-to-cart" style={{ height: '45px', padding: '0 20px', fontSize: '1rem' }} onClick={() => addToCart(product, quantity)}>
            <ShoppingBag size={18} /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
