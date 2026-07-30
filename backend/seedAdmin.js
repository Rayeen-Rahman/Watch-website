/**
 * seedAdmin.js — One-time script to create your first admin user
 *
 * Usage:
 *   node seedAdmin.js
 *
 * Run from: e:\watch website\backend\
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');
const dns      = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('./models/User');

// ── Read from environment variables to prevent hardcoded credential leaks ────
const ADMIN_NAME     = process.env.ADMIN_NAME || 'Super Admin';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  console.error('   Please define them in your environment or .env file before seeding.');
  process.exit(1);
}
// ─────────────────────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI   ||
      'mongodb://127.0.0.1:27017/watch-store';

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`⚠️  Admin already exists: ${ADMIN_EMAIL}`);
      console.log('   Delete the user from MongoDB Atlas first if you want to reset.');
      process.exit(0);
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: hashed,
      role:     'admin',
      status:   'Active',
      isActive: true,
    });

    console.log('');
    console.log('🎉 Admin account created successfully!');
    console.log('─────────────────────────────────────');
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   Role     : admin`);
    console.log('─────────────────────────────────────');
    console.log('   Login at : http://localhost:5173/admin/login');
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seed();
