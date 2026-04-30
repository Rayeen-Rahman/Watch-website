import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import './CategoryPage.css';

const SORT_OPTIONS = [
  { label: 'Newest',         value: 'newest'     },
  { label: 'Price: Low–High',value: 'price_asc'  },
  { label: 'Price: High–Low',value: 'price_desc' },
  { label: 'Best Sellers',   value: 'bestseller' },
];

const MOVEMENT_OPTIONS = ['Automatic', 'Quartz', 'Solar', 'Manual', 'Smartwatch'];
const GENDER_OPTIONS   = ['Men', 'Women', 'Unisex'];

const CategoryPage = () => {
  const { slug }    = useParams();
  const location    = useLocation();

  // Step 36: Read ?search= from URL so Navbar search navigates here with filter pre-applied
  const urlSearch = new URLSearchParams(location.search).get('search') || '';

  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [totalCount,  setTotalCount]  = useState(0);
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const API   = import.meta.env.VITE_API_URL;
  const LIMIT  = 12;

  const [sort,       setSort]        = useState('newest');
  const [movement,   setMovement]    = useState('');
  const [gender,     setGender]      = useState('');
  const [maxPrice,   setMaxPrice]    = useState(200000);
  const [showFilter, setShowFilter]  = useState(false);
  const [searchText, setSearchText]  = useState(urlSearch);

  // ── Fetch categories for sidebar ────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // ── Fetch products ───────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageNumber: page, limit: LIMIT });
      if (slug && slug !== 'all') params.set('category', slug);
      if (movement)   params.set('movementType', movement);
      if (gender)     params.set('gender', gender);
      if (maxPrice < 200000) params.set('maxPrice', maxPrice);
      if (searchText) params.set('search', searchText);
      if (sort === 'price_asc')  { params.set('sortBy', 'price'); params.set('order', 'asc'); }
      if (sort === 'price_desc') { params.set('sortBy', 'price'); params.set('order', 'desc'); }
      if (sort === 'bestseller') params.set('bestSeller', 'true');

      const res  = await fetch(`${API}/api/products?${params}`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.products || []);
      setTotalCount(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, page, sort, movement, gender, maxPrice, searchText]);

  // Re-read URL search param when URL changes (navbar search navigates here)
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('search') || '';
    setSearchText(q);
    setPage(1);
  }, [location.search]);

  useEffect(() => { setPage(1); }, [slug, sort, movement, gender, maxPrice]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const clearFilters = () => {
    setMovement(''); setGender(''); setMaxPrice(200000); setSort('newest'); setPage(1);
  };

  const pageTitle = slug === 'all' || !slug
    ? 'All Watches'
    : categories.find(c => c.slug === slug)?.name || 'Collection';

  return (
    <div className="category-page">

      {/* ── Breadcrumb ── */}
      <nav className="breadcrumb-trail">
        <Link to="/">Home</Link>
        <span className="bc-sep">›</span>
        <Link to="/category/all">Collections</Link>
        {slug !== 'all' && (
          <>
            <span className="bc-sep">›</span>
            <span className="bc-current">{pageTitle}</span>
          </>
        )}
      </nav>

      <div className="category-layout">

        {/* ── SIDEBAR FILTERS ─────────────────────────────────────────────── */}
        <aside className={`filter-sidebar ${showFilter ? 'filter-sidebar-open' : ''}`}>
          <div className="filter-header">
            <h3>Filters</h3>
            <button className="filter-clear-btn" onClick={clearFilters}>Clear all</button>
          </div>

          {/* Category list */}
          <div className="filter-section">
            <h4>Category</h4>
            <ul className="filter-list">
              <li>
                <Link to="/category/all"
                  className={`filter-link ${slug === 'all' ? 'filter-link-active' : ''}`}>
                  All Watches
                </Link>
              </li>
              {categories.map(c => (
                <li key={c._id}>
                  <Link to={`/category/${c.slug}`}
                    className={`filter-link ${slug === c.slug ? 'filter-link-active' : ''}`}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Movement type */}
          <div className="filter-section">
            <h4>Movement</h4>
            <ul className="filter-list">
              {MOVEMENT_OPTIONS.map(m => (
                <li key={m}>
                  <label className="filter-check">
                    <input type="radio" name="movement" value={m}
                      checked={movement === m}
                      onChange={() => setMovement(m === movement ? '' : m)} />
                    {m}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Gender */}
          <div className="filter-section">
            <h4>Gender</h4>
            <ul className="filter-list">
              {GENDER_OPTIONS.map(g => (
                <li key={g}>
                  <label className="filter-check">
                    <input type="radio" name="gender" value={g}
                      checked={gender === g}
                      onChange={() => setGender(g === gender ? '' : g)} />
                    {g}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Price range */}
          <div className="filter-section">
            <h4>Max Price <span className="price-display">৳{maxPrice.toLocaleString()}</span></h4>
            <input type="range" min={1000} max={200000} step={1000}
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="price-slider" />
            <div className="price-range-labels">
              <span>৳1,000</span>
              <span>৳2,00,000</span>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        <div className="category-main">

          {/* Toolbar */}
          <div className="category-toolbar">
            <div className="toolbar-left">
              <h1 className="category-title">{pageTitle}</h1>
              <span className="product-count">{totalCount} product{totalCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="toolbar-right">
              <button className="filter-toggle-btn" onClick={() => setShowFilter(f => !f)}>
                <SlidersHorizontal size={16} />
                {showFilter ? 'Hide' : 'Filter'}
              </button>
              <div className="sort-wrap">
                <select className="sort-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="sort-chevron" />
              </div>
            </div>
          </div>

          {/* Active filter pills */}
          {(movement || gender || maxPrice < 200000) && (
            <div className="active-filters">
              {movement  && <span className="filter-pill">{movement} <button onClick={() => setMovement('')}><X size={10}/></button></span>}
              {gender    && <span className="filter-pill">{gender}   <button onClick={() => setGender('')}><X size={10}/></button></span>}
              {maxPrice < 200000 && <span className="filter-pill">Max ৳{maxPrice.toLocaleString()} <button onClick={() => setMaxPrice(200000)}><X size={10}/></button></span>}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="cat-product-grid">
              {[...Array(LIMIT)].map((_, i) => <div key={i} className="skeleton-card cat-skeleton" />)}
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⌚</div>
              <h3>No watches found</h3>
              <p>{searchText || movement || gender || maxPrice < 200000
                ? 'Try adjusting or clearing your filters.'
                : 'No products in this category yet.'}</p>
              <div className="empty-actions">
                {(movement || gender || maxPrice < 200000) && (
                  <button className="btn-empty-clear" onClick={clearFilters}>Clear Filters</button>
                )}
                <Link to="/category/all" className="btn-empty-browse">Browse All Watches</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="cat-product-grid">
                {products.map(p => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="cat-pagination">
                  <button disabled={page === 1}     onClick={() => setPage(p => p - 1)} className="cat-page-btn">← Prev</button>
                  {[...Array(pages)].map((_, i) => (
                    <button key={i}
                      className={`cat-page-btn ${page === i + 1 ? 'cat-page-active' : ''}`}
                      onClick={() => setPage(i + 1)}>
                      {i + 1}
                    </button>
                  ))}
                  <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="cat-page-btn">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
