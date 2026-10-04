// backend/routes/adminRoutes.js
// Powers every data point in DashboardHome.jsx
// All routes are protected by protect + isAdmin middleware

const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const User     = require('../models/User');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Apply auth to every route in this file
router.use(protect, isAdmin);

/* ─────────────────────────────────────────────
   GET /api/admin/dashboard-stats
   Returns all 6 KPI card values in one call
 ───────────────────────────────────────────── */
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Start of current day in Bangladesh (UTC+6)
    const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
    const now = new Date();
    const bdNow = new Date(now.getTime() + BD_OFFSET_MS);
    const todayStart = new Date(Date.UTC(bdNow.getUTCFullYear(), bdNow.getUTCMonth(), bdNow.getUTCDate()) - BD_OFFSET_MS);

    const parsedThreshold = parseInt(req.query.lowStockThreshold, 10);
    const lowStockThreshold = !isNaN(parsedThreshold) && parsedThreshold >= 0 ? parsedThreshold : 5;

    const [
      revenueAgg,
      todayOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      lowStockCount,
    ] = await Promise.all([
      // Sum total of all delivered orders
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      // Count today's orders (any status)
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      // Count all registered users
      User.countDocuments({}),
      // Count active products only
      Product.countDocuments({ isActive: { $ne: false } }),
      // Count orders waiting to be processed
      Order.countDocuments({ status: 'pending' }),
      // Products with stock at or below the threshold (including out of stock)
      Product.countDocuments({
        stock: { $lte: lowStockThreshold },
        isActive: { $ne: false },
      }),
    ]);

    res.json({
      totalRevenue:  revenueAgg[0]?.total  || 0,
      todayOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      lowStockCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────
   GET /api/admin/recent-orders?limit=8
   Returns latest N orders with customer info
 ───────────────────────────────────────────── */
router.get('/recent-orders', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 8, 50));
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────
   GET /api/admin/popular-products?limit=5
   Returns top N products by units sold
 ───────────────────────────────────────────── */
router.get('/popular-products', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 5, 20));

    const products = await Order.aggregate([
      // Filter out orders that are not delivered
      { $match: { status: 'delivered' } },
      // Flatten order items (your schema uses 'products' array)
      { $unwind: '$products' },
      // Group by product and sum quantities
      {
        $group: {
          _id:       '$products.product',
          totalSold: { $sum: '$products.quantity' },
        },
      },
      // Sort by most sold first
      { $sort: { totalSold: -1 } },
      // Join product details
      {
        $lookup: {
          from:         'products',
          localField:   '_id',
          foreignField: '_id',
          as:           'product',
        },
      },
      { $unwind: '$product' },
      { $limit: limit },
      // Project only the fields needed by the frontend
      {
        $project: {
          _id:       '$product._id',
          name:      '$product.name',
          price:     '$product.price',
          image:     { $arrayElemAt: ['$product.images', 0] },
          totalSold: 1,
        },
      },
    ]);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────
   GET /api/admin/revenue-chart?days=7
   Returns daily revenue + order count for chart
   Supports: ?days=7  ?days=14  ?days=30
   Optimized with single aggregation query to prevent N+1 DB lookups
 ───────────────────────────────────────────── */
router.get('/revenue-chart', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
    const BD_OFFSET_MS = 6 * 60 * 60 * 1000;
    const now = new Date();
    const bdNow = new Date(now.getTime() + BD_OFFSET_MS);
    const todayStart = new Date(Date.UTC(bdNow.getUTCFullYear(), bdNow.getUTCMonth(), bdNow.getUTCDate()) - BD_OFFSET_MS);
    const startDate = new Date(todayStart.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const raw = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: '+06:00',
            },
          },
          orders:  { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, '$total', 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0s
    const dataMap = {};
    raw.forEach(r => {
      dataMap[r._id] = r;
    });

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000 + BD_OFFSET_MS);
      const year  = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day   = String(d.getUTCDate()).padStart(2, '0');
      const key   = `${year}-${month}-${day}`;
      const entry = dataMap[key];
      result.push({
        name:    d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }),
        orders:  entry?.orders  || 0,
        revenue: entry?.revenue || 0,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────
   GET /api/admin/featured-product
   Returns current hero-featured product
 ───────────────────────────────────────────── */
router.get('/featured-product', async (req, res) => {
  try {
    const product = await Product.findOne({ isFeatured: true, isActive: true })
      .select('name shortDescription price images _id movementType caseSize');
    res.json(product || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────────
   PUT /api/admin/set-featured/:id
   Atomically swaps the hero featured product
 ───────────────────────────────────────────── */
router.put('/set-featured/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if target product exists first to avoid clearing feature state if ID is invalid (Bug #17)
    const exists = await Product.findById(req.params.id);
    if (!exists) return res.status(404).json({ message: 'Product not found' });
    if (exists.isActive === false) {
      return res.status(400).json({ message: 'Cannot feature an inactive product. Please activate it first.' });
    }

    // Unset all featured products first
    await Product.updateMany({ isFeatured: true }, { $set: { isFeatured: false } });
    
    // Set the chosen product as featured
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isFeatured: true } },
      { new: true, select: 'name shortDescription price images _id movementType caseSize' }
    );
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
