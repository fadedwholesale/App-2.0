import express from 'express';

const router = express.Router();

// POST /api/payments/create-payment-intent
router.post('/create-payment-intent', (req, res) => {
  res.json({ message: 'Create payment intent endpoint' });
});

// POST /api/payments/confirm
router.post('/confirm', (req, res) => {
  res.json({ message: 'Confirm payment endpoint' });
});

export default router;
