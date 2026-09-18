require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const targetEmail = process.env.ADMIN_EMAIL || process.env.RESET_ADMIN_EMAIL;
const targetPassword = process.env.ADMIN_PASSWORD || process.env.RESET_ADMIN_PASSWORD;

if (!targetEmail || !targetPassword) {
  console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  process.exit(1);
}

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/watch-store';

mongoose.connect(mongoUri).then(async () => {
  const hashed = await bcrypt.hash(targetPassword, 10);
  const result = await mongoose.connection.collection('users').updateOne(
    { email: targetEmail.toLowerCase().trim() },
    { $set: { password: hashed } }
  );
  if (result.matchedCount === 0) {
    console.log(`⚠️ User not found for email: ${targetEmail}`);
  } else {
    console.log(`✅ Password reset successful for: ${targetEmail}`);
  }
  process.exit(0);
}).catch(err => {
  console.error('Error resetting admin:', err.message);
  process.exit(1);
});
