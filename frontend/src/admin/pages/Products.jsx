import React, { useState, useEffect } from 'react';
import { Trash2, MoreHorizontal } from 'lucide-react';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Multi-select
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc');
  const [openKebab, setOpenKebab] = useState(null);

  // Step 60: data-grid pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/products?pageNumber=${page}`);
      
      if (!res.ok) {
        // Handle database being disconnected smoothly for UI gracefully
        throw new Error('Failed to fetch products (Is the backend/database running?)');
      }
      
      const data = await res.json();
      setProducts(data.products || []);
      setPages(data.pages || 1);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm('Are you sure you want to completely delete the selected products?')) {
      try {
        const res = await fetch('http://localhost:5000/api/products/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productIds: selectedIds })
        });
        if (res.ok) {
          setSelectedIds([]);
          fetchProducts();
        } else {
          alert('Failed to delete products');
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleSortPrice = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    const sorted = [...products].sort((a, b) => {
      return newOrder === 'asc' ? a.price - b.price : b.price - a.price;
    });
    setProducts(sorted);
  };

  const handleDeleteOne = async (productId) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setOpenKebab(null);
        fetchProducts();
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to delete product');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{margin:0, fontWeight: 500}}>Products Management</h2>
        {selectedIds.length > 0 && (
          <button className="btn-danger" onClick={handleBulkDelete}>
            <Trash2 size={16}/> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading catalog...</div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{width: '40px'}}>
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={selectedIds.length === products.length && products.length > 0}
                  />
                </th>
                <th>Image</th>
                <th>Name</th>
                <th onClick={handleSortPrice} style={{cursor:'pointer', userSelect:'none'}}>
                  Price {sortOrder === 'asc' ? '↑' : '↓'}
                </th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id} className={selectedIds.includes(product._id) ? 'selected-row' : ''}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(product._id)}
                      onChange={(e) => handleSelectOne(e, product._id)}
                    />
                  </td>
                  <td>
                    <div className="table-img">
                      {product.images && product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} />
                      ) : (
                        <div className="placeholder-img">No Img</div>
                      )}
                    </div>
                  </td>
                  <td style={{fontWeight: 500}}>{product.name}</td>
                  <td>৳{Number(product.price).toLocaleString()}</td>
                  <td><div className="truncate-text">{product.description}</div></td>
                  <td style={{ position: 'relative' }}>
                    {/* Step 59: kebab menu */}
                    <button
                      className="btn-icon kebab-btn"
                      onClick={() => setOpenKebab(openKebab === product._id ? null : product._id)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openKebab === product._id && (
                      <div className="kebab-menu">
                        <button>✏️ Edit</button>
                        <button
                          className="kebab-danger"
                          onClick={() => handleDeleteOne(product._id)}
                        >🗑️ Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="6" style={{textAlign:'center', padding:'30px'}}>No products found in the database.</td></tr>
              )}
            </tbody>
          </table>
          
          {/* Step 60: data-grid pagination footer */}
          <div className="table-footer">
            <span className="footer-selected">{selectedIds.length} of {products.length} row(s) selected.</span>
            <div className="footer-right">
              <span className="footer-label">Rows per page:</span>
              <select
                className="rows-per-page-select"
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="footer-label">{page} of {pages}</span>
              <div className="page-nav-btns">
                <button onClick={() => setPage(1)} disabled={page === 1} title="First">|◀</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} title="Prev">◀</button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} title="Next">▶</button>
                <button onClick={() => setPage(pages)} disabled={page === pages} title="Last">▶|</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Products;
