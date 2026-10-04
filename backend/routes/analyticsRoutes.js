// backend/routes/analyticsRoutes.js
// Admin-only analytics API.  All routes are protected by protect + isAdmin.
//
// Endpoints:
//   GET /api/analytics/overview          – headline KPIs (visits, uniques, pages/visit)
//   GET /api/analytics/traffic?days=7    – daily page views + unique visitors over time
//   GET /api/analytics/top-pages?limit=10– most visited paths
//   GET /api/analytics/devices           – device-type breakdown
//   GET /api/analytics/countries?limit=10– top countries (when CF headers present)
//   DELETE /api/analytics/clear          – wipe all logs (admin only, requires confirmation)

const express    = require('express');
const router     = express.Router();
const VisitorLog = require('../models/VisitorLog');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All routes require admin auth
router.use(protect, isAdmin);

// ── Helpers ───────────────────────────────────────────────────────────────
const BD_OFFSET_MS = 6 * 60 * 60 * 1000; // UTC+6

const getStartDate = (days) => {
  const now    = new Date();
  const bdNow  = new Date(now.getTime() + BD_OFFSET_MS);
  const today  = new Date(
    Date.UTC(bdNow.getUTCFullYear(), bdNow.getUTCMonth(), bdNow.getUTCDate()) - BD_OFFSET_MS
  );
  return new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
};

const clampDays = (val, defaultVal = 7, max = 90) => {
  const n = parseInt(val, 10);
  return (!isNaN(n) && n >= 1) ? Math.min(n, max) : defaultVal;
};

const clampLimit = (val, defaultVal = 10, max = 50) => {
  const n = parseInt(val, 10);
  return (!isNaN(n) && n >= 1) ? Math.min(n, max) : defaultVal;
};

/* ───────────────────────────────────────────────────────────────────────────
   GET /api/analytics/overview
   Returns headline numbers for the analytics dashboard header cards.
 ─────────────────────────────────────────────────────────────────────────── */
router.get('/overview', async (req, res) => {
  try {
    const days      = clampDays(req.query.days, 30);
    const startDate = getStartDate(days);
    const prevStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    const [current, previous] = await Promise.all([
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id:          null,
            pageViews:    { $sum: 1 },
            uniqueIps:    { $addToSet: '$ipHash' },
            countries:    { $addToSet: '$country' },
          },
        },
        {
          $project: {
            pageViews:    1,
            uniqueVisits: { $size: '$uniqueIps' },
            totalCountries: {
              $size: {
                $filter: {
                  input: '$countries',
                  as: 'c',
                  cond: { $and: [{ $ne: ['$$c', null] }, { $ne: ['$$c', ''] }] },
                },
              },
            },
          },
        },
      ]),
      VisitorLog.aggregate([
        { $match: { createdAt: { $gte: prevStart, $lt: startDate } } },
        {
          $group: {
            _id:       null,
            pageViews: { $sum: 1 },
            uniqueIps: { $addToSet: '$ipHash' },
          },
        },
        {
          $project: {
            pageViews:    1,
            uniqueVisits: { $size: '$uniqueIps' },
          },
        },
      ]),
    ]);

    const cur  = current[0]  || { pageViews: 0, uniqueVisits: 0, totalCountries: 0 };
    const prev = previous[0] || { pageViews: 0, uniqueVisits: 0 };

    const pctChange = (cur, prev) => {
      if (prev === 0 || prev === null || prev === undefined) return null;
      return Math.round(((cur - prev) / prev) * 100);
    };

    const avgPagesPerVisit =
      cur.uniqueVisits > 0
        ? +(cur.pageViews / cur.uniqueVisits).toFixed(2)
        : 0;

    res.json({
      days,
      pageViews:          cur.pageViews,
      uniqueVisits:       cur.uniqueVisits,
      totalCountries:     cur.totalCountries || 0,
      avgPagesPerVisit,
      pageViewsChange:    pctChange(cur.pageViews,    prev.pageViews),
      uniqueVisitsChange: pctChange(cur.uniqueVisits, prev.uniqueVisits),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ───────────────────────────────────────────────────────────────────────────
   GET /api/analytics/traffic?days=7
   Returns daily page views + unique visitors for the trend chart.
 ─────────────────────────────────────────────────────────────────────────── */
router.get('/traffic', async (req, res) => {
  try {
    const days      = clampDays(req.query.days, 7);
    const startDate = getStartDate(days);

    const raw = await VisitorLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format:   '%Y-%m-%d',
              date:     '$createdAt',
              timezone: '+06:00',
            },
          },
          pageViews: { $sum: 1 },
          uniqueIps: { $addToSet: '$ipHash' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date:         '$_id',
          pageViews:    1,
          uniqueVisits: { $size: '$uniqueIps' },
        },
      },
    ]);

    // Build a map for O(1) lookup
    const dataMap = {};
    raw.forEach(r => { dataMap[r.date] = r; });

    // Fill gaps with zeroes so charts render correctly
    const result = [];
    const now    = new Date();
    const bdNow  = new Date(now.getTime() + BD_OFFSET_MS);
    const todayStart = new Date(
      Date.UTC(bdNow.getUTCFullYear(), bdNow.getUTCMonth(), bdNow.getUTCDate()) - BD_OFFSET_MS
    );

    for (let i = days - 1; i >= 0; i--) {
      const d     = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000 + BD_OFFSET_MS);
      const key   = d.toISOString().slice(0, 10);
      const entry = dataMap[key] || {};
      result.push({
        name:         d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }),
        date:         key,
        pageViews:    entry.pageViews    || 0,
        uniqueVisits: entry.uniqueVisits || 0,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ───────────────────────────────────────────────────────────────────────────
   GET /api/analytics/top-pages?limit=10&days=30
   Returns most visited page paths.
 ─────────────────────────────────────────────────────────────────────────── */
router.get('/top-pages', async (req, res) => {
  try {
    const days      = clampDays(req.query.days, 30);
    const limit     = clampLimit(req.query.limit, 10, 50);
    const startDate = getStartDate(days);

    const pages = await VisitorLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id:       '$path',
          views:     { $sum: 1 },
          uniques:   { $addToSet: '$ipHash' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: limit },
      {
        $project: {
          path:    '$_id',
          views:   1,
          uniques: { $size: '$uniques' },
          _id:     0,
        },
      },
    ]);

    res.json(pages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ───────────────────────────────────────────────────────────────────────────
   GET /api/analytics/devices?days=30
   Returns page view breakdown by device type.
 ─────────────────────────────────────────────────────────────────────────── */
router.get('/devices', async (req, res) => {
  try {
    const days      = clampDays(req.query.days, 30);
    const startDate = getStartDate(days);

    const raw = await VisitorLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id:   '$deviceType',
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
    ]);

    const total = raw.reduce((s, r) => s + r.views, 0);
    const result = raw.map(r => ({
      name:    r._id,
      views:   r.views,
      percent: total > 0 ? Math.round((r.views / total) * 100) : 0,
    }));

    res.json({ total, breakdown: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ───────────────────────────────────────────────────────────────────────────
   GET /api/analytics/countries?limit=10&days=30
   Returns top visitor countries (requires Cloudflare CF-IPCountry header).
 ─────────────────────────────────────────────────────────────────────────── */
router.get('/countries', async (req, res) => {
  try {
    const days      = clampDays(req.query.days, 30);
    const limit     = clampLimit(req.query.limit, 10, 50);
    const startDate = getStartDate(days);

    const countries = await VisitorLog.aggregate([
      { $match: { createdAt: { $gte: startDate }, country: { $ne: null } } },
      {
        $group: {
          _id:   '$country',
          views: { $sum: 1 },
        },
      },
      { $sort: { views: -1 } },
      { $limit: limit },
      {
        $project: {
          country: '$_id',
          views:   1,
          _id:     0,
        },
      },
    ]);

    res.json(countries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ───────────────────────────────────────────────────────────────────────────
   DELETE /api/analytics/clear
   Deletes all visitor logs. Requires { confirm: true } in request body.
 ─────────────────────────────────────────────────────────────────────────── */
router.delete('/clear', async (req, res) => {
  try {
    if (req.body?.confirm !== true) {
      return res.status(400).json({ message: 'Send { confirm: true } to clear analytics data.' });
    }
    const result = await VisitorLog.deleteMany({});
    res.json({ message: `Cleared ${result.deletedCount} visitor log entries.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
