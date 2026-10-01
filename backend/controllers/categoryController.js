const Category = require('../models/Category');
const Product  = require('../models/Product');

// @desc    Get all categories (with product count)
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).lean();

    if (req.query.withCounts === 'true') {
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

      return res.json(enriched);
    }

    res.json(categories);
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
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    let slug = (customSlug && typeof customSlug === 'string' && customSlug.trim())
      ? customSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/(^-|-$)+/g, '')
      : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/(^-|-$)+/g, '');

    if (!slug) {
      slug = `cat-${Date.now().toString(36)}`;
    }

    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(400).json({ message: `Category with slug "${slug}" already exists` });
    }

    const category = new Category({ name: cleanName, slug });
    const created  = await category.save();
    res.status(201).json(created);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A category with this slug already exists' });
    }
    res.status(400).json({ message: error.message || 'Invalid category data' });
  }
};

// @desc    Update category name / slug
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name, slug: customSlug } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Category name cannot be empty' });
      }
      category.name = name.trim();
    }
    if (customSlug !== undefined) {
      if (typeof customSlug !== 'string' || !customSlug.trim()) {
        return res.status(400).json({ message: 'Category slug cannot be empty' });
      }
      const formattedSlug = customSlug.trim().toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/(^-|-$)+/g, '');
      if (!formattedSlug) {
        return res.status(400).json({ message: 'Category slug must contain valid alphanumeric characters' });
      }
      if (formattedSlug !== category.slug) {
        const slugExists = await Category.findOne({
          slug: formattedSlug,
          _id: { $ne: category._id }
        });
        if (slugExists) {
          return res.status(400).json({ message: `Category with slug "${formattedSlug}" already exists` });
        }
        category.slug = formattedSlug;
      }
    }

    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A category with this slug already exists' });
    }
    res.status(400).json({ message: error.message || 'Update failed' });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Check if any products are associated with this category (Bug #18)
    const Product = require('../models/Product');
    const linkedProduct = await Product.findOne({ category: req.params.id });
    if (linkedProduct) {
      return res.status(400).json({
        message: 'Cannot delete category: There are products still assigned to it.'
      });
    }

    await category.deleteOne();
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };

