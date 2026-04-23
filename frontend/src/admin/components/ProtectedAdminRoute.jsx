// frontend/src/admin/components/ProtectedAdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // While restoring session from localStorage, show a neutral loader
  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#0a0a0a', color: '#fff', fontSize: '1rem',
      }}>
        Loading...
      </div>
    );
  }

  // Not logged in at all → send to homepage
  if (!user) return <Navigate to="/" replace />;

  // Logged in but not admin → send to homepage
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  return children;
};

export default ProtectedAdminRoute;
