// backend/models/VisitorLog.js
// Stores anonymised visitor traffic records for admin analytics.
// Personal data policy: IP is stored as a salted hash — never raw — to
// preserve privacy while still allowing unique-visitor counting.

const mongoose = require('mongoose');

const visitorLogSchema = new mongoose.Schema(
  {
    // SHA-256 hash of (IP + daily salt) — allows unique-visitor dedup
    // without storing the raw IP address.
    ipHash: { type: String, required: true },

    // Normalised pathname only — no query string, no PII
    path: { type: String, required: true, maxlength: 500 },

    // Optional referrer domain (e.g. "google.com") — no full URL stored
    referrerDomain: { type: String, default: null, maxlength: 200 },

    // User-agent device type sniffed at middleware level
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'bot', 'unknown'],
      default: 'unknown',
    },

    // Country code from CF-IPCountry header (Cloudflare) when available
    country: { type: String, default: null, maxlength: 2 },
  },
  {
    // createdAt is used as the primary time dimension for all analytics
    timestamps: { createdAt: true, updatedAt: false },

    // Capped collection: keep the last ~500k docs (≈ 200 MB)
    // to prevent unbounded growth. Comment out if you prefer TTL instead.
    // capped: { size: 200 * 1024 * 1024, max: 500_000 },
  }
);

// ── Indexes for query performance and data lifecycle ────────────────────────
// TTL: auto-delete records older than 90 days AND serves all { createdAt: { $gte: ... } } range filters
visitorLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
// Path popularity queries over time
visitorLogSchema.index({ path: 1, createdAt: -1 });
// Unique-visitor deduplication queries over time
visitorLogSchema.index({ ipHash: 1, createdAt: -1 });

module.exports = mongoose.model('VisitorLog', visitorLogSchema);
