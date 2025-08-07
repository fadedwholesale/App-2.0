// Simple backend server to eliminate proxy errors
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Simple backend server running',
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints to prevent errors
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Simple API server running',
    timestamp: new Date().toISOString()
  });
});

app.all('/api/*', (req, res) => {
  res.status(503).json({
    error: 'Full backend not available',
    message: 'Start the full backend with: cd backend && npm run dev'
  });
});

app.listen(PORT, () => {
  console.log(`🌿 Simple backend server running on http://localhost:${PORT}`);
  console.log('This eliminates proxy errors. For full functionality, run: cd backend && npm run dev');
});
