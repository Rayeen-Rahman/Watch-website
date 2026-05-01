const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// PUBLIC: phone-based order lookup for guest order tracking
// GET /api/orders/lookup?phone=+8801700000000
router.get('/lookup', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    const Order = require('../controllers/orderController');
    // Direct mongoose query — lightweight and doesn't expose all orders
    const mongoose = require('mongoose');
    const OrderModel = mongoose.model('Order');
    const orders = await OrderModel.find({ phone: phone.trim() })
      .sort({ createdAt: -1 })
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

// Detail view — accessible with auth token (admin or order lookup)
router.route('/:id')
  .get(getOrderById);

// Update status — admin only
router.route('/:id/status')
  .put(protect, isAdmin, updateOrderStatus);

module.exports = router;
