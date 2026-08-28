const Product = require('../models/Product');

// @desc    Get all products (with pagination, filtering)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    let pageSize = parseInt(req.query.limit, 10) || 12;
    let page     = parseInt(req.query.pageNumber, 10) || 1;

    // Validate positive integers and cap limit (Bug #14)
    if (pageSize < 1) pageSize = 12;
    if (pageSize > 100) pageSize = 100;
    if (page < 1) page = 1;

    // ── Build filter ──────────────────────────────────────────────────────────
    const filter = { isActive: true };

    // ?maxStock=5 (Bug #15)
    if (req.query.maxStock) {
      const maxStock = Number(req.query.maxStock);
      if (!isNaN(maxStock)) {
        filter.stock = { $lte: maxStock };
      }
    }

    // ?bestSeller=true
    if (req.query.bestSeller === 'true') filter.isBestSeller = true;

    // ?category=<slug or id> — try slug first via Category lookup
    if (req.query.category) {
      const Category = require('../models/Category');
      const cat = await Category.findOne({ slug: req.query.category });
      filter.category = cat ? cat._id : req.query.category;
    }

    // ?movementType=Automatic
    if (req.query.movementType) filter.movementType = req.query.movementType;

    // ?gender=Men
    if (req.query.gender) filter.gender = req.query.gender;

    // ?maxPrice=50000
    if (req.query.maxPrice) filter.price = { $lte: Number(req.query.maxPrice) };

    // ?search=<term>
    if (req.query.search) {
      // Use index-backed text search (Bug #7)
      const raw = req.query.search.trim().slice(0, 100);
      filter.$text = { $search: raw };
    }

    // ── Sort ─────────────────────────────────────────────────────────────────
    let sortObj = { createdAt: -1 };  // default: newest
    if (req.query.sortBy === 'price') {
      sortObj = { price: req.query.order === 'desc' ? -1 : 1 };
    }

    const count    = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortObj)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get all products for admin (includes inactive, no filter.isActive constraint)
// @route   GET /api/products/admin
// @access  Private/Admin
const getAdminProducts = async (req, res) => {
  try {
    let pageSize = parseInt(req.query.limit, 10) || 12;
    let page     = parseInt(req.query.pageNumber, 10) || 1;

    if (pageSize < 1) pageSize = 12;
    if (pageSize > 100) pageSize = 100;
    if (page < 1) page = 1;

    const filter = {};

    if (req.query.maxStock) {
      const maxStock = Number(req.query.maxStock);
      if (!isNaN(maxStock)) filter.stock = { $lte: maxStock };
    }
    if (req.query.bestSeller === 'true') filter.isBestSeller = true;
    if (req.query.category) {
      const Category = require('../models/Category');
      const cat = await Category.findOne({ slug: req.query.category });
      filter.category = cat ? cat._id : req.query.category;
    }
    if (req.query.movementType) filter.movementType = req.query.movementType;
    if (req.query.gender) filter.gender = req.query.gender;
    if (req.query.maxPrice) filter.price = { $lte: Number(req.query.maxPrice) };

    if (req.query.search) {
      const raw = req.query.search.trim().slice(0, 100);
      filter.$text = { $search: raw };
    }

    let sortObj = { createdAt: -1 };
    if (req.query.sortBy === 'price') {
      sortObj = { price: req.query.order === 'desc' ? -1 : 1 };
    }

    const count    = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortObj)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};


// @desc    Get featured product (for hero section)
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ isFeatured: true, isActive: true })
      .populate('category', 'name slug');
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'No featured product found' });
    }
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
      if (product.isActive) {
        res.json(product);
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
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
    const {
      name, brand, price, oldPrice, discount,
      shortDescription, description, images,
      category, tag, stock,
      dialColor, strapMaterial, movementType, caseSize, waterResistance, gender,
      isBestSeller, isFeatured, isActive,
    } = req.body;

    const product = new Product({
      name, brand, price, oldPrice, discount,
      shortDescription, description,
      images:  images  || [],
      category, tag,
      stock:   stock   ?? 0,
      dialColor, strapMaterial, movementType, caseSize, waterResistance, gender,
      isBestSeller: isBestSeller ?? false,
      isFeatured:   isFeatured   ?? false,
      isActive:     isActive     ?? true,
    });

    const created = await product.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Invalid product data' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const fields = [
      'name', 'brand', 'price', 'oldPrice', 'discount',
      'shortDescription', 'description', 'images',
      'category', 'tag', 'stock',
      'dialColor', 'strapMaterial', 'movementType', 'caseSize', 'waterResistance', 'gender',
      'isBestSeller', 'isFeatured', 'isActive',
    ];

    fields.forEach(f => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Invalid product data' });
  }
};

// @desc    Delete single product (hard delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const Order = require('../models/Order');
      const orderCount = await Order.countDocuments({ 'products.product': product._id });
      if (orderCount > 0) {
        product.isActive = false;
        await product.save();
        res.json({ message: 'Product is linked to historical orders. Deactivated (discontinued) successfully.' });
      } else {
        await product.deleteOne();
        res.json({ message: 'Product removed successfully' });
      }
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Bulk delete products (soft-delete if ordered, otherwise hard-delete)
// @route   POST /api/products/bulk-delete
// @access  Private/Admin
const deleteBulkProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ message: 'No product IDs provided' });
    }

    const Order = require('../models/Order');
    const referencedProducts = await Order.distinct('products.product', { 'products.product': { $in: productIds } });
    const referencedIds = referencedProducts.map(id => String(id));
    
    const toDeleteIds = productIds.filter(id => !referencedIds.includes(String(id)));
    const toDeactivateIds = productIds.filter(id => referencedIds.includes(String(id)));

    if (toDeleteIds.length > 0) {
      await Product.deleteMany({ _id: { $in: toDeleteIds } });
    }
    if (toDeactivateIds.length > 0) {
      await Product.updateMany({ _id: { $in: toDeactivateIds } }, { $set: { isActive: false } });
    }

    if (toDeactivateIds.length > 0) {
      res.json({
        message: `Removed ${toDeleteIds.length} product(s) and deactivated ${toDeactivateIds.length} product(s) referenced in existing orders.`
      });
    } else {
      res.json({ message: 'Bulk products removed successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  getProducts,
  getAdminProducts,
  getFeaturedProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteBulkProducts,
};
