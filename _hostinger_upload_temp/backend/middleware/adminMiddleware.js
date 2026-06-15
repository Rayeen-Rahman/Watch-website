/**
 * isAdmin middleware — Step 17
 * Checks that the authenticated user has role === 'admin'.
 * Must be used AFTER `protect` middleware.
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

module.exports = { isAdmin };
