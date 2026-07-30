const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true,    // B-06 fix: store name at purchase time
    default: 'Watch',
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity can not be less than 1.']
  },
  price: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  guestTrackingToken: {
    type: String,
    default: null
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  products: [orderItemSchema],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'],
    default: 'pending'
  }
}, { 
  timestamps: true 
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ phone: 1 });
orderSchema.index({ guestTrackingToken: 1 });

module.exports = mongoose.model('Order', orderSchema);
