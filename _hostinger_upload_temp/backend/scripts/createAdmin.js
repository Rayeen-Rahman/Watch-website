// backend/scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');
const User     = require('../models/User');

dotenv.config({ path: '../.env' });

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/watch-store';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB...');

    const adminEmail = 'admin@watchvault.com';
    const adminPass  = 'admin123';
    
    // Check if exists
    let user = await User.findOne({ email: adminEmail });

    const hashedPassword = await bcrypt.hash(adminPass, 10);

    if (user) {
      console.log(`User ${adminEmail} already exists. Updating to Admin...`);
      user.role = 'admin';
      user.password = hashedPassword;
      user.status = 'Active';
      user.isActive = true;
      await user.save();
      console.log('Admin user updated successfully.');
    } else {
      console.log(`Creating new Admin user: ${adminEmail}...`);
      await User.create({
        name:     'Super Admin',
        email:    adminEmail,
        password: hashedPassword,
        role:     'admin',
        status:   'Active',
        isActive: true
      });
      console.log('Admin user created successfully.');
    }

    console.log('\n-----------------------------------');
    console.log('LOGIN DETAILS:');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPass}`);
    console.log('-----------------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
};

createAdmin();
