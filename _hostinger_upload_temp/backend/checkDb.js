const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Force Google DNS so MongoDB Atlas SRV records resolve correctly
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/watch-store';

console.log('Connecting to:', mongoUri);

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB!');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const Category = mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    
    const [productsCount, categoriesCount, usersCount, ordersCount] = await Promise.all([
      Product.countDocuments({}),
      Category.countDocuments({}),
      User.countDocuments({}),
      Order.countDocuments({})
    ]);
    
    console.log('Database Stats:');
    console.log('- Products:', productsCount);
    console.log('- Categories:', categoriesCount);
    console.log('- Users:', usersCount);
    console.log('- Orders:', ordersCount);
    
    const adminUser = await User.findOne({ role: 'admin' });
    console.log('Admin user exists:', adminUser ? 'Yes (' + adminUser.email + ')' : 'No');
    
    if (productsCount > 0) {
      console.log('Sample Products:');
      const sample = await Product.find({}).limit(3);
      sample.forEach(p => console.log(`- ${p.get('name')} (Price: ${p.get('price')})`));
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
  });
