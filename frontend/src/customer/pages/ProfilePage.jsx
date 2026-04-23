import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

const API = import.meta.env.VITE_API_URL;

const ProfilePage = () => {
  const { user, token, login } = useAuth();

  const [name,        setName]        = useState(user?.name    || '');
  const [email,       setEmail]       = useState(user?.email   || '');
  const [phone,       setPhone]       = useState(user?.phone   || '');
  const [curPass,     setCurPass]     = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState({ text: '', err: false });

  if (!user) {
    return (
      <div className="profile-unauth">
        <User size={60} strokeWidth={1} />
        <h2>Sign in to view your profile</h2>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (newPass && newPass !== confirmPass) {
      setMsg({ text: 'New passwords do not match', err: true }); return;
    }
    if (newPass && newPass.length < 6) {
      setMsg({ text: 'New password must be at least 6 characters', err: true }); return;
    }
    setSaving(true); setMsg({ text: '', err: false });
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name, email, phone, currentPassword: curPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      // Update auth context with new name/email
      login({ ...user, name: data.name || name, email: data.email || email }, token);
      setMsg({ text: 'Profile updated successfully!', err: false });
      setCurPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      setMsg({ text: err.message, err: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-role">{user.role === 'admin' ? '⚙️ Administrator' : 'Customer'}</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          {msg.text && (
            <p className={`profile-msg ${msg.err ? 'profile-err' : 'profile-ok'}`}>{msg.text}</p>
          )}

          <div className="profile-section">
            <h3 className="profile-section-title">Personal Info</h3>
            <div className="profile-field">
              <label><User size={14} /> Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="profile-field">
              <label><Mail size={14} /> Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="profile-field">
              <label><Phone size={14} /> Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
          </div>

          <div className="profile-section">
            <h3 className="profile-section-title">Change Password <span>(optional)</span></h3>
            <div className="profile-field">
              <label><Lock size={14} /> Current Password</label>
              <div className="pass-wrap">
                <input type={showPass ? 'text' : 'password'} value={curPass} onChange={e => setCurPass(e.target.value)} placeholder="Required to change password" />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(p => !p)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="profile-field">
              <label><Lock size={14} /> New Password</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min. 6 characters" />
            </div>
            <div className="profile-field">
              <label><Lock size={14} /> Confirm New Password</label>
              <input type="password" value={newPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repeat new password" />
            </div>
          </div>

          <button type="submit" className="btn-save-profile" disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
