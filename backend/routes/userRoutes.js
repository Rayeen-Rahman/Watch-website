// backend/routes/userRoutes.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

// ── REGISTER ──────────────────────────────────────────────────────────────────
// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'An account with this email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, role: 'customer' });

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PROFILE ───────────────────────────────────────────────────────────────────
// GET /api/users/profile  (requires login)
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

// PUT /api/users/profile  — update name, email, phone, optional password
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, phone, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If password change requested, verify current password first
    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ message: 'Current password is required to set a new one' });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match)
        return res.status(401).json({ message: 'Current password is incorrect' });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (name)  user.name  = name;
    if (email) user.email = email.toLowerCase();
    if (phone !== undefined) user.phone = phone;

    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ADMIN: list / get / update / delete (all require admin auth) ─────────────
router.route('/').get(protect, isAdmin, getUsers);
router.route('/:id')
  .get(protect, isAdmin, getUserById)
  .put(protect, isAdmin, updateUser)
  .delete(protect, isAdmin, deleteUser);

module.exports = router;
