const Product = require('../models/Product');

// @desc    Get all products (with pagination)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const pageSize = 12; // Adjusted for 4-column grid (3 rows)
    const page = Number(req.query.pageNumber) || 1;

    const count = await Product.countDocuments({});
    const products = await Product.find({})
      .populate('category', 'name slug')
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, price, oldPrice, discount, description, images, category, brand, tag } = req.body;

    const product = new Product({
      name,
      price,
      oldPrice,
      discount,
      description,
      images,
      category,
      brand,
      tag,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Invalid product data' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, price, oldPrice, discount, description, images, category, brand, tag } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.oldPrice = oldPrice !== undefined ? oldPrice : product.oldPrice;
      product.discount = discount !== undefined ? discount : product.discount;
      product.description = description || product.description;
      product.images = images || product.images;
      product.category = category || product.category;
      product.brand = brand || product.brand;
      product.tag = tag !== undefined ? tag : product.tag;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message || 'Invalid product data' });
  }
};

// @desc    Delete single product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Delete bulk products
// @route   POST /api/products/bulk-delete
// @access  Private/Admin
const deleteBulkProducts = async (req, res) => {
  try {
    const { productIds } = req.body; // Expect an array of MongoDB IDs

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ message: 'No product IDs provided' });
    }

    await Product.deleteMany({ _id: { $in: productIds } });
    res.json({ message: 'Bulk products removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteBulkProducts,
};
