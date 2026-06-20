import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { API } from '../../utils/api';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', err: false });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setMsg({ text: 'Reset token is missing or invalid.', err: true });
      return;
    }
    if (password.length < 6) {
      setMsg({ text: 'Password must be at least 6 characters.', err: true });
      return;
    }
    if (password !== confirmPassword) {
      setMsg({ text: 'Passwords do not match.', err: true });
      return;
    }

    setLoading(true);
    setMsg({ text: '', err: false });

    try {
      const res = await fetch(`${API}/api/users/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      setSuccess(true);
      setMsg({ text: data.message || 'Password reset successfully.', err: false });
    } catch (err) {
      setMsg({ text: err.message, err: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-pass-page">
      <div className="reset-pass-container">
        <Link to="/" className="breadcrumb-back">
          <ArrowLeft size={16} /> Back to Store
        </Link>

        <div className="reset-pass-card">
          {success ? (
            <div className="reset-success-view">
              <div className="success-icon-wrap">
                <CheckCircle2 size={56} className="success-icon" />
              </div>
              <h2>Password Reset Complete</h2>
              <p className="success-desc">
                Your password has been successfully updated. You can now use your new password to sign in.
              </p>
              <button onClick={() => navigate('/')} className="btn-reset-home">
                Go to Home & Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="reset-header">
                <h2>Reset Your Password</h2>
                <p>Please enter your new password below.</p>
              </div>

              {!token ? (
                <div className="reset-error-view">
                  <AlertTriangle size={48} className="error-icon" />
                  <p>The reset password link is invalid or has expired.</p>
                  <Link to="/" className="btn-reset-home" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none' }}>
                    Go Home
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="reset-form">
                  {msg.text && (
                    <p className={`reset-msg ${msg.err ? 'reset-err' : 'reset-ok'}`}>{msg.text}</p>
                  )}

                  <div className="reset-field">
                    <label><Lock size={14} /> New Password</label>
                    <div className="pass-wrap">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        required
                      />
                      <button type="button" className="pass-toggle" onClick={() => setShowPass(p => !p)}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="reset-field">
                    <label><Lock size={14} /> Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                    />
                  </div>

                  <button type="submit" className="btn-reset-submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
