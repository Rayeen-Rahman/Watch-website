/**
 * Step 33 — Shared ProductCard component
 * Used by: Homepage, CategoryPage, and any future listing page.
 *
 * Props:
 *  product     {object}  — product document from API
 *  sliderCard  {bool}    — adds .slider-card class for horizontal scroll use
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API = import.meta.env.VITE_API_URL;

/** Resolve /uploads paths to absolute backend URL */
export const resolveImg = (url) =>
  url?.startsWith('/uploads') ? `${API}${url}` : url;

/** Returns a "৳X OFF" savings string or null */
export const getSavingsLabel = (product) => {
  if (product?.oldPrice && product.oldPrice > product.price)
    return `৳${(product.oldPrice - product.price).toLocaleString()} OFF`;
  return null;
};

const ProductCard = ({ product, sliderCard = false }) => {
  const { addToCart } = useCart();
  // C-05: cart button feedback — prevents spam and gives visual confirmation
  const [added, setAdded] = React.useState(false);

  if (!product) return null;

  const savings = getSavingsLabel(product);
  const imgSrc  = resolveImg(product.images?.[0]);
  const cls     = `product-card${sliderCard ? ' slider-card' : ''}`;

  const handleAddToCart = () => {
    if (added) return;           // prevent spam during feedback window
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={cls}>
      <Link to={`/product/${product._id}`} className="product-card-link">
        <div className="product-image-wrapper">
          {/* Discount badge (takes priority over best-seller badge) */}
          {savings ? (
            <div className="discount-badge">{savings}</div>
          ) : product.isBestSeller ? (
            <div className="badge-bs">
              <Star size={10} /> Best Seller
            </div>
          ) : null}

          {imgSrc ? (
            <img src={imgSrc} alt={product.name} loading="lazy" />
          ) : (
            <div className="img-placeholder">
              {(product.brand || product.name || 'W').charAt(0)}
            </div>
          )}
        </div>

        <div className="product-info">
          {product.brand && (
            <span className="product-brand">{product.brand}</span>
          )}
          <h3 className="truncate-title">{product.name}</h3>
          {product.movementType && (
            <span className="product-spec">
              {product.movementType}
              {product.caseSize ? ` · ${product.caseSize}` : ''}
            </span>
          )}
          <div className="price-row">
            <p className="product-price">
              ৳{(product.price ?? 0).toLocaleString()}
            </p>
            {product.oldPrice > product.price && (
              <p className="old-price">
                ৳{product.oldPrice.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Action buttons — always visible below card */}
      <div className="card-actions">
        <Link to={`/product/${product._id}`} className="btn-card-buy">
          Buy Now
        </Link>
        <button
          className={`btn-card-cart${added ? ' btn-cart-added' : ''}`}
          aria-label={added ? 'Added to cart' : 'Add to cart'}
          onClick={handleAddToCart}
          disabled={added}
        >
          {added ? '✓' : <ShoppingCart size={16} />}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
