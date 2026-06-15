// Root entry point for Hostinger Node.js deployment.
// This file loads backend environment variables and delegates server execution to backend/server.js.

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env if it exists
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// Run the backend server
require('./backend/server.js');
