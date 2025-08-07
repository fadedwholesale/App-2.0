import express from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json({ products });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
