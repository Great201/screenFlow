require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const screenshotRoutes = require('./routes/screenshot.routes');

const app = express();

// Parse allowed origins from .env
const allowedOrigins = process.env.URLS
  ? process.env.URLS.split(',').map(url => url.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());
app.use('/api', screenshotRoutes);
app.use('/public', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}\nAllowed origins: ${allowedOrigins.join(', ')}`);
});
