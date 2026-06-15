// backend/routes/paymentRoutes.js
// NOTE: This endpoint is a secondary COD route.
// The primary checkout flow uses POST /api/orders directly.
// This route is kept for potential future payment integrations.
const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');

// DEPRECATED — this route has no stock validation.
// All checkout flows should use POST /api/orders instead.
// Disabled to prevent accidental bypass of stock checks.
router.post('/cod', (req, res) => {
  res.status(410).json({
    message: 'This endpoint is deprecated. Please use POST /api/orders for checkout.',
  });
});

module.exports = router;
