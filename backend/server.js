const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
// Body parser allows us to access req.body
app.use(express.json());

// Database Connection
const connectDB = async () => {
  try {
    // If process.env.MONGO_URI is missing, fallback to local URL for safety
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/watch-store';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

connectDB();

// Route imports
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Basic API route to verify server is running
app.get('/', (req, res) => {
  res.json({ message: 'Watch Store API is running...' });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);

// Error Handling Middlewares (Must be below routes)
app.use(notFound);
app.use(errorHandler);

// Port and Server execution
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log('Backend successfully auto-restarted to load local database credentials!');
});
