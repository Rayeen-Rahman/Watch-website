import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './EditUserPanel.css';

import { API } from '../../utils/api';

const EditUserPanel = ({ isOpen, onClose, user, onSave, showToast }) => {
  const { token, user: loggedInUser, handleUnauthorized } = useAuth();
  const isSelf = Boolean(loggedInUser && user && String(loggedInUser._id) === String(user._id));
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'admin',
    status: 'Active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const nameParts = user.name ? user.name.split(' ') : [''];
      const first = nameParts[0] || '';
      const last = nameParts.slice(1).join(' ') || '';

      setFormData({
        firstName: first,
        lastName: last,
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'admin',
        status: user.status || 'Active'
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.firstName.trim()) {
      showToast('First name is required', true);
      return;
    }
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail) {
      showToast('Valid email is required', true);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API}/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: fullName,
          email: cleanEmail,
          phone: formData.phone ? formData.phone.trim() : '',
          role: formData.role,
          status: formData.status
        })
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user');

      showToast('User updated successfully', false);
      if (onSave) onSave(data);
      onClose();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="edit-user-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>Edit User</h3>
          <button className="btn-close" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
            <div className="form-group">
              <label>First Name *</label>
              <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="form-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
            <div className="form-group">
              <label>Role {isSelf && <span style={{ fontSize: '0.75rem', color: '#888' }}>(Cannot self-modify)</span>}</label>
              <select name="role" value={formData.role} onChange={handleChange} disabled={isSelf} title={isSelf ? 'You cannot change your own role' : ''}>
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status {isSelf && <span style={{ fontSize: '0.75rem', color: '#888' }}>(Cannot self-modify)</span>}</label>
              <select name="status" value={formData.status} onChange={handleChange} disabled={isSelf} title={isSelf ? 'You cannot change your own status' : ''}>
                <option value="Active">Active</option>
                <option value="Banned">Banned</option>
              </select>
            </div>
          </div>

          <div className="form-actions" style={{marginTop: 'auto'}}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserPanel;
