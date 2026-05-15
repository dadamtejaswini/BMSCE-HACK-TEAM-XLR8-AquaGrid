require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wards', require('./routes/wards'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/queries', require('./routes/queries'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/risk', require('./routes/risk'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AquaGrid API', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AquaGrid API running on port ${PORT}`);
});
