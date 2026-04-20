import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddProductPanel.css';

const LABEL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const NUMERIC_SIZES = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

const AddProductPanel = ({ isOpen, onClose, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    oldPrice: '',
    shortDescription: '',
    description: '',
    images: '',
    category: '650a3f9e9d1a1b1c3d4e5f6a',
    brand: '',
    tag: '',
  });
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleSize = (size) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const imageArray = formData.images ? formData.images.split(',').map(i => i.trim()) : [];

    const productPayload = {
      name: formData.name,
      price: Number(formData.price),
      oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
      shortDescription: formData.shortDescription,
      description: formData.description,
      images: imageArray,
      category: formData.category,
      brand: formData.brand || 'WATCH',
      tag: formData.tag,
      sizes: selectedSizes,
    };

    try {
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add product');
      showToast('Product added successfully');
      setFormData({ name: '', price: '', oldPrice: '', shortDescription: '', description: '', images: '', category: '650a3f9e9d1a1b1c3d4e5f6a', brand: '', tag: '' });
      setSelectedSizes([]);
      onClose();
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="slide-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Add New Product</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Chronograph Obsidian" />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Price (৳)</label>
              <input type="number" name="price" required min="0" value={formData.price} onChange={handleChange} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Old Price (৳) <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem' }}>(optional)</span></label>
              <input type="number" name="oldPrice" min="0" value={formData.oldPrice} onChange={handleChange} placeholder="0" />
            </div>
          </div>

          {/* Step 61: Short Description field */}
          <div className="form-group">
            <label>Short Description</label>
            <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleChange} placeholder="Brief highlight sentence (shown on cards)" />
          </div>

          <div className="form-group">
            <label>Full Description (Required)</label>
            <textarea name="description" required rows="4" value={formData.description} onChange={handleChange} placeholder="Detailed product specifications..."></textarea>
          </div>

          <div className="form-group">
            <label>Brand</label>
            <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. SEIKO, CASIO, WATCH" />
          </div>

          {/* Step 61: Sizes checkbox grid */}
          <div className="form-group">
            <label>Sizes</label>
            <div className="sizes-grid">
              {LABEL_SIZES.map(s => (
                <label key={s} className={`size-chip ${selectedSizes.includes(s) ? 'active' : ''}`}>
                  <input type="checkbox" hidden checked={selectedSizes.includes(s)} onChange={() => toggleSize(s)} />
                  {s}
                </label>
              ))}
            </div>
            <div className="sizes-grid sizes-grid-numeric" style={{ marginTop: '8px' }}>
              {NUMERIC_SIZES.map(s => (
                <label key={s} className={`size-chip ${selectedSizes.includes(s) ? 'active' : ''}`}>
                  <input type="checkbox" hidden checked={selectedSizes.includes(s)} onChange={() => toggleSize(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Tag <span style={{ color: 'var(--admin-text-secondary)', fontSize: '0.8rem' }}>(e.g. popular, new, sale)</span></label>
            <input type="text" name="tag" value={formData.tag} onChange={handleChange} placeholder="popular" />
          </div>

          <div className="form-group">
            <label>Images (Comma-separated URLs)</label>
            <input type="text" name="images" placeholder="https://image1.jpg, https://image2.jpg" value={formData.images} onChange={handleChange} />
          </div>

          <div className="panel-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductPanel;
