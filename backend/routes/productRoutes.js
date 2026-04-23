const express = require('express');
const router  = express.Router();
const path    = require('path');
const { body, validationResult } = require('express-validator');

const {
  getProducts,
  getFeaturedProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteBulkProducts,
} = require('../controllers/productController');

const upload = require('../middleware/uploadMiddleware');

// ── Step 12: Image upload route ──────────────────────────────────────────────
// POST /api/products/upload-image
router.post('/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Return the relative URL — served statically by server.js
  const imageUrl = `/uploads/products/${req.file.filename}`;
  res.json({ imageUrl });
});

// ── Step 10: /featured before /:id ──────────────────────────────────────────
// GET /api/products/featured
router.get('/featured', getFeaturedProduct);

// ── Bulk delete before /:id ──────────────────────────────────────────────────
// POST /api/products/bulk-delete
router.post('/bulk-delete', deleteBulkProducts);

// ── Standard routes ──────────────────────────────────────────────────────────
// GET  /api/products  (supports ?bestSeller=true, ?category=, ?search=, ?limit=, ?pageNumber=)
// POST /api/products  (with express-validator — C-5)
const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or more'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];

router.route('/')
  .get(getProducts)
  .post(validateProduct, createProduct);

// ── ID-based routes ──────────────────────────────────────────────────────────
router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
