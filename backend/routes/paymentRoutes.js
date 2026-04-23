// backend/routes/paymentRoutes.js — Cash on Delivery (Step 27)
const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');

// POST /api/payments/cod — place a COD order
router.post('/cod', protect, async (req, res) => {
  try {
    const { orderItems, shippingAddress, totalPrice } = req.body;

    if (!orderItems?.length)
      return res.status(400).json({ message: 'No items in order' });
    if (!shippingAddress?.street || !shippingAddress?.city)
      return res.status(400).json({ message: 'Shipping address (street + city) is required' });

    const order = await Order.create({
      user:            req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod:   'COD',
      totalPrice,
      status:          'pending',
      isPaid:          false,
    });

    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
