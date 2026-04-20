const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  oldPrice: {
    type: Number,
    default: null
  },
  discount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  shortDescription: {
    type: String,
    default: ''
  },
  sizes: [{
    type: String
  }],
  images: [{
    type: String // URL endpoints for product images
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: String,
    default: 'WATCH',
    trim: true
  },
  tag: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Product', productSchema);
