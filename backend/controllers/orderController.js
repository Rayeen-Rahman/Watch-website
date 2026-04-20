const Order = require('../models/Order');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    // Populate the product details so the frontend dashboard can display names instead of just IDs
    const orders = await Order.find({}).populate('products.product', 'name price');
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

    const order = new Order({
      customerName,
      phone,
      address,
      products,
      total
    });

    const createdOrder = await order.save();
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
    
    // EDGE CASE: Validate status strictly against schema ENUM to prevent fatal Mongoose validation crash
    const validStatuses = ['pending', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
       return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
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
