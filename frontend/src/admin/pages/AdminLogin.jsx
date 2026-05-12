import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [error, setError]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/users/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login failed');

      // Only allow admin/manager roles into the dashboard
      if (data.user.role !== 'admin' && data.user.role !== 'manager') {
        throw new Error('Access denied. Admin accounts only.');
      }

      login(data.user, data.token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Animated background orbs */}
      <div className="login-bg-orb orb-1" />
      <div className="login-bg-orb orb-2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <span className="logo-icon">⌚</span>
          <h1>Watch Vault</h1>
          <p>Admin Dashboard</p>
        </div>

        {error && (
          <div className="login-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@watchvault.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="login-spinner" />
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <p className="login-footer">
          Watch Vault © {new Date().getFullYear()} — Secure Admin Access
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
