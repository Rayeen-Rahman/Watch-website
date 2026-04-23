const Product = require('../models/Product');

// @desc    Get all products (with pagination, filtering)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.limit) || 12;
    const page     = Number(req.query.pageNumber) || 1;

    // ── Build filter ──────────────────────────────────────────────────────────
    const filter = { isActive: true };

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
      const term = req.query.search.trim();
      filter.$or = [
        { name:  { $regex: term, $options: 'i' } },
        { brand: { $regex: term, $options: 'i' } },
      ];
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
      await product.deleteOne();
      res.json({ message: 'Product removed successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Bulk delete products
// @route   POST /api/products/bulk-delete
// @access  Private/Admin
const deleteBulkProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
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
  getFeaturedProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteBulkProducts,
};
