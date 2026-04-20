const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
} = require('../controllers/orderController');

// Standard listing and creation
router.route('/')
  .get(getOrders)
  .post(createOrder);

// Detail view
router.route('/:id')
  .get(getOrderById);

// Update status specifically
router.route('/:id/status')
  .put(updateOrderStatus);

module.exports = router;
