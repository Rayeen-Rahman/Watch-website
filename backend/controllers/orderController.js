const Order = require('../models/Order');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    // Optional server-side pagination for scalability
    if (req.query.limit || req.query.pageNumber) {
      let limit = parseInt(req.query.limit, 10) || 20;
      let page  = parseInt(req.query.pageNumber, 10) || 1;
      if (limit < 1) limit = 20;
      if (page < 1) page = 1;

      const count = await Order.countDocuments({});
      const orders = await Order.find({})
        .populate('products.product', 'name brand price images')
        .limit(limit)
        .skip(limit * (page - 1))
        .sort({ createdAt: -1 });
      return res.json({ orders, page, pages: Math.ceil(count / limit), total: count });
    }

    const orders = await Order.find({})
      .populate('products.product', 'name brand price images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};


// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private/Admin
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('products.product', 'name price images');
    if (order) {
      // Check if user is admin OR if the order belongs to this user
      if (req.user.role === 'admin' || (order.user && String(order.user) === String(req.user._id))) {
        res.json(order);
      } else {
        res.status(403).json({ message: 'Not authorized to view this order' });
      }
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get user's own orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('products.product', 'name brand price images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Create new order (from customer checkout)
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, products, total } = req.body;

    // EDGE CASE: Ensure checkout wasn't fired with an empty cart
    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'Cannot create order: Cart is empty' });
    }

    // 1. Validate and consolidate items (Bug #7)
    const consolidatedMap = new Map();
    for (const item of products) {
      if (!item.product) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: 'Quantity must be a positive integer' });
      }
      const prodId = String(item.product);
      if (consolidatedMap.has(prodId)) {
        consolidatedMap.set(prodId, consolidatedMap.get(prodId) + qty);
      } else {
        consolidatedMap.set(prodId, qty);
      }
    }
    const consolidatedProducts = Array.from(consolidatedMap.entries()).map(([productId, quantity]) => ({
      product: productId,
      quantity
    }));

    // Decode token if authenticated to link the user (Bug #3 & #4)
    let orderUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        orderUserId = decoded.id;
      } catch (err) {
        // Ignore invalid token
      }
    }

    const crypto = require('crypto');
    const guestTrackingToken = orderUserId ? null : 'tr_' + crypto.randomBytes(16).toString('hex');

    // ── Stock Validation ────────────────────────────────────────────────────
    const Product = require('../models/Product');
    const stockErrors = [];

    for (const item of consolidatedProducts) {
      const prod = await Product.findById(item.product).select('name stock');
      if (!prod) {
        stockErrors.push(`Product not found`);
        continue;
      }
      if (prod.stock < item.quantity) {
        stockErrors.push(
          `"${prod.name}" only has ${prod.stock} unit${prod.stock !== 1 ? 's' : ''} in stock (you ordered ${item.quantity})`
        );
      }
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        message: `Order failed due to stock issues:\n• ${stockErrors.join('\n• ')}`,
      });
    }

    // ── Recalculate total server-side & build snapshot (Bug #6) ──
    const validatedProducts = [];
    let recalculatedTotal = 0;
    for (const item of consolidatedProducts) {
      const prod = await Product.findById(item.product).select('name price stock');
      if (prod) {
        recalculatedTotal += prod.price * item.quantity;
        validatedProducts.push({
          product: prod._id,
          name: prod.name,
          price: prod.price,
          quantity: item.quantity
        });
      } else {
        return res.status(404).json({ message: `Product not found` });
      }
    }

    // Add shipping: free if order >= 2000, else ৳80 inside Dhaka or ৳120 outside
    const isDhaka = (address || '').toLowerCase().includes('dhaka');
    const shipping = recalculatedTotal >= 2000 ? 0 : (isDhaka ? 80 : 120);
    const verifiedTotal = recalculatedTotal + shipping;

    // ── Create Order with verified total ─────────────
    const order = new Order({
      user: orderUserId,
      guestTrackingToken,
      customerName,
      phone,
      address,
      products: validatedProducts, // use safe snapshots (Bug #6)
      total: verifiedTotal
    });
    const createdOrder = await order.save();

    // ── Decrement Stock (atomic — prevents overselling under concurrent load) ──
    const decrementResults = await Promise.all(
      consolidatedProducts.map(item =>
        Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        )
      )
    );

    // If any item failed to decrement, the stock changed between check and update
    const failedItems = decrementResults.filter(r => r === null);
    if (failedItems.length > 0) {
      // Roll back the stock for successfully decremented items (Bug #5)
      await Promise.all(
        consolidatedProducts.map(async (item, idx) => {
          if (decrementResults[idx] !== null) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
          }
        })
      );
      // Roll back the order we just created
      await Order.findByIdAndDelete(createdOrder._id);
      return res.status(400).json({
        message: 'Some items went out of stock while your order was being processed. Please try again.'
      });
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Invalid order data. Ensure all required fields are filled.' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const Product = require('../models/Product');
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const prevStatus = order.status;
    if (prevStatus === status) {
      return res.json(order);
    }

    const terminalStatuses = ['cancelled', 'failed'];
    const wasTerminal = terminalStatuses.includes(prevStatus);
    const isNowTerminal = terminalStatuses.includes(status);

    // Transition from Active -> Terminal: Restore/Release stock (Bug #8)
    if (isNowTerminal && !wasTerminal) {
      if (order.products?.length > 0) {
        await Promise.all(
          order.products.map(item =>
            Product.findByIdAndUpdate(
              item.product,
              { $inc: { stock: item.quantity } },
              { new: true }
            )
          )
        );
      }
    }
    // Transition from Terminal -> Active: Re-reserve stock (Bug #8)
    else if (!isNowTerminal && wasTerminal) {
      if (order.products?.length > 0) {
        // Check stock first
        const stockErrors = [];
        for (const item of order.products) {
          const prod = await Product.findById(item.product).select('name stock');
          if (!prod) {
            stockErrors.push(`Product not found`);
            continue;
          }
          if (prod.stock < item.quantity) {
            stockErrors.push(`"${prod.name}" has only ${prod.stock} unit(s) in stock (needs ${item.quantity})`);
          }
        }
        if (stockErrors.length > 0) {
          return res.status(400).json({
            message: `Cannot restore order: Insufficient stock.\n• ${stockErrors.join('\n• ')}`
          });
        }
        // Atomic decrement
        const decrementResults = await Promise.all(
          order.products.map(item =>
            Product.findOneAndUpdate(
              { _id: item.product, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } },
              { new: true }
            )
          )
        );
        // Compensate if failed
        const failedItems = decrementResults.filter(r => r === null);
        if (failedItems.length > 0) {
          await Promise.all(
            order.products.map(async (item, idx) => {
              if (decrementResults[idx] !== null) {
                await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
              }
            })
          );
          return res.status(400).json({
            message: 'Failed to reserve stock. Some items went out of stock while processing.'
          });
        }
      }
    }

    order.status = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update order status' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  getMyOrders,
  createOrder,
  updateOrderStatus
};
