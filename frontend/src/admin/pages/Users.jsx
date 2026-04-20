import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import EditUserPanel from '../components/EditUserPanel';
import AddUserPanel from '../components/AddUserPanel';
import './Products.css';

const Users = ({ showToast, onOpenAddUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openKebab, setOpenKebab] = useState(null);
  const [emailSort, setEmailSort] = useState('none'); // 'none' | 'asc' | 'desc'

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const localToastRef = useRef(null);
  const [localToast, setLocalToast] = useState(null);
  const triggerToast = showToast || ((msg) => {
    setLocalToast(msg);
    clearTimeout(localToastRef.current);
    localToastRef.current = setTimeout(() => setLocalToast(null), 3000);
  });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setOpenKebab(null);
        fetchUsers();
      } else {
        const d = await res.json();
        triggerToast(d.message || 'Delete failed', true);
      }
    } catch (err) {
      triggerToast(err.message, true);
    }
  };

  // Email sort
  const sortedUsers = [...users].sort((a, b) => {
    if (emailSort === 'asc') return a.email.localeCompare(b.email);
    if (emailSort === 'desc') return b.email.localeCompare(a.email);
    return 0;
  });

  const toggleEmailSort = () => {
    setEmailSort(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none');
  };

  // Pagination slice
  const totalRows = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const pageRows = sortedUsers.slice(startIdx, startIdx + rowsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(pageRows.map(u => u._id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) setSelectedIds(prev => [...prev, id]);
    else setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const emailSortIcon = emailSort === 'asc' ? ' ↑' : emailSort === 'desc' ? ' ↓' : ' ↕';

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{ margin: 0, fontWeight: 500 }}>Users Management</h2>
        <button className="btn-primary-sm" onClick={() => setIsAddOpen(true)}>+ Add User</button>
      </div>

      {loading ? <div>Loading users...</div> : error ? (
        <div className="error-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === pageRows.length && pageRows.length > 0}
                  />
                </th>
                <th>Avatar</th>
                <th>Name</th>
                <th
                  onClick={toggleEmailSort}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Sort by email"
                >
                  Email{emailSortIcon}
                </th>
                <th>Status</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(user => (
                <tr key={user._id} className={selectedIds.includes(user._id) ? 'selected-row' : ''}>
                  <td>
                    <input type="checkbox"
                      checked={selectedIds.includes(user._id)}
                      onChange={(e) => handleSelectOne(e, user._id)}
                    />
                  </td>
                  <td>
                    <div className="user-avatar-small">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge ${user.status === 'Active' ? 'status-active' : 'status-banned'}`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ position: 'relative' }}>
                    <button
                      className="btn-icon kebab-btn"
                      onClick={() => setOpenKebab(openKebab === user._id ? null : user._id)}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {openKebab === user._id && (
                      <div className="kebab-menu">
                        <button onClick={() => { setSelectedUser(user); setIsEditOpen(true); setOpenKebab(null); }}>
                          ✏️ Edit
                        </button>
                        <button className="kebab-danger" onClick={() => handleDeleteUser(user._id)}>🗑️ Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>

          {/* Step 54: Pagination footer */}
          <div className="table-footer">
            <span className="footer-selected">{selectedIds.length} of {totalRows} row(s) selected.</span>
            <div className="footer-right">
              <span className="footer-label">Rows per page:</span>
              <select
                className="rows-per-page-select"
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="footer-label">{safePage} of {totalPages}</span>
              <div className="page-nav-btns">
                <button onClick={() => setCurrentPage(1)} disabled={safePage === 1} title="First">|◀</button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} title="Previous">◀</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} title="Next">▶</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} title="Last">▶|</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {localToast && <div className="local-toast">{localToast}</div>}

      <EditUserPanel
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={selectedUser}
        showToast={triggerToast}
        onSave={() => fetchUsers()}
      />
      <AddUserPanel
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        showToast={triggerToast}
        onSave={() => fetchUsers()}
      />
    </div>
  );
};
export default Users;
