import express from 'express';

const router = express.Router();

// GET /api/notifications
router.get('/', (req, res) => {
  res.json({ message: 'Get notifications endpoint' });
});

// POST /api/notifications/send
router.post('/send', (req, res) => {
  res.json({ message: 'Send notification endpoint' });
});

export default router;
