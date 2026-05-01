// backend/routes/paymentRoutes.js
// NOTE: This endpoint is a secondary COD route.
// The primary checkout flow uses POST /api/orders directly.
// This route is kept for potential future payment integrations.
const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');

// POST /api/payments/cod — place a COD order (authenticated users)
// Uses correct Order schema field names: products, address, total, customerName, phone
router.post('/cod', protect, async (req, res) => {
  try {
    const { customerName, phone, address, products, total } = req.body;

    if (!products?.length)
      return res.status(400).json({ message: 'No items in order' });
    if (!customerName?.trim())
      return res.status(400).json({ message: 'Customer name is required' });
    if (!phone?.trim())
      return res.status(400).json({ message: 'Phone number is required' });
    if (!address?.trim())
      return res.status(400).json({ message: 'Delivery address is required' });

    const order = await Order.create({
      customerName: customerName.trim(),
      phone:        phone.trim(),
      address:      address.trim(),
      products,
      total:        total || 0,
      status:       'pending',
    });

    res.status(201).json({ message: 'Order placed successfully', orderId: order._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
