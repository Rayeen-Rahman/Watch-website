const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteBulkProducts,
} = require('../controllers/productController');

// Standard routes
router.route('/')
  .get(getProducts)
  .post(createProduct);

// IMPORTANT edge case: Put /bulk-delete BEFORE /:id so it doesn't get captured as an ID parameter
router.post('/bulk-delete', deleteBulkProducts);

// ID-based routes
router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
