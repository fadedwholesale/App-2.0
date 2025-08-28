import express from 'express';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

// PUT /api/users/profile
router.put('/profile', (req, res) => {
  res.json({ message: 'Update user profile endpoint' });
});

export default router;
