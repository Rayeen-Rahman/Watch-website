const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // ── Core Fields ─────────────────────────────────────────────────────────────
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    default: 'WATCH',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  oldPrice: {
    type: Number,
    default: null,
  },
  discount: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  shortDescription: {
    type: String,
    default: '',
  },
  images: [{ type: String }],     // Array of image URLs / upload paths
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  tag: {
    type: String,
    default: '',
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },

  // ── Watch-Specific Fields ────────────────────────────────────────────────────
  dialColor:       { type: String, default: '' },   // e.g. Black, White, Blue, Silver
  strapMaterial:   { type: String, default: '' },   // e.g. Leather, Stainless Steel, Rubber, NATO
  movementType:    { type: String, default: '' },   // e.g. Quartz, Automatic, Solar, Kinetic
  caseSize:        { type: String, default: '' },   // e.g. 40mm, 42mm, 44mm
  waterResistance: { type: String, default: '' },   // e.g. 30m, 100m, 200m, 5 ATM
  gender: {
    type: String,
    enum: ['Men', 'Women', 'Unisex', ''],
    default: '',
  },

  // ── Status Flags ─────────────────────────────────────────────────────────────
  isBestSeller: { type: Boolean, default: false },  // Shown in Best Sellers section
  isFeatured:   { type: Boolean, default: false },  // Shown in Hero section spotlight
  isActive:     { type: Boolean, default: true  },  // Soft delete — false = hidden from store

}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
