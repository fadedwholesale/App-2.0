import express from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

const router = express.Router();

// Process payment
router.post('/process', async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    // For now, simulate payment processing
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'COMPLETED' }
    });

    res.json({
      message: 'Payment processed successfully',
      order
    });
  } catch (error) {
    logger.error('Process payment error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
