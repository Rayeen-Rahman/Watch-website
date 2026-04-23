// backend/routes/userRoutes.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
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

// ── ADMIN: list / get / update / delete ──────────────────────────────────────
router.route('/').get(getUsers);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;
