// backend/routes/userRoutes.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const nodemailer = require('nodemailer');
const User    = require('../models/User');
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getUsers,
  getUserById,
  createUser,
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
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });

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

    // Reject banned accounts before issuing a token
    if (user.status === 'Banned')
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        phone: user.phone || '',
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

    const emailChanging = email && email.toLowerCase() !== user.email;
    const passwordChanging = !!newPassword;

    // Verify current password first to prevent comparing against updated hash (Bug #19)
    if (emailChanging || passwordChanging) {
      if (!currentPassword) {
        return res.status(400).json({
          message: 'Current password is required to change email or password'
        });
      }
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }

    // Mutate after verification succeeds
    if (newPassword) {
      user.password = await bcrypt.hash(newPassword, 10);
    }
    if (name) user.name = name;
    if (emailChanging) {
      user.email = email.toLowerCase();
    }
    if (phone !== undefined) user.phone = phone;

    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role, phone: updated.phone || '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ADMIN: list / get / update / delete (all require admin auth) ─────────────
router.route('/').get(protect, isAdmin, getUsers).post(protect, isAdmin, createUser);
router.route('/:id')
  .get(protect, isAdmin, getUserById)
  .put(protect, isAdmin, updateUser)
  .delete(protect, isAdmin, deleteUser);

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // If user exists, generate & save token before responding to ensure database write is successful
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      // Hash token before storing it (Bug #20)
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      user.resetToken = hashedToken;
      user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
      await user.save();
      
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      
      // Send email asynchronously in background, catching errors separately to prevent double response
      transporter.sendMail({
        from: `"Artifact BD" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Reset your Artifact BD password',
        html: `<p>Click to reset: <a href="${resetUrl}">${resetUrl}</a>. Expires in 1 hour.</p>`
      }).catch(err => {
        console.error('Mail transport error in forgot-password:', err.message);
      });
    }

    // Always return success — never reveal if email exists (security)
    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    // Only here if db query or token save fails before res.json is called
    res.status(500).json({ message: err.message });
  }
});

router.put('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: 'Token and new password are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Hash the token to compare against database (Bug #20)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    });
    if (!user)
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
