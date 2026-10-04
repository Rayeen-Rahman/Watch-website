// backend/middleware/visitorTracker.js
// Lightweight visitor tracking middleware.
//
// Design decisions:
//  • Skips /api/* and /uploads/* (internal/asset requests carry no UX value)
//  • Skips bot-like user-agents (Googlebot, Bingbot, etc.)
//  • Never stores raw IP — hashes it with a daily rotating salt using
//    Node's built-in `crypto` module (no extra dependency needed).
//  • Fire-and-forget DB write — errors are swallowed so they NEVER
//    affect the request/response cycle.
//  • The write is deferred with setImmediate() so it executes AFTER the
//    response is sent, adding zero latency to the visitor.

const crypto   = require('crypto');
const mongoose = require('mongoose');

// ── Bot detection heuristic ────────────────────────────────────────────────
const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|facebookexternalhit|whatsapp|baiduspider|yandex|semrush|ahrefsbot|pingdom|uptimerobot|curl|wget|python-requests|axios|node-fetch|go-http-client/i;

// ── Sniff device type from user-agent string ──────────────────────────────
const getDeviceType = (ua = '') => {
  if (!ua) return 'unknown';
  if (BOT_UA_PATTERN.test(ua)) return 'bot';
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
};

// ── Extract root domain from Referer header (skipping self-referrals) ──────
const getReferrerDomain = (referer = '', host = '') => {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    const domain = url.hostname.replace(/^www\./, '').toLowerCase().slice(0, 200) || null;
    const currentHost = (host || '').split(':')[0].replace(/^www\./, '').toLowerCase();
    if (domain && currentHost && (domain === currentHost || domain.endsWith(`.${currentHost}`))) {
      return null; // internal navigation within the site
    }
    return domain;
  } catch {
    return null;
  }
};

// ── Daily-rotating salt: changes every UTC day without DB lookups ──────────
const getDailySalt = () => {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  return `visit-salt-${today}`;
};

// ── Hash IP + daily salt → deterministic but unrecoverable ────────────────
const hashIp = (ip = '') =>
  crypto
    .createHmac('sha256', getDailySalt())
    .update(ip)
    .digest('hex');

// ── Paths and file extensions we never want to track ────────────────────────
const SKIP_PREFIXES = [
  '/api/',
  '/admin',
  '/assets',
  '/uploads/',
  '/images/',
  '/health',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon',
  '/_',        // vite HMR and internal chunks
];

// Skip static assets (scripts, stylesheets, images, fonts, source maps, data files)
const STATIC_EXT_PATTERN =
  /\.(?:js|mjs|cjs|css|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|otf|map|json|xml|txt|webmanifest)$/i;

const shouldSkip = (path = '') =>
  SKIP_PREFIXES.some(p => path.startsWith(p)) || STATIC_EXT_PATTERN.test(path);

// ── Main middleware ────────────────────────────────────────────────────────
const visitorTracker = (req, res, next) => {
  // Always call next() first — tracking is purely observational
  next();

  // Deferred so the response is already sent before we do DB work
  setImmediate(async () => {
    try {
      // Only track storefront GET page requests
      if (req.method !== 'GET') return;

      // Drop tracking if database connection is not active
      if (mongoose.connection.readyState !== 1) return;

      const rawPath = (req.path || '/').trim().slice(0, 500) || '/';
      // Normalize trailing slash so '/category/all/' and '/category/all' are counted together
      const path = (rawPath.length > 1 && rawPath.endsWith('/')) ? rawPath.slice(0, -1) : rawPath;
      if (shouldSkip(path)) return;

      const ua = req.headers['user-agent'] || '';
      const deviceType = getDeviceType(ua);

      // Skip bots — they inflate numbers without adding business value
      if (deviceType === 'bot') return;

      const rawForwarded = req.headers['x-forwarded-for'];
      const xForwardedFor = Array.isArray(rawForwarded) ? rawForwarded[0] : rawForwarded;

      const ip =
        req.headers['cf-connecting-ip'] ||       // Cloudflare
        xForwardedFor?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        'unknown';

      const ipHash = hashIp(ip);
      const referrerDomain = getReferrerDomain(req.headers['referer'] || req.headers['referrer'], req.headers['host']);
      const country = (req.headers['cf-ipcountry'] || null)?.toString().slice(0, 2).toUpperCase() || null;

      // Lazy-require model to avoid circular-dep issues at module load time
      const VisitorLog = require('../models/VisitorLog');

      await VisitorLog.create({
        ipHash,
        path,
        referrerDomain,
        deviceType,
        country,
      });
    } catch {
      // Swallow all errors — tracking must NEVER break the app
    }
  });
};

module.exports = visitorTracker;
