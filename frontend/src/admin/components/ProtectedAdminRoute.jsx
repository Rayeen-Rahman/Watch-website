import { Navigate } from 'react-router-dom';

/**
 * Step 18 — ProtectedAdminRoute
 * Reads user from localStorage (set during login).
 * Redirects to /login if not authenticated, or back to / if not admin.
 */
const ProtectedAdminRoute = ({ children }) => {
  let user = null;
  try {
    const raw = localStorage.getItem('adminUser');
    if (raw) user = JSON.parse(raw);
  } catch {
    user = null;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  return children;
};

export default ProtectedAdminRoute;
