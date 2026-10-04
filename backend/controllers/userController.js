const crypto   = require('crypto');
const mongoose = require('mongoose');
const User     = require('../models/User');
const bcrypt   = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    // Optional server-side pagination for scalability
    if (req.query.limit || req.query.pageNumber) {
      let limit = parseInt(req.query.limit, 10) || 20;
      let page  = parseInt(req.query.pageNumber, 10) || 1;
      if (limit < 1) limit = 20;
      if (limit > 100) limit = 100;
      if (page < 1) page = 1;

      const count = await User.countDocuments({});
      const users = await User.find({})
        .select('-password')
        .limit(limit)
        .skip(limit * (page - 1))
        .sort({ createdAt: -1 });
      return res.json({ users, page, pages: Math.ceil(count / limit), total: count });
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Create user (Admin Dashboard addition)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, phone, role, status, password } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // EDGE CASE: Verify user doesn't already exist (prevent E11000 Mongo error)
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    // Hash password if provided, otherwise use a random secure default
    let hashedPassword = '';
    if (password && password.trim().length >= 6) {
      hashedPassword = await bcrypt.hash(password.trim(), 10);
    } else if (password) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    } else {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      hashedPassword = await bcrypt.hash(randomPassword, 10);
    }

    const userStatus = status || 'Active';
    const user = new User({
      name: cleanName,
      email: cleanEmail,
      phone: phone ? String(phone).trim() : '',
      role: role || 'customer',
      status:   userStatus,
      isActive: userStatus === 'Active',
      password: hashedPassword,
    });

    const createdUser = await user.save();
    // Never return the password hash
    const { password: _pw, ...safeUser } = createdUser.toObject();
    res.status(201).json(safeUser);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Invalid user data' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, phone, role, status } = req.body;
    
    // Prevent admins from demoting or deactivating their own account
    if (req.user && String(req.user._id) === req.params.id) {
      if (role && role !== 'admin') {
        return res.status(400).json({ message: 'You cannot demote your own account.' });
      }
      if (status && status !== 'Active') {
        return res.status(400).json({ message: 'You cannot deactivate or ban your own account.' });
      }
    }

    const user = await User.findById(req.params.id);

    if (user) {
      // Prevent demoting or deactivating the last remaining active administrator
      if ((role && role !== 'admin') || (status && status !== 'Active')) {
        if (user.role === 'admin' && user.status === 'Active') {
          const otherAdmins = await User.countDocuments({
            role: 'admin',
            status: 'Active',
            _id: { $ne: user._id }
          });
          if (otherAdmins === 0) {
            return res.status(400).json({
              message: 'Cannot demote or deactivate the last remaining active administrator.'
            });
          }
        }
      }

      if (name !== undefined) {
        const cleanName = typeof name === 'string' ? name.trim() : '';
        if (!cleanName) {
          return res.status(400).json({ message: 'User name cannot be empty' });
        }
        user.name = cleanName;
      }

      if (email !== undefined) {
        const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        if (!cleanEmail) {
          return res.status(400).json({ message: 'A valid email is required' });
        }
        if (cleanEmail !== user.email) {
          // Check no other user already has this email
          const emailTaken = await User.findOne({
            email: cleanEmail,
            _id: { $ne: user._id }  // exclude the current user
          });
          if (emailTaken) {
            return res.status(400).json({
              message: 'Another account with this email address already exists.'
            });
          }
          user.email = cleanEmail;
        }
      }
      user.phone = phone !== undefined ? String(phone).trim() : user.phone;
      user.role = role || user.role;
      if (status) {
        user.status = status;
        user.isActive = status === 'Active';
      }

      const updatedUser = await user.save();
      const { password: _pw, resetToken: _rt, resetTokenExpiry: _rte, ...safeUser } = updatedUser.toObject();
      res.json(safeUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message || 'Invalid user data' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admins from deleting their own account
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({
        message: 'You cannot delete your own account.'
      });
    }

    const user = await User.findById(req.params.id);

    if (user) {
      if (user.role === 'admin' && user.status === 'Active') {
        const otherAdmins = await User.countDocuments({
          role: 'admin',
          status: 'Active',
          _id: { $ne: user._id }
        });
        if (otherAdmins === 0) {
          return res.status(400).json({
            message: 'Cannot delete the last remaining active administrator.'
          });
        }
      }

      await user.deleteOne();
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
