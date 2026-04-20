import React, { useState, useEffect } from 'react';
import { Trash2, Edit } from 'lucide-react';
import EditUserPanel from '../components/EditUserPanel';
import './Products.css'; // Inheriting shared table styles

const Users = ({ showToast }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [localToast, setLocalToast] = useState(null);
  const triggerToast = showToast || ((msg) => { setLocalToast(msg); setTimeout(() => setLocalToast(null), 3000); });

  useEffect(() => {
    fetchUsers();
  }, []);

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

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2 style={{margin:0, fontWeight: 500}}>Users Management</h2>
      </div>

      {loading ? (
        <div>Loading users...</div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-avatar-small">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td style={{fontWeight: 500}}>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge ${user.status === 'Active' ? 'status-active' : 'status-banned'}`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Edit" onClick={() => { setSelectedUser(user); setIsEditOpen(true); }}><Edit size={16}/></button>
                      <button className="btn-icon btn-icon-danger" title="Ban User"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="5" style={{textAlign:'center', padding:'30px'}}>No administrators found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {localToast && <div style={{position:'fixed', bottom:'20px', right:'20px', background:'#22C55E', color:'#fff', padding:'10px 20px', borderRadius:'8px', zIndex:5000}}>{localToast}</div>}

      <EditUserPanel 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        user={selectedUser} 
        showToast={triggerToast}
        onSave={() => fetchUsers()} 
      />
    </div>
  );
};
export default Users;
