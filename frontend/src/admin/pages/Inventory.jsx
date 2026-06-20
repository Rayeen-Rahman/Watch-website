import React, { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Products.css';
import './Inventory.css';

import { API } from '../../utils/api';
const LOW_STOCK_THRESHOLD = 5;

const Inventory = ({ showToast }) => {
  const { token, handleUnauthorized } = useAuth();
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [edits,     setEdits]     = useState({});   // { [productId]: newStockValue }
  const [saving,    setSaving]    = useState({});   // { [productId]: true/false }
  const [threshold, setThreshold] = useState(LOW_STOCK_THRESHOLD);
  const [filterLow, setFilterLow] = useState(false);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Reset page when any filter changes
  useEffect(() => {
    setPage(1);
  }, [filterLow, threshold]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50, pageNumber: page });
      if (filterLow) params.set('maxStock', threshold);
      const res  = await fetch(`${API}/api/products?${params}`);
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
      setTotalPages(data.pages || 1);
      setTotalProducts(data.total || 0);
      setLoading(false);
    } catch (err) {
      setError('Failed to load inventory');
      setLoading(false);
    }
  }, [page, filterLow, threshold]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Track inline stock edits
  const handleStockChange = (id, val) => {
    setEdits(prev => ({ ...prev, [id]: val }));
  };

  // Save a single product's stock
  const handleSave = async (product) => {
    const newStock = parseInt(edits[product._id]);
    if (isNaN(newStock) || newStock < 0) {
      showToast && showToast('Invalid stock value', true);
      return;
    }
    setSaving(prev => ({ ...prev, [product._id]: true }));
    try {
      const res = await fetch(`${API}/api/products/${product._id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ stock: newStock }),
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!res.ok) throw new Error('Update failed');
      // Update local state
      setProducts(prev =>
        prev.map(p => p._id === product._id ? { ...p, stock: newStock } : p)
      );
      setEdits(prev => { const next = { ...prev }; delete next[product._id]; return next; });
      showToast && showToast(`Stock updated for "${product.name}"`);
    } catch (err) {
      showToast && showToast(err.message, true);
    } finally {
      setSaving(prev => ({ ...prev, [product._id]: false }));
    }
  };

  const displayed = filterLow
    ? products.filter(p => (p.stock ?? 0) <= threshold)
    : products;

  const lowStockCount = products.filter(p => (p.stock ?? 0) <= threshold).length;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{ margin: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={20} /> Inventory
        </h2>
        <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>
          {totalProducts} products
        </span>
        {lowStockCount > 0 && (
          <span className="low-stock-badge">
            <AlertTriangle size={13} /> {lowStockCount} low stock on this page
          </span>
        )}
      </div>

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <div className="inv-controls">
        <div className="inv-threshold">
          <label>Low stock threshold:</label>
          <input
            type="number"
            min={1}
            max={50}
            value={threshold}
            onChange={e => setThreshold(parseInt(e.target.value) || 5)}
            className="threshold-input"
          />
          <span>units</span>
        </div>
        <div className="inv-filter-btns">
          <button
            className={`filter-pill ${!filterLow ? 'active' : ''}`}
            onClick={() => setFilterLow(false)}
          >
            All Products
          </button>
          <button
            className={`filter-pill ${filterLow ? 'active' : ''}`}
            onClick={() => setFilterLow(true)}
          >
            Low Stock Only
          </button>
          <button className="refresh-btn" onClick={fetchProducts} title="Refresh">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: 30, color: 'var(--admin-text-secondary)' }}>Loading inventory…</div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : displayed.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
          {filterLow ? 'No low-stock items — great!' : 'No products found.'}
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th style={{ width: 180 }}>Update Stock</th>
                <th style={{ width: 80 }}>Save</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(product => {
                const stock    = product.stock ?? 0;
                const isLow    = stock <= threshold;
                const edited   = edits[product._id] !== undefined;
                const isSaving = saving[product._id];
                const img      = product.images?.[0]
                  ? (product.images[0].startsWith('/uploads')
                    ? `${API}${product.images[0]}`
                    : product.images[0])
                  : null;

                return (
                  <tr key={product._id} className={isLow ? 'low-stock-row' : ''}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {img ? (
                          <img src={img} alt={product.name} className="inv-thumb" />
                        ) : (
                          <div className="inv-thumb-placeholder" />
                        )}
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{product.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                      {product.brand || '—'}
                    </td>
                    <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>
                      {product.category?.name || '—'}
                    </td>
                    <td>
                      <span className={`stock-level ${isLow ? 'stock-low' : stock <= 20 ? 'stock-med' : 'stock-ok'}`}>
                        {stock}
                        {isLow && <AlertTriangle size={12} style={{ marginLeft: 4 }} />}
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className="stock-edit-input"
                        value={edits[product._id] ?? stock}
                        onChange={e => handleStockChange(product._id, e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className={`save-stock-btn ${edited ? 'save-stock-dirty' : ''}`}
                        disabled={!edited || isSaving}
                        onClick={() => handleSave(product)}
                        title="Save stock change"
                      >
                        {isSaving ? '…' : <Save size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: page === 1 ? '#f5f5f5' : '#fff',
              color: '#333',
              cursor: page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Prev
          </button>
          <span style={{ padding: '0 12px', lineHeight: '32px', color: '#555', fontSize: '0.88rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '6px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: page === totalPages ? '#f5f5f5' : '#fff',
              color: '#333',
              cursor: page === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Inventory;
