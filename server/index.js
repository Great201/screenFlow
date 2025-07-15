require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const screenshotRoutes = require('./routes/screenshot.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', screenshotRoutes);
app.use('/public', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
