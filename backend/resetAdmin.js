require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hashed = await bcrypt.hash('Admin123!', 10);
  await mongoose.connection.collection('users').updateOne(
    {email: 'admin@watchvault.com'},
    {$set: {password: hashed}}
  );
  console.log('Password reset successful');
  process.exit(0);
});
