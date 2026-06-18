// frontend/src/customer/components/LoginModal.jsx
import { useState, useRef, useEffect } from 'react';
import { X, Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API } from '../../utils/api';
import './LoginModal.css';

const LoginModal = ({ onClose }) => {
  const { login } = useAuth();
  const [tab,         setTab]         = useState('login');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [name,        setName]        = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');



  const resetForm = () => {
    setEmail(''); setPassword(''); setName('');
    setConfirmPass(''); setError(''); setSuccess('');
  };

  const switchTab = (t) => { setTab(t); resetForm(); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/users/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      login(data.user || data, data.token);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send reset email');
      setSuccess('If this email exists, a reset link has been sent.');
      switchTab('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPass) { setError('Passwords do not match'); return; }
    if (password.length < 6)      { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/users/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setSuccess('Account created! You can now log in.');
      switchTab('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalRef = useRef(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = modal.querySelectorAll(
      'button, input, a, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    modal.addEventListener('keydown', trapFocus);
    first?.focus();
    return () => modal.removeEventListener('keydown', trapFocus);
  }, [tab]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" ref={modalRef} onClick={e => e.stopPropagation()}>

        {/* Close button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Brand mark */}
        <div className="modal-brand">
          <img src="/logo.png" alt="Artifact BD Logo" style={{ width: '22px', height: '22px', objectFit: 'contain', verticalAlign: 'middle', marginRight: '6px' }} />
          Artifact BD
        </div>

        {/* Tab switcher */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >Sign In</button>
          <button
            className={`modal-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
          >Create Account</button>
        </div>

        {success && <p className="modal-success">{success}</p>}
        {error   && <p className="modal-error">{error}</p>}

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="modal-form">
            <label>Email Address</label>
            <input
              type="email" required autoFocus
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />

            <label>Password</label>
            <div className="pass-input-wrap">
              <input
                type={showPass ? 'text' : 'password'} required
                placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <button type="button" className="toggle-pass" onClick={() => setShowPass(p => !p)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <p style={{ textAlign: 'right', margin: '4px 0 8px', fontSize: '0.8rem' }}>
              <button type="button" className="link-btn"
                onClick={() => setTab('forgot')}>
                Forgot password?
              </button>
            </p>

            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? <Loader size={16} className="spin" /> : 'Sign In'}
            </button>

            <p className="modal-switch-text">
              No account?{' '}
              <button type="button" className="link-btn" onClick={() => switchTab('register')}>
                Create one
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="modal-form">
            <label>Full Name</label>
            <input
              type="text" required autoFocus
              placeholder="Your full name"
              value={name} onChange={e => setName(e.target.value)}
            />

            <label>Email Address</label>
            <input
              type="email" required
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />

            <label>Password</label>
            <div className="pass-input-wrap">
              <input
                type={showPass ? 'text' : 'password'} required
                placeholder="Min. 6 characters"
                value={password} onChange={e => setPassword(e.target.value)}
              />
              <button type="button" className="toggle-pass" onClick={() => setShowPass(p => !p)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <label>Confirm Password</label>
            <input
              type="password" required
              placeholder="Repeat your password"
              value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
            />

            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? <Loader size={16} className="spin" /> : 'Create Account'}
            </button>

            <p className="modal-switch-text">
              Already have an account?{' '}
              <button type="button" className="link-btn" onClick={() => switchTab('login')}>
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* ── FORGOT PASSWORD FORM ── */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="modal-form">
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
              Enter your email address and we will send you a reset link.
            </p>
            <label>Email Address</label>
            <input
              type="email" required autoFocus
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? <Loader size={16} className="spin" /> : 'Send Reset Link'}
            </button>
            <p className="modal-switch-text">
              <button type="button" className="link-btn" onClick={() => switchTab('login')}>
                Back to Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
