const Order = require('../models/Order');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
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
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
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

    // ── Stock Validation ────────────────────────────────────────────────────
    const Product = require('../models/Product');
    const stockErrors = [];

    for (const item of products) {
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

    // ── Recalculate total server-side to prevent price tampering ──
    let recalculatedTotal = 0;
    for (const item of products) {
      const prod = await Product.findById(item.product).select('price');
      if (prod) {
        recalculatedTotal += prod.price * item.quantity;
      }
    }

    // Add shipping: free if order >= 2000, else ৳80 inside Dhaka or ৳120 outside
    const isDhaka = (address || '').toLowerCase().includes('dhaka');
    const shipping = recalculatedTotal >= 2000 ? 0 : (isDhaka ? 80 : 120);
    const verifiedTotal = recalculatedTotal + shipping;

    // ── Create Order with verified total ─────────────
    const order = new Order({
      customerName,
      phone,
      address,
      products,
      total: verifiedTotal   // use server-calculated total, not client total
    });
    const createdOrder = await order.save();

    // ── Decrement Stock (atomic — prevents overselling under concurrent load) ──
    const decrementResults = await Promise.all(
      products.map(item =>
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
    order.status = status;
    const updatedOrder = await order.save();

    // ── Restore stock when cancelling or marking as failed ──────────────────
    // Only restore if the order wasn't already in a terminal cancelled/failed state
    // (prevents double-restoring if admin toggles cancelled → cancelled again)
    const terminalStatuses = ['cancelled', 'failed'];
    const wasAlreadyCancelled = terminalStatuses.includes(prevStatus);
    const isNowCancelled = terminalStatuses.includes(status);

    if (isNowCancelled && !wasAlreadyCancelled && order.products?.length > 0) {
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

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update order status' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
};
