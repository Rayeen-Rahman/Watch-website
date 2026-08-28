const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// Allow only 5 lookup attempts per IP per 15 minutes
const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many lookup attempts. Please wait 15 minutes.' }
});

const {
  getOrders,
  getOrderById,
  getMyOrders,
  createOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// GET /api/orders/lookup-by-phone?phone=X&orderId=Y
router.get('/lookup-by-phone', lookupLimiter, async (req, res) => {
  try {
    const { phone, orderId } = req.query;
    if (!phone || !phone.trim() || !orderId || !orderId.trim()) {
      return res.status(400).json({ message: 'Phone number and Order ID are required' });
    }
    const cleanOrderId = orderId.trim();
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      return res.status(400).json({ message: 'Invalid Order ID format' });
    }

    const OrderModel = require('../models/Order');
    const order = await OrderModel.findOne({
      _id: cleanOrderId,
      phone: phone.trim()
    })
      .populate('products.product', 'name price images')
      .select('-__v')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found with those details' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: token-based order lookup for secure guest order tracking (non-enumerable)
// GET /api/orders/lookup?token=tr_xxxx
router.get('/lookup', lookupLimiter, async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || !token.trim()) {
      return res.status(400).json({ message: 'Tracking token is required' });
    }
    
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const OrderModel = require('../models/Order');
    const order = await OrderModel.findOne({ guestTrackingToken: hashedToken })
      .populate('products.product', 'name price images')
      .select('-__v')
      .lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: order lookup by order ID and phone number for guests (secure alternative)
// GET /api/orders/lookup-by-phone?orderId=xxx&phone=yyy
router.get('/lookup-by-phone', lookupLimiter, async (req, res) => {
  try {
    const { orderId, phone } = req.query;
    if (!orderId || !orderId.trim() || !phone || !phone.trim()) {
      return res.status(400).json({ message: 'Order ID and Phone Number are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId.trim())) {
      return res.status(400).json({ message: 'Invalid Order ID format' });
    }

    const OrderModel = require('../models/Order');
    const order = await OrderModel.findOne({
      _id: orderId.trim(),
      phone: phone.trim()
    })
      .populate('products.product', 'name price images')
      .select('-__v')
      .lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found with those details' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all orders (admin only) — POST create order (public for customer checkout)
router.route('/')
  .get(protect, isAdmin, getOrders)
  .post(createOrder);

// GET logged-in user's orders
router.route('/myorders')
  .get(protect, getMyOrders);

// Detail view — requires auth token
router.route('/:id')
  .get(protect, getOrderById);

// Update status — admin only
router.route('/:id/status')
  .put(protect, isAdmin, updateOrderStatus);

module.exports = router;
