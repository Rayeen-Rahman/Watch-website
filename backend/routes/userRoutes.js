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
    if (!name || typeof name !== 'string' || !name.trim() ||
        !email || typeof email !== 'string' || !email.trim() ||
        !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name: cleanName, email: cleanEmail, password: hashed, role: 'customer' });

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    if (err.name === 'ValidationError' || err.code === 11000) {
      return res.status(400).json({ message: err.message || 'Invalid user data' });
    }
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

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' });

    // Reject banned or deactivated accounts before issuing a token
    if (user.status === 'Banned' || user.isActive === false)
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
    const { name, email, phone, address, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const emailChanging = normalizedEmail && normalizedEmail !== user.email;
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
      if (typeof newPassword !== 'string' || newPassword.trim().length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }
      user.password = await bcrypt.hash(newPassword.trim(), 10);
    }
    if (name !== undefined) {
      const cleanName = typeof name === 'string' ? name.trim() : '';
      if (!cleanName) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      user.name = cleanName;
    }
    if (emailChanging) {
      const emailLower = email.toLowerCase().trim();
      const emailTaken = await User.findOne({
        email: emailLower,
        _id: { $ne: user._id }
      });
      if (emailTaken) {
        return res.status(400).json({ message: 'Another account with this email address already exists.' });
      }
      user.email = emailLower;
    }
    if (phone !== undefined) user.phone = String(phone).trim();
    if (address !== undefined) {
      if (typeof address === 'object' && address !== null) {
        user.address = {
          street: address.street ? String(address.street).trim() : (user.address?.street || ''),
          city: address.city ? String(address.city).trim() : (user.address?.city || ''),
          zip: address.zip ? String(address.zip).trim() : (user.address?.zip || ''),
        };
      } else if (typeof address === 'string') {
        user.address = {
          street: address.trim(),
          city: user.address?.city || '',
          zip: user.address?.zip || '',
        };
      }
    }

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone || '',
      address: updated.address || null,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Another account with this email address already exists.' });
    }
    res.status(500).json({ message: err.message });
  }
});

// ── PASSWORD RESET (public routes — must be BEFORE /:id) ─────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') return res.status(400).json({ message: 'A valid email is required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // If user exists, generate & save token before responding to ensure database write is successful
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      // Hash token before storing it (Bug #20)
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      user.resetToken = hashedToken;
      user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
      await user.save();
      
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
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

const handleResetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: 'Token and new password are required' });

    const cleanToken = String(token).trim();
    const cleanPassword = String(newPassword).trim();

    if (!cleanToken)
      return res.status(400).json({ message: 'A valid token is required' });
    if (cleanPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Hash the token to compare against database (Bug #20)
    const hashedToken = crypto.createHash('sha256').update(cleanToken).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    });
    if (!user)
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });

    user.password = await bcrypt.hash(cleanPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.route('/reset-password')
  .put(handleResetPassword)
  .post(handleResetPassword);

// ── ADMIN: list / get / update / delete (all require admin auth) ─────────────
// IMPORTANT: must be AFTER all named routes so /:id doesn't shadow them
router.route('/').get(protect, isAdmin, getUsers).post(protect, isAdmin, createUser);
router.route('/:id')
  .get(protect, isAdmin, getUserById)
  .put(protect, isAdmin, updateUser)
  .delete(protect, isAdmin, deleteUser);

module.exports = router;
