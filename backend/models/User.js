const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['admin', 'manager'],
    default: 'admin'
  },
  status: {
    type: String,
    enum: ['Active', 'Banned'],
    default: 'Active'
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);
