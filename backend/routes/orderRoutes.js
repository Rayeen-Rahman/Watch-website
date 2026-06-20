const express = require('express');
const router = express.Router();
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
  createOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// PUBLIC: phone-based order lookup for guest order tracking
// GET /api/orders/lookup?phone=+8801700000000
router.get('/lookup', lookupLimiter, async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    const OrderModel = require('../models/Order');
    const orders = await OrderModel.find({ phone: phone.trim() })
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all orders (admin only) — POST create order (public for customer checkout)
router.route('/')
  .get(protect, isAdmin, getOrders)
  .post(createOrder);

// Detail view — requires auth token
router.route('/:id')
  .get(protect, getOrderById);

// Update status — admin only
router.route('/:id/status')
  .put(protect, isAdmin, updateOrderStatus);

module.exports = router;
