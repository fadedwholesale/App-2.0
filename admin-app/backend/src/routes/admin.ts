import express from 'express';

const router = express.Router();

// GET /api/admin/dashboard
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard endpoint' });
});

// GET /api/admin/analytics
router.get('/analytics', (req, res) => {
  res.json({ message: 'Admin analytics endpoint' });
});

export default router;
