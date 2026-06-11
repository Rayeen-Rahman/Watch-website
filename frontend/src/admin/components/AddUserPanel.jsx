import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AddProductPanel.css'; // reuse panel styles

const AddUserPanel = ({ isOpen, onClose, showToast, onSave }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'customer'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add user');
      showToast('User added successfully');
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'customer' });
      onSave && onSave();
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
          <h3>Add New User</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-row-2">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} placeholder="e.g. Ahmad" />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} placeholder="e.g. Reza" />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="user@example.com" />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="panel-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserPanel;
