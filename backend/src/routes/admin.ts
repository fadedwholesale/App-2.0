import express from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

const router = express.Router();

// Get admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      activeDrivers,
      totalRevenue
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.driver.count({ where: { isOnline: true } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'DELIVERED' }
      })
    ]);

    res.json({
      stats: {
        totalOrders,
        pendingOrders,
        activeDrivers,
        totalRevenue: totalRevenue._sum.total || 0
      }
    });
  } catch (error) {
    logger.error('Get admin dashboard error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
