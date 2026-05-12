import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tag, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Categories.css';
import './Products.css';  /* reuse table/page/badge shared styles */


const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Categories = ({ showToast }) => {
  const { token } = useAuth();
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Add new category form
  const [newName,  setNewName]  = useState('');
  const [newSlug,  setNewSlug]  = useState('');
  const [adding,   setAdding]   = useState(false);

  // Inline edit state — tracks which row is being edited
  const [editingId,   setEditingId]   = useState(null);
  const [editName,    setEditName]    = useState('');
  const [editSlug,    setEditSlug]    = useState('');
  const [editSaving,  setEditSaving]  = useState(false);

  const localToastRef = useRef(null);
  const [localToast, setLocalToast] = useState(null);
  const toast = showToast || ((msg, err = false) => {
    setLocalToast({ msg, err });
    clearTimeout(localToastRef.current);
    localToastRef.current = setTimeout(() => setLocalToast(null), 3000);
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/categories`);
      if (!res.ok) throw new Error('Failed to load categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Auto-generate slug from name ─────────────────────────────────────────
  const toSlug = (str) =>
    str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleNameChange = (val) => {
    setNewName(val);
    setNewSlug(toSlug(val));
  };

  // ── Add ───────────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) { toast('Category name is required', true); return; }
    setAdding(true);
    try {
      const res = await fetch(`${API}/api/categories`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name: newName.trim(), slug: newSlug || toSlug(newName) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add category');
      setNewName(''); setNewSlug('');
      fetchCategories();
      toast(`"${data.name}" added!`);
    } catch (err) {
      toast(err.message, true);
    } finally {
      setAdding(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
  };
  const cancelEdit = () => { setEditingId(null); setEditName(''); setEditSlug(''); };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) { toast('Name cannot be empty', true); return; }
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/api/categories/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name: editName.trim(), slug: editSlug || toSlug(editName) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setEditingId(null);
      fetchCategories();
      toast(`"${data.name}" updated!`);
    } catch (err) {
      toast(err.message, true);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"? Products in this category will lose their category assignment.`)) return;
    try {
      const res = await fetch(`${API}/api/categories/${cat._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Delete failed'); }
      fetchCategories();
      toast(`"${cat.name}" deleted.`);
    } catch (err) {
      toast(err.message, true);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{ margin: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag size={20} /> Categories
        </h2>
        <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>
          {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      <div className="categories-layout">

        {/* ── Add Form ────────────────────────────────────────────────────── */}
        <div className="cat-add-panel">
          <h3 className="panel-section-title">Add New Category</h3>
          <form onSubmit={handleAdd} className="cat-add-form">
            <div className="cat-field">
              <label>Category Name *</label>
              <input
                type="text"
                placeholder="e.g. Chronograph"
                value={newName}
                onChange={e => handleNameChange(e.target.value)}
                required
              />
            </div>
            <div className="cat-field">
              <label>Slug</label>
              <input
                type="text"
                placeholder="e.g. chronograph"
                value={newSlug}
                onChange={e => setNewSlug(e.target.value)}
              />
              <span className="field-hint">Auto-generated from name. Used in URLs.</span>
            </div>
            <button
              type="submit"
              className="btn-primary-sm"
              disabled={adding}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            >
              <Plus size={15} />
              {adding ? 'Adding…' : 'Add Category'}
            </button>
          </form>
        </div>

        {/* ── Category Table ─────────────────────────────────────────────── */}
        <div className="cat-table-panel">
          <h3 className="panel-section-title">All Categories</h3>

          {loading ? (
            <div style={{ padding: 30, color: 'var(--admin-text-secondary)' }}>
              Loading categories…
            </div>
          ) : error ? (
            <div className="error-card">{error}</div>
          ) : categories.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
              No categories yet. Add your first one!
            </div>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Products</th>
                    <th style={{ width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => (
                    <tr key={cat._id}>
                      <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.82rem' }}>
                        {idx + 1}
                      </td>

                      {editingId === cat._id ? (
                        <>
                          <td>
                            <input
                              className="inline-edit-input"
                              value={editName}
                              onChange={e => { setEditName(e.target.value); setEditSlug(toSlug(e.target.value)); }}
                              autoFocus
                            />
                          </td>
                          <td>
                            <input
                              className="inline-edit-input"
                              value={editSlug}
                              onChange={e => setEditSlug(e.target.value)}
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ fontWeight: 600 }}>{cat.name}</td>
                          <td>
                            <code className="slug-pill">{cat.slug}</code>
                          </td>
                        </>
                      )}

                      <td style={{ color: 'var(--admin-text-secondary)' }}>
                        {cat.productCount ?? '—'}
                      </td>

                      <td>
                        <div className="cat-action-btns">
                          {editingId === cat._id ? (
                            <>
                              <button
                                className="btn-icon-action save-btn"
                                title="Save"
                                disabled={editSaving}
                                onClick={() => handleSaveEdit(cat._id)}
                              >
                                <Check size={15} />
                              </button>
                              <button
                                className="btn-icon-action cancel-btn"
                                title="Cancel"
                                onClick={cancelEdit}
                              >
                                <X size={15} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn-icon-action edit-btn"
                                title="Edit"
                                onClick={() => startEdit(cat)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="btn-icon-action delete-btn"
                                title="Delete"
                                onClick={() => handleDelete(cat)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {localToast && (
        <div className={`local-toast ${localToast.err ? 'toast-error' : ''}`}>
          {localToast.msg}
        </div>
      )}
    </div>
  );
};

export default Categories;
