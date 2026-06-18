/**
 * Step 33 — Shared ProductCard component
 * Used by: Homepage, CategoryPage, and any future listing page.
 *
 * Props:
 *  product     {object}  — product document from API
 *  sliderCard  {bool}    — adds .slider-card class for horizontal scroll use
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';

import { API, resolveImg } from '../../utils/api';

/** Returns a "৳X OFF" savings string or null */
export const getSavingsLabel = (product) => {
  if (product?.oldPrice && product.oldPrice > product.price)
    return `৳${(product.oldPrice - product.price).toLocaleString()} OFF`;
  return null;
};

const ProductCard = ({ product, sliderCard = false }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  if (!product) return null;

  const savings = getSavingsLabel(product);
  
  // Resolve image and normalize backslashes from Windows paths
  let rawUrl = product.images?.[0] || product.image;
  if (rawUrl) rawUrl = rawUrl.replace(/\\/g, '/');
  const imgSrc = resolveImg(rawUrl);
  
  const isOutOfStock = product.stock === 0;
  const cls = `product-card${sliderCard ? ' slider-card' : ''}${isOutOfStock ? ' out-of-stock-card' : ''}`;

  const handleAddToCart = () => {
    if (added) return;           // prevent spam during feedback window
    addToCart(product, 1, false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={cls}>
      <Link to={`/product/${product._id}`} className="product-card-link">
        <div className="product-image-wrapper">
          {/* Out-of-stock badge */}
          {isOutOfStock && <div className="badge-oos">Out of Stock</div>}

          {/* Discount / Best-seller badge */}
          {!isOutOfStock && savings ? (
            <div className="discount-badge">{savings}</div>
          ) : !isOutOfStock && product.isBestSeller ? (
            <div className="badge-bs">
              <Star size={10} /> Best Seller
            </div>
          ) : null}

          {imgSrc && !imgError ? (
            <img
              src={imgSrc}
              alt={product.name}
              loading="lazy"
              width="400"
              height="400"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="img-placeholder">
              {(product.brand || product.name || 'W').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="product-info">
          <h3 className="truncate-title">{product.name}</h3>
          <div className="price-row">
            <p className="product-price">৳{(product.price ?? 0).toLocaleString()}</p>
            {product.oldPrice > product.price && (
              <div className="old-price-row">
                <p className="old-price">৳{product.oldPrice.toLocaleString()}</p>
                {savings && <span className="savings-label">{savings}</span>}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Always-visible action bar */}
      {!isOutOfStock && (
        <div className="card-actions">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${product._id}`); }}
            className="btn-card-buy"
            style={{ fontFamily: 'inherit' }}
          >
            Shop Now
          </button>
          <button
            className={`btn-card-cart${added ? ' btn-cart-added' : ''}`}
            aria-label={added ? 'Added to cart' : 'Add to cart'}
            onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
            disabled={added}
          >
            {added ? '✓' : <ShoppingCart size={15} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
