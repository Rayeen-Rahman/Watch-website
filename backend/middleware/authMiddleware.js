// backend/middleware/authMiddleware.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorised — no token' });

  try {
    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user      = await User.findById(decoded.id).select('-password');
    if (!req.user)
      return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Not authorised — invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  res.status(403).json({ message: 'Access denied — admin only' });
};

module.exports = { protect, isAdmin };
