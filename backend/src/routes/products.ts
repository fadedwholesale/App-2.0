import express from 'express';

const router = express.Router();

// GET /api/products
router.get('/', (req, res) => {
  res.json({ message: 'Get products endpoint' });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  res.json({ message: 'Get product by ID endpoint' });
});

export default router;
