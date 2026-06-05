const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Force Google DNS so MongoDB Atlas SRV records resolve correctly
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

dotenv.config();

const Product = require('./models/Product');
const Category = require('./models/Category');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/watch-store';

console.log('Connecting to:', mongoUri);

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB Atlas!');

    // Clear existing data
    console.log('Clearing existing products and categories...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared!');

    // Insert Categories
    console.log('Inserting categories...');
    const catAutomatic = await Category.create({ name: 'Automatic', slug: 'automatic' });
    const catChronograph = await Category.create({ name: 'Chronograph', slug: 'chronograph' });
    const catMinimalist = await Category.create({ name: 'Minimalist', slug: 'minimalist' });
    console.log('Categories created successfully!');

    // Insert Products
    console.log('Inserting products...');
    const productsData = [
      {
        name: 'Zenith Automatic',
        brand: 'Zenith',
        price: 55000,
        oldPrice: 60000,
        discount: 8,
        shortDescription: 'An elegant automatic watch with sapphire glass.',
        description: 'The Zenith Automatic offers a perfect blend of style and engineering. Powered by an automatic movement with a 42-hour power reserve, it features a stainless steel case, sapphire glass, and a transparent case back.',
        dialColor: 'Black',
        strapMaterial: 'Leather',
        movementType: 'Automatic',
        caseSize: '41mm',
        waterResistance: '50m',
        stock: 10,
        images: ['/uploads/products/1776935685203-843015915.png'],
        category: catAutomatic._id,
        isFeatured: true,
        isBestSeller: true,
        tag: 'popular'
      },
      {
        name: 'Chronograph Pro',
        brand: 'Chrono',
        price: 45000,
        oldPrice: 50000,
        discount: 10,
        shortDescription: 'Multi-functional dial with tachymeter scale.',
        description: 'Precision timing meets sporty design. The Chronograph Pro features three sub-dials, date window, tachymeter scale, and durable stainless steel case with silver polish.',
        dialColor: 'Silver',
        strapMaterial: 'Stainless Steel',
        movementType: 'Quartz',
        caseSize: '43mm',
        waterResistance: '100m',
        stock: 8,
        images: ['/uploads/products/1777584620862-109774287.png'],
        category: catChronograph._id,
        isFeatured: false,
        isBestSeller: true,
        tag: 'popular'
      },
      {
        name: 'Minimalist Black',
        brand: 'Horologe',
        price: 28000,
        oldPrice: null,
        discount: 0,
        shortDescription: 'Ultra-slim dial with clean leather strap.',
        description: 'The Minimalist Black represents simplicity at its finest. With a matte black case and minimalist indices, it is paired with a premium black calfskin leather strap.',
        dialColor: 'Black',
        strapMaterial: 'Leather',
        movementType: 'Quartz',
        caseSize: '38mm',
        waterResistance: '30m',
        stock: 15,
        images: ['/uploads/products/1777585948194-62727772.png'],
        category: catMinimalist._id,
        isFeatured: false,
        isBestSeller: false,
        tag: ''
      },
      {
        name: 'Ocean Master Diver',
        brand: 'Seiko',
        price: 72000,
        oldPrice: 80000,
        discount: 10,
        shortDescription: 'Professional dive watch with 200m water resistance.',
        description: 'Designed for professional divers, the Ocean Master features a unidirectional rotating bezel, luminous hands and hour markers, and a robust automatic movement.',
        dialColor: 'Blue',
        strapMaterial: 'Rubber',
        movementType: 'Automatic',
        caseSize: '44mm',
        waterResistance: '200m',
        stock: 5,
        images: ['/uploads/products/1777588170848-213395623.png'],
        category: catAutomatic._id,
        isFeatured: false,
        isBestSeller: true,
        tag: ''
      },
      {
        name: 'Silver Classic',
        brand: 'Casio',
        price: 15000,
        oldPrice: null,
        discount: 0,
        shortDescription: 'Sleek stainless steel classic design.',
        description: 'An everyday classic watch with a durable mineral crystal dial window, silver-tone stainless steel bracelet, and simple hour indices.',
        dialColor: 'White',
        strapMaterial: 'Stainless Steel',
        movementType: 'Quartz',
        caseSize: '40mm',
        waterResistance: '50m',
        stock: 20,
        images: ['/uploads/products/1777590534890-568451101.png'],
        category: catMinimalist._id,
        isFeatured: false,
        isBestSeller: false,
        tag: ''
      },
      {
        name: 'Nomos Tangente',
        brand: 'Nomos',
        price: 95000,
        oldPrice: 105000,
        discount: 9,
        shortDescription: 'Bauhaus-inspired minimalist masterpiece.',
        description: 'Featuring clean lines and geometric symmetry, the Tangente is Nomos’s iconic timepiece. Powered by a hand-wound caliber with precise watchmaking pedigree.',
        dialColor: 'White',
        strapMaterial: 'Leather',
        movementType: 'Manual Hand-Wind',
        caseSize: '35mm',
        waterResistance: '30m',
        stock: 3,
        images: ['/uploads/products/1777590555640-76236632.png'],
        category: catMinimalist._id,
        isFeatured: false,
        isBestSeller: true,
        tag: ''
      }
    ];

    await Product.insertMany(productsData);
    console.log('Seeded 6 products successfully!');

    mongoose.disconnect();
    console.log('Disconnected.');
  })
  .catch(err => {
    console.error('Seeding failed:', err.message);
  });
