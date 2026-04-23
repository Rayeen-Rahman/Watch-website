// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'User name is required'],
    trim:     true,
  },
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    trim:      true,
    match:     [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type:     String,
    default:  '',   // empty for admin-created users without a password set
  },
  role: {
    type:    String,
    enum:    ['customer', 'admin', 'manager'],
    default: 'customer',
  },
  // Admin panel uses string status (Active/Banned)
  status: {
    type:    String,
    enum:    ['Active', 'Banned'],
    default: 'Active',
  },
  // Auth guard uses boolean isActive
  isActive: {
    type:    Boolean,
    default: true,
  },
  phone: {
    type:    String,
    default: '',
  },
  address: {
    street: String,
    city:   String,
    zip:    String,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
