import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddCategoryPanel.css';

const AddCategoryPanel = ({ isOpen, onClose, showToast }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add category');

      showToast('Category added successfully', false);
      setName('');
      onClose();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="category-slide-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Add New Category</h3>
          <button className="btn-close" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Luxury Watches" 
            />
            <small>Slug will be auto-generated uniquely (e.g. luxury-watches)</small>
          </div>

          <div className="form-actions" style={{marginTop: 'auto'}}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryPanel;
