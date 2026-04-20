import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddProductPanel.css';

const AddProductPanel = ({ isOpen, onClose, showToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    shortDescription: '',
    description: '',
    images: '',
    category: '650a3f9e9d1a1b1c3d4e5f6a' // Dummy MongoDB ObjectId for MVP
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Parse comma separated URLs into array
    const imageArray = formData.images ? formData.images.split(',').map(i => i.trim()) : [];

    const productPayload = {
      name: formData.name,
      price: Number(formData.price),
      description: formData.description, // Model specifically requires description
      category: formData.category,
      images: imageArray
    };

    try {
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to add product');
      
      showToast('Product added successfully');
      // Reset form
      setFormData({ name: '', price: '', shortDescription: '', description: '', images: '', category: '650a3f9e9d1a1b1c3d4e5f6a' });
      onClose(); // Automatically slide out
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panel-overlay" onClick={onClose}>
      {/* stopPropagation prevents overlay click from triggering inside the panel */}
      <div className="slide-panel" onClick={e => e.stopPropagation()}>
        
        <div className="panel-header">
          <h3>Add New Product</h3>
          <button className="btn-icon" onClick={onClose}><X size={20}/></button>
        </div>
        
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Chronograph Obsidian" />
          </div>
          
          <div className="form-group">
            <label>Price ($)</label>
            <input type="number" name="price" required min="0" step="0.01" value={formData.price} onChange={handleChange} placeholder="0.00" />
          </div>

          <div className="form-group">
            <label>Short Description</label>
            <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleChange} placeholder="Brief highlight sentence" />
          </div>

          <div className="form-group">
            <label>Full Description (Required)</label>
            <textarea name="description" required rows="5" value={formData.description} onChange={handleChange} placeholder="Detailed product specifications..."></textarea>
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
