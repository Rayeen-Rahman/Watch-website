import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MoreHorizontal, Search, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';
import EditUserPanel from '../components/EditUserPanel';
import AddUserPanel from '../components/AddUserPanel';
import './Products.css';

const API = import.meta.env.VITE_API_URL;

const Users = ({ showToast }) => {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [isEditOpen,   setIsEditOpen]   = useState(false);
  const [isAddOpen,    setIsAddOpen]    = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds,  setSelectedIds]  = useState([]);
  const [openKebab,    setOpenKebab]    = useState(null);
  const [emailSort,    setEmailSort]    = useState('none');
  const [rowsPerPage,  setRowsPerPage]  = useState(10);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('all');

  const localToastRef = useRef(null);
  const [localToast, setLocalToast] = useState(null);
  const toast = showToast || ((msg) => {
    setLocalToast(msg);
    clearTimeout(localToastRef.current);
    localToastRef.current = setTimeout(() => setLocalToast(null), 3000);
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try {
      const res = await fetch(`${API}/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) { setOpenKebab(null); fetchUsers(); toast('User deleted.'); }
      else { const d = await res.json(); toast(d.message || 'Delete failed', true); }
    } catch (err) { toast(err.message, true); }
  };

  // ── Ban / Unban ─────────────────────────────────────────────────────────────
  const toggleBan = async (user) => {
    const newStatus = user.status === 'Active' ? 'Banned' : 'Active';
    try {
      const res = await fetch(`${API}/api/users/${user._id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
      setOpenKebab(null);
      toast(`User ${newStatus === 'Banned' ? 'banned' : 'unbanned'}.`);
    } catch (err) { toast(err.message, true); }
  };

  // ── Filter & sort ───────────────────────────────────────────────────────────
  const filtered = [...users]
    .filter(u => {
      const matchRole   = roleFilter === 'all' || u.role === roleFilter;
      const matchSearch = !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    })
    .sort((a, b) => {
      if (emailSort === 'asc')  return a.email.localeCompare(b.email);
      if (emailSort === 'desc') return b.email.localeCompare(a.email);
      return 0;
    });

  // ── Pagination ──────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage   = Math.min(currentPage, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const handleSelectAll = (e) =>
    setSelectedIds(e.target.checked ? pageRows.map(u => u._id) : []);
  const handleSelectOne = (e, id) =>
    setSelectedIds(e.target.checked ? [...selectedIds, id] : selectedIds.filter(x => x !== id));

  const emailSortIcon = emailSort === 'asc' ? ' ↑' : emailSort === 'desc' ? ' ↓' : ' ↕';
  const toggleEmailSort = () =>
    setEmailSort(p => p === 'none' ? 'asc' : p === 'asc' ? 'desc' : 'none');

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{ margin: 0, fontWeight: 500 }}>Users Management</h2>
        <button className="btn-primary-sm" onClick={() => setIsAddOpen(true)}>+ Add User</button>
      </div>

      {/* Filters */}
      <div className="orders-filter-row">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setCurrentPage(1); } }}
          />
        </div>
        <button className="btn-icon-sm" onClick={() => { setSearch(searchInput); setCurrentPage(1); }}>
          <Search size={14} />
        </button>
        <button className="btn-icon-sm" onClick={() => { setSearch(''); setSearchInput(''); setRoleFilter('all'); setCurrentPage(1); }}>
          <RefreshCw size={14} />
        </button>
        <div className="status-filter-tabs">
          {['all', 'admin', 'manager'].map(r => (
            <button
              key={r}
              className={`filter-tab ${roleFilter === r ? 'filter-tab-active' : ''}`}
              onClick={() => { setRoleFilter(r); setCurrentPage(1); }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 30, color: 'var(--admin-text-secondary)' }}>Loading users...</div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" onChange={handleSelectAll}
                    checked={selectedIds.length === pageRows.length && pageRows.length > 0} />
                </th>
                <th>Avatar</th>
                <th>Name</th>
                <th onClick={toggleEmailSort} style={{ cursor: 'pointer', userSelect: 'none' }} title="Sort by email">
                  Email{emailSortIcon}
                </th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(user => (
                <tr key={user._id} className={[
                  selectedIds.includes(user._id) ? 'selected-row' : '',
                  user.status === 'Banned' ? 'banned-row' : '',
                ].filter(Boolean).join(' ')}>
                  <td>
                    <input type="checkbox"
                      checked={selectedIds.includes(user._id)}
                      onChange={e => handleSelectOne(e, user._id)} />
                  </td>
                  <td>
                    <div className="user-avatar-small"
                      style={{ background: user.status === 'Banned' ? '#3a1a1a' : undefined }}>
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{user.name}</td>
                  <td style={{ color: 'var(--admin-text-secondary)' }}>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                  </td>
                  <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.88rem' }}>
                    {user.phone || '—'}
                  </td>
                  <td>
                    <span className={`status-badge ${user.status === 'Active' ? 'status-active' : 'status-banned'}`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ position: 'relative' }}>
                    <button className="btn-icon kebab-btn"
                      onClick={() => setOpenKebab(openKebab === user._id ? null : user._id)}>
                      <MoreHorizontal size={16} />
                    </button>
                    {openKebab === user._id && (
                      <div className="kebab-menu">
                        <button onClick={() => { setSelectedUser(user); setIsEditOpen(true); setOpenKebab(null); }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => toggleBan(user)}>
                          {user.status === 'Active'
                            ? <><ShieldOff size={13} style={{ marginRight: 6 }} />Ban User</>
                            : <><ShieldCheck size={13} style={{ marginRight: 6 }} />Unban User</>}
                        </button>
                        <button className="kebab-danger" onClick={() => handleDeleteUser(user._id)}>
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 30 }}>No users found.</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination footer */}
          <div className="table-footer">
            <span className="footer-selected">{selectedIds.length} of {filtered.length} row(s) selected.</span>
            <div className="footer-right">
              <span className="footer-label">Rows per page:</span>
              <select className="rows-per-page-select" value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="footer-label">{safePage} of {totalPages}</span>
              <div className="page-nav-btns">
                <button onClick={() => setCurrentPage(1)}           disabled={safePage === 1}          title="First">|◀</button>
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={safePage === 1}          title="Prev">◀</button>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={safePage === totalPages} title="Next">▶</button>
                <button onClick={() => setCurrentPage(totalPages)}   disabled={safePage === totalPages} title="Last">▶|</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {localToast && <div className="local-toast">{localToast}</div>}

      <EditUserPanel isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}
        user={selectedUser} showToast={toast} onSave={fetchUsers} />
      <AddUserPanel isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}
        showToast={toast} onSave={fetchUsers} />
    </div>
  );
};

export default Users;
