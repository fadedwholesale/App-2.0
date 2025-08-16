import express from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

const router = express.Router();

// Get driver profile
router.get('/profile', async (req, res): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!driver) {
      return res.status(404).json({
        error: 'Driver profile not found'
      });
    }

    res.json({ driver });
  } catch (error) {
    logger.error('Get driver profile error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
