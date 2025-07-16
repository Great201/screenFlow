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
      console.warn(`CORS: Blocked origin ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.get('/health', (req, res) => res.send('OK'));

app.use(express.json());
app.use('/api', screenshotRoutes);
app.use('/public', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}\nAllowed origins: ${allowedOrigins.join(', ')}`);
});
