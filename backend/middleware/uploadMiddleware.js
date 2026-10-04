const multer  = require('multer');
const path    = require('path');
const cloudinary = require('../config/cloudinary');

// ── Native Cloudinary Multer Storage Engine ─────────────────────────────────
// Direct stream upload to Cloudinary v2 avoiding legacy third-party dependencies.
class CloudinaryCustomStorage {
  constructor(options = {}) {
    this.cloudinary = options.cloudinary;
    this.params = options.params || {};
  }

  _handleFile(req, file, cb) {
    const uploadStream = this.cloudinary.uploader.upload_stream(
      this.params,
      (err, result) => {
        if (err) return cb(err);
        cb(null, {
          path: result.secure_url,
          size: result.bytes,
          filename: result.public_id,
        });
      }
    );

    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, cb) {
    if (file && file.filename) {
      this.cloudinary.uploader.destroy(file.filename, { invalidate: true }, cb);
    } else {
      cb(null);
    }
  }
}

// ── Decide storage based on environment ─────────────────────────────────────
// If Cloudinary credentials exist → upload to cloud.
// Otherwise fall back to local disk (keeps local dev working without Cloudinary).

const hasCloudinary =
  (process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME) &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let storage;

if (hasCloudinary) {
  // ── Cloudinary Storage ─────────────────────────────────────────────────────
  storage = new CloudinaryCustomStorage({
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
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per file
    files: 5,                   // Max 5 files per request
    fields: 10,                 // Max 10 non-file fields
    fieldNameSize: 100,         // Max field name length
    fieldSize: 1024 * 1024,     // 1MB max field value
  },
  fileFilter,
});

module.exports = upload;
