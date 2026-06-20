import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, MoreHorizontal, Star, Zap, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AddProductPanel from '../components/AddProductPanel';
import './Products.css';

import { API } from '../../utils/api';

const Products = ({ showToast }) => {
  const { token, handleUnauthorized } = useAuth();
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const [total,       setTotal]       = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openKebab,   setOpenKebab]   = useState(null);
  const [menuPos,     setMenuPos]     = useState({ top: 0, right: 16, openUp: false });
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isAddOpen,   setIsAddOpen]   = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  // Ref used to skip the initial click event that opened the menu
  const kebabOpenId = useRef(null);

  // Internal toast fallback
  const toast = showToast || ((msg, err) => err ? alert(msg) : null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        pageNumber: page,
        limit: rowsPerPage,
        ...(search && { search }),
      });
      const res  = await fetch(`${API}/api/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products || []);
      setPages(data.pages   || 1);
      setTotal(data.total   || 0);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Close kebab when clicking outside ────────────────────────────────────
  useEffect(() => {
    if (!openKebab) return;
    const handler = (e) => {
      if (e.target.closest('.kebab-menu') || e.target.closest('.kebab-btn')) return;
      setOpenKebab(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openKebab]);

  // ── Close kebab on page/search change ────────────────────────────────────
  useEffect(() => { setOpenKebab(null); }, [page, search]);

  // ── Toggle isBestSeller / isFeatured ──────────────────────────────────────
  const toggleFlag = async (product, flag) => {
    try {
      // isFeatured ON: use the atomic admin endpoint to ensure only one featured product
      if (flag === 'isFeatured' && !product.isFeatured) {
        const res = await fetch(`${API}/api/admin/set-featured/${product._id}`, {
          method:  'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!res.ok) throw new Error('Update failed');
        fetchProducts();
        return;
      }
      // All other toggles (isBestSeller, isActive, isFeatured OFF): use regular PUT
      const res = await fetch(`${API}/api/products/${product._id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ [flag]: !product[flag] }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Update failed');
      fetchProducts();
    } catch (err) {
      toast(err.message, true);
    }
  };

  // ── Delete single ─────────────────────────────────────────────────────────
  const handleDeleteOne = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      const res = await fetch(`${API}/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        setOpenKebab(null);
        fetchProducts();
        toast('Product deleted.');
      } else {
        const d = await res.json();
        toast(d.message || 'Delete failed', true);
      }
    } catch (err) { toast(err.message, true); }
  };

  // ── Bulk delete ───────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected product(s)?`)) return;
    try {
      const res = await fetch(`${API}/api/products/bulk-delete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ productIds: selectedIds }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        setSelectedIds([]);
        fetchProducts();
        toast('Products deleted.');
      } else {
        toast('Bulk delete failed.', true);
      }
    } catch (err) { toast(err.message, true); }
  };

  const handleSelectAll = (e) =>
    setSelectedIds(e.target.checked ? products.map(p => p._id) : []);
  const handleSelectOne = (e, id) =>
    setSelectedIds(e.target.checked ? [...selectedIds, id] : selectedIds.filter(x => x !== id));

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const handleSearchKey = (e) => { if (e.key === 'Enter') handleSearch(); };

  // ── Kebab: open with smart up/down positioning ────────────────────────────
  const handleKebabClick = (e, id) => {
    e.stopPropagation();
    if (openKebab === id) { setOpenKebab(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const MENU_H = 118; // ~3 items × 38px + padding
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < MENU_H + 8;
    setMenuPos({
      top:  openUp ? rect.top  - MENU_H - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
      openUp,
    });
    setOpenKebab(id);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{ margin: 0, fontWeight: 500 }}>Products Management</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {selectedIds.length > 0 && (
            <button className="btn-danger" onClick={handleBulkDelete}>
              <Trash2 size={15} /> Delete ({selectedIds.length})
            </button>
          )}
          <button className="btn-primary-sm" onClick={() => setIsAddOpen(true)}>
            + Add Watch
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="table-search-row">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKey}
          />
        </div>
        <button className="btn-icon-sm" onClick={handleSearch}><Search size={14} /></button>
        <button className="btn-icon-sm" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 30, color: 'var(--admin-text-secondary)' }}>Loading catalog...</div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" onChange={handleSelectAll}
                    checked={selectedIds.length === products.length && products.length > 0} />
                </th>
                <th>Image</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>⭐</th>
                <th style={{ textAlign: 'center' }}>Featured</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isLowStock = (p.stock ?? 0) <= 5;
                return (
                  <tr
                    key={p._id}
                    className={[
                      selectedIds.includes(p._id) ? 'selected-row' : '',
                      isLowStock ? 'low-stock-row' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <td>
                      <input type="checkbox"
                        checked={selectedIds.includes(p._id)}
                        onChange={e => handleSelectOne(e, p._id)} />
                    </td>
                    <td>
                      <div className="table-img">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0].startsWith('/uploads') ? `${API}${p.images[0]}` : p.images[0]}
                            alt={p.name}
                          />
                        ) : (
                          <div className="placeholder-img">{(p.name || 'W').charAt(0)}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500, maxWidth: 160 }}>
                      <div className="truncate-text">{p.name}</div>
                    </td>
                    <td style={{ color: 'var(--admin-text-secondary)' }}>{p.brand || '—'}</td>
                    <td>৳{(p.price ?? 0).toLocaleString()}</td>
                    <td>
                      <span className={isLowStock ? 'stock-low' : 'stock-ok'}>
                        {p.stock ?? 0}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${p.isActive !== false ? 'status-active' : 'status-banned'}`}>
                        {p.isActive !== false ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    {/* Best Seller toggle */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`toggle-flag-btn ${p.isBestSeller ? 'flag-on' : ''}`}
                        onClick={() => toggleFlag(p, 'isBestSeller')}
                        title="Toggle Best Seller"
                      >
                        <Star size={14} />
                      </button>
                    </td>
                    {/* Featured (Hero) toggle */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`toggle-flag-btn ${p.isFeatured ? 'flag-on flag-featured' : ''}`}
                        onClick={() => toggleFlag(p, 'isFeatured')}
                        title="Toggle Hero Featured"
                      >
                        <Zap size={14} />
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-icon kebab-btn"
                        onClick={(e) => handleKebabClick(e, p._id)}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: 30 }}>
                    {search ? `No products matching "${search}".` : 'No products in the database.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination footer */}
          <div className="table-footer">
            <span className="footer-selected">{selectedIds.length} of {total} row(s) selected.</span>
            <div className="footer-right">
              <span className="footer-label">Rows per page:</span>
              <select className="rows-per-page-select" value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="footer-label">{page} of {pages}</span>
              <div className="page-nav-btns">
                <button onClick={() => setPage(1)}           disabled={page === 1}     title="First">|◀</button>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}     title="Prev">◀</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === pages} title="Next">▶</button>
                <button onClick={() => setPage(pages)}       disabled={page === pages} title="Last">▶|</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed-position kebab menu — escapes overflow:hidden ── */}
      {openKebab && (() => {
        const p = products.find(x => x._id === openKebab);
        if (!p) return null;
        return (
          <div
            className="kebab-menu kebab-menu-fixed"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button onClick={() => { setEditProduct(p); setIsAddOpen(true); setOpenKebab(null); }}>
              ✏️ Edit
            </button>
            <button className="kebab-danger" onClick={() => handleDeleteOne(p._id)}>
              🗑️ Delete
            </button>
            <button onClick={() => { toggleFlag(p, 'isActive'); setOpenKebab(null); }}>
              {p.isActive !== false ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
        );
      })()}

      <AddProductPanel
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); setEditProduct(null); }}
        showToast={toast}
        onSave={fetchProducts}
        editProduct={editProduct}
      />
    </div>
  );
};

export default Products;
