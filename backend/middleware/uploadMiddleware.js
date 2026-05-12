const multer  = require('multer');
const path    = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ── Decide storage based on environment ─────────────────────────────────────
// If Cloudinary credentials exist → upload to cloud.
// Otherwise fall back to local disk (keeps local dev working without Cloudinary).

const hasCloudinary =
  process.env.CLOUDINARY_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let storage;

if (hasCloudinary) {
  // ── Cloudinary Storage ─────────────────────────────────────────────────────
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:         'watch-vault/products',   // Cloudinary folder
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
    },
  });
  console.log('📸 Image upload: Cloudinary ☁️');
} else {
  // ── Local Disk Storage Fallback ────────────────────────────────────────────
  const fs = require('fs');
  const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, unique);
    },
  });
  console.log('📸 Image upload: Local disk 🖥️  (set CLOUDINARY_* env vars to use cloud)');
}

// ── File type filter ──────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedExt  = /jpeg|jpg|png|webp/;
  const allowedMime = /image\/(jpeg|jpg|png|webp)/;
  const extOk  = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedMime.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits:     { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
});

module.exports = upload;
