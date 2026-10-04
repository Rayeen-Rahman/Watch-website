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
      .select('-__v -guestTrackingToken')
      .lean();
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUBLIC: order lookup by order ID (full 24-char or 8-char reference) and phone number
// GET /api/orders/lookup-by-phone?orderId=xxx&phone=yyy
router.get('/lookup-by-phone', lookupLimiter, async (req, res) => {
  try {
    const { orderId, phone } = req.query;
    if (!orderId || !orderId.trim() || !phone || !phone.trim()) {
      return res.status(400).json({ message: 'Order ID / Reference and Phone Number are required' });
    }

    const cleanId = orderId.trim().replace(/^#/, '');
    const cleanDigits = phone.trim().replace(/\D/g, '');
    if (!cleanDigits) {
      return res.status(400).json({ message: 'Valid phone number is required' });
    }
    const digitsToMatch = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    const phonePattern = digitsToMatch.split('').join('\\D*');

    let idQuery = null;
    if (mongoose.Types.ObjectId.isValid(cleanId) && cleanId.length === 24) {
      idQuery = { _id: cleanId };
    } else if (/^[a-fA-F0-9]{6,23}$/.test(cleanId)) {
      idQuery = {
        $expr: {
          $regexMatch: {
            input: { $toString: '$_id' },
            regex: cleanId + '$',
            options: 'i'
          }
        }
      };
    } else {
      return res.status(400).json({ message: 'Invalid Order ID or Reference format' });
    }

    const OrderModel = require('../models/Order');
    const order = await OrderModel.findOne({
      ...idQuery,
      phone: { $regex: phonePattern + '$' }
    })
      .populate('products.product', 'name price images')
      .select('-__v -guestTrackingToken')
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
