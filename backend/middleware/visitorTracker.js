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

const crypto = require('crypto');

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

// ── Extract root domain from Referer header ────────────────────────────────
const getReferrerDomain = (referer = '') => {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return url.hostname.replace(/^www\./, '').slice(0, 200) || null;
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

// ── Paths we never want to track ──────────────────────────────────────────
const SKIP_PREFIXES = [
  '/api/',
  '/uploads/',
  '/health',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon',
  '/_',        // vite HMR and internal chunks
];

const shouldSkip = (path = '') =>
  SKIP_PREFIXES.some(p => path.startsWith(p));

// ── Main middleware ────────────────────────────────────────────────────────
const visitorTracker = (req, res, next) => {
  // Always call next() first — tracking is purely observational
  next();

  // Deferred so the response is already sent before we do DB work
  setImmediate(async () => {
    try {
      const path = (req.path || '/').slice(0, 500);

      // Skip non-HTML resource requests
      if (shouldSkip(path)) return;
      if (req.method !== 'GET') return;

      const ua = req.headers['user-agent'] || '';
      const deviceType = getDeviceType(ua);

      // Skip bots — they inflate numbers without adding business value
      if (deviceType === 'bot') return;

      const ip =
        req.headers['cf-connecting-ip'] ||       // Cloudflare
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        'unknown';

      const ipHash = hashIp(ip);
      const referrerDomain = getReferrerDomain(req.headers['referer'] || req.headers['referrer']);
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
