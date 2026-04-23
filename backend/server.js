const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const morgan     = require('morgan');        // Step 5 — request logging
const compression = require('compression'); // Step 6 — gzip compression

// Load environment variables
dotenv.config();

const app = express();

// ── STEP 5: Morgan request logging ───────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── STEP 6: Compression (gzip) ───────────────────────────────────────────────
app.use(compression());

// ── STEP 3: Helmet security headers ──────────────────────────────────────────
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
    },
  })
);

// ── STEP 2: Restricted CORS ───────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
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

// Body parser
app.use(express.json());

// ── STEP 12: Serve uploaded product images statically ─────────────────────────
app.use('/uploads', express.static('uploads'));


// ── Database Connection ───────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/watch-store';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// ── Route imports ─────────────────────────────────────────────────────────────
const productRoutes  = require('./routes/productRoutes');
const userRoutes     = require('./routes/userRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminRoutes    = require('./routes/adminRoutes');   // Steps 14-16
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

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Watch Store API is running...' });
});

// API Routes
app.use('/api/products',   productRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin',      adminRoutes);    // Steps 14-16: dashboard stats/orders/charts


// Error Handling Middlewares (must be below routes)
app.use(notFound);
app.use(errorHandler);

// ── STEP 8: Start server + graceful SIGTERM shutdown ─────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log('Backend successfully auto-restarted to load local database credentials!');
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
