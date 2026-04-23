const express = require('express');
const router  = express.Router();

const Order   = require('../models/Order');
const Product = require('../models/Product');
const User    = require('../models/User');

// ── STEP 14: Dashboard KPI Stats ─────────────────────────────────────────────
// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      revenueResult,
      todayOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      lowStock,
    ] = await Promise.all([
      // Total revenue from delivered orders
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Orders placed today
      Order.countDocuments({ createdAt: { $gte: today } }),
      // All users
      User.countDocuments({}),
      // Active products only
      Product.countDocuments({ isActive: true }),
      // Pending orders needing attention
      Order.countDocuments({ status: 'pending' }),
      // Low stock items (≤ 5 units)
      Product.countDocuments({ stock: { $lte: 5 }, isActive: true }),
    ]);

    res.json({
      totalRevenue:  revenueResult[0]?.total || 0,
      todayOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      lowStockCount: lowStock,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── STEP 15: Recent Orders ────────────────────────────────────────────────────
// GET /api/admin/recent-orders?limit=8
router.get('/recent-orders', async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit) || 8;
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── STEP 16a: Popular Products (by units sold) ───────────────────────────────
// GET /api/admin/popular-products?limit=5
router.get('/popular-products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const popular = await Order.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id:       '$products.product',
          totalSold: { $sum: '$products.quantity' },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from:         'products',
          localField:   '_id',
          foreignField: '_id',
          as:           'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          name:      '$product.name',
          brand:     '$product.brand',
          price:     '$product.price',
          image:     { $arrayElemAt: ['$product.images', 0] },
          totalSold: 1,
        },
      },
    ]);

    res.json(popular);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── STEP 16b: Revenue Chart (last N days) ────────────────────────────────────
// GET /api/admin/revenue-chart?days=7
router.get('/revenue-chart', async (req, res) => {
  try {
    const days   = parseInt(req.query.days) || 7;
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setDate(end.getDate() - i);
      end.setHours(23, 59, 59, 999);

      const [orderCount, revenueResult] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Order.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
              status:    'delivered',
            },
          },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);

      result.push({
        name:    start.toLocaleDateString('en-BD', { weekday: 'short' }),
        orders:  orderCount,
        revenue: revenueResult[0]?.total || 0,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
