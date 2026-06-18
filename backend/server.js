const express    = require('express');
const mongoose   = require('mongoose');
const path       = require('path');
const cors       = require('cors');
const dotenv     = require('dotenv');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const morgan     = require('morgan');
const compression = require('compression');
const dns        = require('dns');

// Load environment variables
dotenv.config();

// Force Google DNS so MongoDB Atlas SRV records resolve correctly
// (some home routers block SRV queries — this bypasses them)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const app = express();

// ── STEP 5: Morgan request logging ───────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── STEP 6: Compression (gzip) ───────────────────────────────────────────────
app.use(compression());

// ── STEP 3: Helmet security headers ──────────────────────────────────────────
// Single helmet() call — avoids duplicate CSP headers that browsers treat as
// the most-restrictive intersection (which was blocking cross-origin images).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'"],
        styleSrc:    ["'self'", "'unsafe-inline'", 'https:'],
        fontSrc:     ["'self'", 'https:', 'data:'],
        imgSrc:      ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        connectSrc:  ["'self'",
                      'https://artifactbd.com',
                      'https://www.artifactbd.com',
                      process.env.FRONTEND_URL || 'http://localhost:5173',
                      'http://localhost:5000',
                      'http://localhost:5173',
                      'ws:', 'wss:'],
        mediaSrc:    ["'self'"],
        objectSrc:   ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
    // CRITICAL: 'same-origin' (helmet default) blocks <img> tags from loading
    // files served by a different origin (port 5000 vs port 5173).
    // 'cross-origin' allows any origin to embed these resources.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

// ── STEP 2: Restricted CORS ───────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://artifactbd.com',
  'https://www.artifactbd.com',
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── STEP 4: Rate limiting ─────────────────────────────────────────────────────
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  })
);
app.use(
  '/api/users/login',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts. Try again in an hour.' },
  })
);
app.use(
  '/api/users/register',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: 'Too many registration attempts. Try again in an hour.' },
  })
);
// B-03 fix: Tight rate limit on order lookup — prevents phone-number enumeration
app.use(
  '/api/orders/lookup',
  rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 10,                     // 10 lookups per IP per window
    message: { message: 'Too many order lookups. Please try again later.' },
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // required for payment callbacks & form POSTs

// Add short-lived cache headers to public GET endpoints to reduce repeat load times
app.use('/api/products', (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  }
  next();
});
app.use('/api/categories', (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
  }
  next();
});

// ── STEP 12: Serve uploaded product images statically ─────────────────────────
// Placed BEFORE the rate limiter (rate limiter is scoped to /api/ only, but
// being explicit keeps intent clear). Extra headers ensure cross-origin
// embedding works in all browsers regardless of Helmet's global CORP setting.
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  },
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1y',
    etag:   true,
  })
);


// ── Database Connection ───────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    // Priority: MONGODB_URI (Atlas/production) → MONGO_URI (local) → hardcoded local
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      'mongodb://127.0.0.1:27017/watch-store';

    const isAtlas = mongoUri.includes('mongodb+srv');
    console.log(`Connecting to ${isAtlas ? 'MongoDB Atlas ☁️' : 'Local MongoDB 🖥️'}...`);

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// ── Route imports ─────────────────────────────────────────────────────────────
const productRoutes  = require('./routes/productRoutes');
const userRoutes     = require('./routes/userRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminRoutes    = require('./routes/adminRoutes');     // Steps 14-16
const paymentRoutes  = require('./routes/paymentRoutes'); // Step 27 — COD
const newsletterRoutes = require('./routes/newsletterRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// ── STEP 7: Health check endpoint ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status:    'ok',
    uptime:    process.uptime(),
    dbState:   mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Root route — only in development (production serves the React SPA from /)
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.json({ message: 'Watch Store API is running...' });
  });
}

// API Routes
app.use('/api/products',   productRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin',      adminRoutes);    // Steps 14-16: dashboard stats/orders/charts
app.use('/api/payments',   paymentRoutes); // Step 27: COD payment route
app.use('/api/newsletter', newsletterRoutes);


// ── STEP 9: Serve React SPA build in production ──────────────────────────────
// MUST be registered BEFORE the error handlers so that:
//   - Static assets (JS/CSS/images) are served from frontend/dist
//   - All non-API routes fall back to index.html (SPA client-side routing)
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../frontend/dist');

  // ── Hashed assets: cache forever (filename changes on every build) ──────
  app.use(
    '/assets',
    express.static(path.join(frontendBuildPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
      etag: false,
    })
  );

  // ── index.html: NEVER cache — always fetch fresh so new bundles load ────
  // All other static files (favicon, robots.txt etc): short revalidation
  app.use(
    express.static(frontendBuildPath, {
      maxAge: 0,
      etag: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    })
  );

  // SPA fallback — send index.html for all non-API GET requests
  app.get('*any', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  console.log(`Serving React build from: ${frontendBuildPath}`);
}

// Error Handling Middlewares (must be LAST — below routes AND static serving)
app.use(notFound);
app.use(errorHandler);

// ── STEP 8: Start server + graceful SIGTERM shutdown ─────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();   // wait for DB before accepting requests
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log('Backend successfully started after MongoDB connection!');
  });

  // Graceful shutdown — handles Docker stop, PM2 restart, deployment restarts
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed. Process exiting.');
        process.exit(0);
      });
    });
  });
};

startServer();
