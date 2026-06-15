const Category = require('../models/Category');
const Product  = require('../models/Product');

// @desc    Get all categories (with product count)
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).lean();

    // Attach product count to each category
    const counts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { if (c._id) countMap[c._id.toString()] = c.count; });

    const enriched = categories.map(c => ({
      ...c,
      productCount: countMap[c._id.toString()] || 0,
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, slug: customSlug } = req.body;
    const slug = customSlug
      ? customSlug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)+/g, '')
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(400).json({ message: `Category with slug "${slug}" already exists` });
    }

    const category = new Category({ name, slug });
    const created  = await category.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Invalid category data' });
  }
};

// @desc    Update category name / slug
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, slug: customSlug } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name)        category.name = name;
    if (customSlug)  category.slug = customSlug.toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)+/g, '');

    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Update failed' });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await category.deleteOne();
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };

