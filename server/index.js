require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const screenshotRoutes = require('./routes/screenshot.routes');

// Ensure /public and /tmp exist
const publicDir = path.join(__dirname, 'public');
const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const app = express();

// Parse allowed origins from .env
const allowedOrigins = process.env.URLS
  ? process.env.URLS.split(',').map(url => url.trim())
  : [];

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.headers.origin || 'unknown origin'}`);
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      console.log('CORS: No origin header, allowing request');
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: Allowed origin ${origin}`);
      return callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      return callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.get('/health', (req, res) => res.send('OK'));

app.use(express.json());
app.use('/api', screenshotRoutes);
app.use('/public', express.static(path.join(__dirname, 'public')));

// Global error handler
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${err.message}`);
  console.error(`[${timestamp}] Stack: ${err.stack}`);
  console.error(`[${timestamp}] Request: ${req.method} ${req.url}`);
  console.error(`[${timestamp}] Body:`, req.body);
  console.error(`[${timestamp}] Headers:`, req.headers);
  
  res.status(500).json({ 
    message: 'Internal server error',
    error: err.message,
    timestamp: timestamp
  });
});

// Handle 404s
app.use((req, res) => {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}] 404: ${req.method} ${req.originalUrl} not found`);
  res.status(404).json({ 
    message: 'Route not found', 
    path: req.originalUrl,
    timestamp: timestamp
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}\nAllowed origins: ${allowedOrigins.join(', ')}`);
});

// Process-level error handlers for uncaught exceptions
process.on('uncaughtException', (err) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] UNCAUGHT EXCEPTION - Server will exit!`);
  console.error(`[${timestamp}] Error: ${err.message}`);
  console.error(`[${timestamp}] Stack: ${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] UNHANDLED PROMISE REJECTION at:`, promise);
  console.error(`[${timestamp}] Reason:`, reason);
  // Note: In production, you might want to exit the process here too
});

process.on('SIGTERM', () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] SIGTERM received, shutting down gracefully`);
  process.exit(0);
});

process.on('SIGINT', () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] SIGINT received, shutting down gracefully`);
  process.exit(0);
});
