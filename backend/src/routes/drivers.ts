import express from 'express';

const router = express.Router();

// GET /api/drivers/profile
router.get('/profile', (req, res) => {
  res.json({ message: 'Driver profile endpoint' });
});

// PUT /api/drivers/location
router.put('/location', (req, res) => {
  res.json({ message: 'Update driver location endpoint' });
});

export default router;
