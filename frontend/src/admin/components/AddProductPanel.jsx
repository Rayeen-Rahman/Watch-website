import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, Trash2 } from 'lucide-react';
import './AddProductPanel.css';

const AddProductPanel = ({ isOpen, onClose, showToast, onSave }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name:             '',
    brand:            '',
    price:            '',
    oldPrice:         '',
    shortDescription: '',
    description:      '',
    category:         '',
    tag:              '',
    stock:            '',
    dialColor:        '',
    strapMaterial:    '',
    movementType:     '',
    caseSize:         '',
    waterResistance:  '',
    gender:           '',
    isBestSeller:     false,
    isFeatured:       false,
  });

  // Fetch categories when panel opens
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/categories`)
      .then(r => r.json())
      .then(d => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [isOpen]);

  const [images, setImages]           = useState([]);   // array of URL strings
  const [urlInput, setUrlInput]       = useState('');
  const [uploading, setUploading]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  // ── Image upload from computer ──────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formPayload = new FormData();
    formPayload.append('image', file);
    setUploading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/upload-image`,
        { method: 'POST', body: formPayload }
      );
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setImages(prev => [...prev, data.imageUrl]);
    } catch (err) {
      showToast(`Upload error: ${err.message}`, true);
    } finally {
      setUploading(false);
      e.target.value = ''; // reset file input so same file can be re-uploaded
    }
  };

  // ── Add image via URL ───────────────────────────────────────────────────────
  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    setImages(prev => [...prev, url]);
    setUrlInput('');
  };

  const handleUrlKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); }
  };

  const removeImage = (idx) =>
    setImages(images.filter((_, i) => i !== idx));

  // ── Form submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      showToast('Please add at least one product image.', true);
      return;
    }
    setIsSubmitting(true);
    const payload = {
      name:             formData.name,
      brand:            formData.brand || 'WATCH',
      price:            Number(formData.price),
      oldPrice:         formData.oldPrice ? Number(formData.oldPrice) : null,
      shortDescription: formData.shortDescription,
      description:      formData.description,
      images,
      category:         formData.category,
      tag:              formData.tag,
      stock:            Number(formData.stock) || 0,
      dialColor:        formData.dialColor,
      strapMaterial:    formData.strapMaterial,
      movementType:     formData.movementType,
      caseSize:         formData.caseSize,
      waterResistance:  formData.waterResistance,
      gender:           formData.gender,
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        // Translate technical errors into plain language
        let msg = data.message || 'Failed to add product';
        if (msg.includes('Cast to ObjectId')) {
          msg = 'Please select a valid category from the dropdown. The category field cannot be left empty or typed manually.';
        } else if (msg.includes('validation failed')) {
          msg = 'Some required fields are missing or invalid. Please check all fields marked with *.';
        } else if (msg.includes('duplicate key') || msg.includes('E11000')) {
          msg = 'A product with this name already exists. Please use a different name.';
        } else if (msg.includes('images')) {
          msg = 'Please add at least one product image before saving.';
        }
        throw new Error(msg);
      }
      showToast('Product added successfully ✓');
      onSave && onSave();
      // Reset form
      setFormData({
        name: '', brand: '', price: '', oldPrice: '', shortDescription: '',
        description: '', category: '', tag: '',
        stock: '', dialColor: '', strapMaterial: '', movementType: '',
        caseSize: '', waterResistance: '', gender: '',
        isBestSeller: false, isFeatured: false,
      });
      setImages([]);
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
          <h3>Add New Watch</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="panel-form" onSubmit={handleSubmit}>

          {/* ── Basic Info ── */}
          <div className="form-group">
            <label>Watch Name *</label>
            <input type="text" name="name" required value={formData.name}
              onChange={handleChange} placeholder="e.g. Seiko Prospex Diver" />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Brand *</label>
              <input type="text" name="brand" required value={formData.brand}
                onChange={handleChange} placeholder="e.g. Seiko, Casio" />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select...</option>
                <option>Men</option>
                <option>Women</option>
                <option>Unisex</option>
              </select>
            </div>
          </div>

          <div className="form-row-price">
            <div className="form-group">
              <label>Sale Price (৳) *</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 3500"
                autoComplete="off"
              />
            </div>
            <div className="form-group form-group-narrow">
              <label>Old Price (৳) <span className="label-optional">(optional)</span></label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="oldPrice"
                value={formData.oldPrice}
                onChange={handleChange}
                placeholder="e.g. 4500"
                autoComplete="off"
              />
            </div>
            <div className="form-group form-group-narrow">
              <label>Stock *</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="stock"
                required
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                autoComplete="off"
              />
            </div>
          </div>

          {/* ── Image Upload Section ── */}
          <div className="form-group">
            <label>Product Images *</label>

            {/* Upload from computer */}
            <div
              className={`upload-zone ${uploading ? 'uploading' : ''}`}
              onClick={() => document.getElementById('imgFileInput').click()}
            >
              <Upload size={20} />
              <span>{uploading ? 'Uploading...' : 'Click to upload from computer'}</span>
              <small>JPEG, PNG, WebP — max 5MB</small>
              <input
                id="imgFileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>

            {/* Add via URL */}
            <div className="url-input-row">
              <LinkIcon size={16} className="url-icon" />
              <input
                type="url"
                placeholder="Or paste image URL and press Enter"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={handleUrlKeyDown}
              />
              <button type="button" className="btn-add-url" onClick={handleAddUrl}>Add</button>
            </div>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="image-previews">
                {images.map((url, i) => (
                  <div key={i} className="img-preview-item">
                    <img
                      src={url.startsWith('/uploads')
                        ? `${import.meta.env.VITE_API_URL}${url}`
                        : url}
                      alt={`Product ${i + 1}`}
                      onError={e => { e.target.style.opacity = 0.3; }}
                    />
                    <button
                      type="button"
                      className="img-remove-btn"
                      onClick={() => removeImage(i)}
                      aria-label="Remove image"
                    >
                      <Trash2 size={12} />
                    </button>
                    {i === 0 && <span className="img-main-badge">Main</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Watch Specs ── */}
          <div className="form-section-label">Watch Specifications</div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Movement Type</label>
              <select name="movementType" value={formData.movementType} onChange={handleChange}>
                <option value="">Select...</option>
                <option>Quartz</option>
                <option>Automatic</option>
                <option>Solar</option>
                <option>Kinetic</option>
                <option>Mechanical</option>
                <option>Chronograph</option>
              </select>
            </div>
            <div className="form-group">
              <label>Case Size</label>
              <input type="text" name="caseSize" value={formData.caseSize}
                onChange={handleChange} placeholder="e.g. 40mm, 42mm" />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Dial Color</label>
              <input type="text" name="dialColor" value={formData.dialColor}
                onChange={handleChange} placeholder="e.g. Black, White, Blue" />
            </div>
            <div className="form-group">
              <label>Strap Material</label>
              <input type="text" name="strapMaterial" value={formData.strapMaterial}
                onChange={handleChange} placeholder="e.g. Leather, Steel, Rubber" />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Water Resistance</label>
              <input type="text" name="waterResistance" value={formData.waterResistance}
                onChange={handleChange} placeholder="e.g. 100m, 5 ATM" />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select...</option>
                <option>Men</option>
                <option>Women</option>
                <option>Unisex</option>
              </select>
            </div>
          </div>

          {/* ── Descriptions ── */}
          <div className="form-group">
            <label>Short Description</label>
            <input type="text" name="shortDescription" value={formData.shortDescription}
              onChange={handleChange} placeholder="One-line highlight (shown on product cards)" />
          </div>

          <div className="form-group">
            <label>Full Description *</label>
            <textarea name="description" required rows="4" value={formData.description}
              onChange={handleChange} placeholder="Detailed product specifications..." />
          </div>

          {/* ── Meta ── */}
          <div className="form-row-2">
            <div className="form-group">
              <label>Tag <span className="label-optional">(e.g. new, sale)</span></label>
              <input type="text" name="tag" value={formData.tag}
                onChange={handleChange} placeholder="popular" />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">-- Select a category --</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <small style={{ color: '#f59e0b', marginTop: 4, display: 'block' }}>
                  ⚠ No categories found. Add a category first from the sidebar.
                </small>
              )}
            </div>
          </div>

          {/* ── Status Flags ── */}
          <div className="form-section-label">Visibility Flags</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>
              <input
                type="checkbox"
                name="isBestSeller"
                checked={formData.isBestSeller}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <span>
                <strong>Best Seller</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>Shows in the Best Sellers slider on the homepage</span>
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--admin-text-primary)' }}>
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <span>
                <strong>Featured Product</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>Displayed in the hero section spotlight card</span>
              </span>
            </label>
          </div>

          <div className="panel-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || uploading}>
              {isSubmitting ? 'Saving...' : 'Save Watch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductPanel;
