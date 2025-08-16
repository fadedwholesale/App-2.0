import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { auth } from '../../middleware/auth';
import { sendSMS } from '../../services/sms';
import { sendPushNotification } from '../../services/notifications';

const router = express.Router();

// Middleware to ensure admin access
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }
  next();
};

// Get all users with filtering and pagination
router.get('/customers', [
  auth,
  requireAdmin,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('role').optional().isIn(['CUSTOMER', 'DRIVER', 'ADMIN']),
  query('isVerified').optional().isBoolean(),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const isVerified = req.query.isVerified ? req.query.isVerified === 'true' : undefined;
    const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          loyaltyPoints: true,
          createdAt: true,
          updatedAt: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Calculate user statistics
    const userStats = users.map(user => ({
      ...user,
      totalOrders: user.orders.length,
      totalSpent: user.orders.reduce((sum, order) => sum + order.total, 0),
      lastOrder: user.orders[0]?.createdAt || null
    }));

    res.json({
      users: userStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

    logger.info(`Admin ${req.user.email} accessed customer list`);

  } catch (error) {
    logger.error('Get customers error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get all drivers with detailed information
router.get('/drivers', [
  auth,
  requireAdmin,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('isOnline').optional().isBoolean(),
  query('isVerified').optional().isBoolean(),
  query('documentsStatus').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const isOnline = req.query.isOnline ? req.query.isOnline === 'true' : undefined;
    const isVerified = req.query.isVerified ? req.query.isVerified === 'true' : undefined;
    const documentsStatus = req.query.documentsStatus as string;

    // Build where clause for drivers
    const driverWhere: any = {};
    const userWhere: any = { role: 'DRIVER' };

    if (isOnline !== undefined) {
      driverWhere.isOnline = isOnline;
    }

    if (isVerified !== undefined) {
      driverWhere.isVerified = isVerified;
    }

    if (documentsStatus) {
      driverWhere.documentsStatus = documentsStatus;
    }

    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get drivers with user information
    const [drivers, totalCount] = await Promise.all([
      prisma.driver.findMany({
        where: {
          ...driverWhere,
          user: userWhere
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              isActive: true,
              createdAt: true
            }
          },
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          earnings: {
            select: {
              amount: true,
              type: true,
              date: true
            },
            orderBy: { date: 'desc' },
            take: 10
          }
        }
      }),
      prisma.driver.count({
        where: {
          ...driverWhere,
          user: userWhere
        }
      })
    ]);

    // Calculate driver statistics
    const driverStats = drivers.map(driver => ({
      ...driver,
      completedOrders: driver.orders.filter(order => order.status === 'DELIVERED').length,
      weeklyEarnings: driver.earnings
        .filter(earning => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(earning.date) >= weekAgo;
        })
        .reduce((sum, earning) => sum + earning.amount, 0),
      lastDelivery: driver.orders.find(order => order.status === 'DELIVERED')?.createdAt || null
    }));

    res.json({
      drivers: driverStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

    logger.info(`Admin ${req.user.email} accessed driver list`);

  } catch (error) {
    logger.error('Get drivers error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get single user details
router.get('/:userId', [
  auth,
  requireAdmin
], async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Driver: true,
        Admin: true,
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        addresses: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        pushTokens: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Remove sensitive information
    const userResponse = {
      ...user,
      password: undefined
    };

    res.json({ user: userResponse });

    logger.info(`Admin ${req.user.email} accessed user details: ${userId}`);

  } catch (error) {
    logger.error('Get user details error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Create new user (admin function)
router.post('/create', [
  auth,
  requireAdmin,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone('any'),
  body('role').isIn(['CUSTOMER', 'DRIVER', 'ADMIN']),
  body('isVerified').optional().isBoolean(),
  body('driverData').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name, phone, role, isVerified = true, driverData } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role,
        isVerified,
        isActive: true
      }
    });

    // Create role-specific profiles
    if (role === 'DRIVER' && driverData) {
      await prisma.driver.create({
        data: {
          userId: user.id,
          licenseNumber: driverData.licenseNumber,
          vehicleMake: driverData.vehicleMake,
          vehicleModel: driverData.vehicleModel,
          vehicleYear: driverData.vehicleYear,
          vehicleColor: driverData.vehicleColor,
          licensePlate: driverData.licensePlate,
          isVerified: driverData.isVerified || false,
          documentsStatus: driverData.documentsStatus || 'PENDING'
        }
      });
    }

    if (role === 'ADMIN') {
      await prisma.admin.create({
        data: {
          userId: user.id,
          role: 'ADMIN'
        }
      });
    }

    // Send welcome message
    if (phone) {
      await sendSMS(phone, `Welcome to Faded Skies! Your account has been created by an administrator.`);
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });

    logger.info(`Admin ${req.user.email} created new user: ${email} (${role})`);

  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update user information
router.put('/:userId', [
  auth,
  requireAdmin,
  body('email').optional().isEmail().normalizeEmail(),
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone('any'),
  body('isVerified').optional().isBoolean(),
  body('isActive').optional().isBoolean(),
  body('loyaltyPoints').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const updates = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // If email is being updated, check for conflicts
    if (updates.email && updates.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: updates.email }
      });

      if (emailExists) {
        return res.status(409).json({
          error: 'Email already in use'
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        loyaltyPoints: updatedUser.loyaltyPoints,
        updatedAt: updatedUser.updatedAt
      }
    });

    logger.info(`Admin ${req.user.email} updated user: ${userId}`);

  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Reset user password (admin function)
router.post('/:userId/reset-password', [
  auth,
  requireAdmin,
  body('newPassword').isLength({ min: 6 }),
  body('sendNotification').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { newPassword, sendNotification = true } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    // Send notification if requested
    if (sendNotification && user.phone) {
      await sendSMS(
        user.phone,
        'Your Faded Skies password has been reset by an administrator. Please log in with your new password.'
      );
    }

    res.json({
      message: 'Password reset successfully'
    });

    logger.info(`Admin ${req.user.email} reset password for user: ${userId}`);

  } catch (error) {
    logger.error('Admin password reset error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update user email (admin function)
router.post('/:userId/update-email', [
  auth,
  requireAdmin,
  body('newEmail').isEmail().normalizeEmail(),
  body('sendNotification').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { newEmail, sendNotification = true } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Check if new email is already in use
    const emailExists = await prisma.user.findUnique({
      where: { email: newEmail }
    });

    if (emailExists) {
      return res.status(409).json({
        error: 'Email already in use'
      });
    }

    const oldEmail = user.email;

    // Update email
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        isVerified: false // Require re-verification for new email
      }
    });

    // Send notifications
    if (sendNotification) {
      if (user.phone) {
        await sendSMS(
          user.phone,
          `Your Faded Skies email has been changed from ${oldEmail} to ${newEmail} by an administrator.`
        );
      }
    }

    res.json({
      message: 'Email updated successfully',
      oldEmail,
      newEmail
    });

    logger.info(`Admin ${req.user.email} updated email for user ${userId}: ${oldEmail} -> ${newEmail}`);

  } catch (error) {
    logger.error('Admin email update error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Deactivate/Activate user account
router.post('/:userId/toggle-status', [
  auth,
  requireAdmin,
  body('isActive').isBoolean(),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const { isActive, reason } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });

    // Send notification
    if (user.phone) {
      const message = isActive 
        ? 'Your Faded Skies account has been reactivated.'
        : `Your Faded Skies account has been deactivated${reason ? `: ${reason}` : '.'}`;
      
      await sendSMS(user.phone, message);
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });

    logger.info(`Admin ${req.user.email} ${isActive ? 'activated' : 'deactivated'} user: ${userId}${reason ? ` (${reason})` : ''}`);

  } catch (error) {
    logger.error('Toggle user status error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get user statistics dashboard
router.get('/stats/dashboard', [
  auth,
  requireAdmin
], async (req, res) => {
  try {
    // Get comprehensive user statistics
    const [
      totalUsers,
      totalCustomers,
      totalDrivers,
      totalAdmins,
      verifiedUsers,
      activeUsers,
      onlineDrivers,
      recentSignups,
      topCustomers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.driver.count({ where: { isOnline: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.user.findMany({
        where: { role: 'CUSTOMER' },
        include: {
          orders: {
            select: {
              total: true
            }
          }
        },
        take: 10
      })
    ]);

    // Calculate top customers by spending
    const topCustomerStats = topCustomers
      .map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalSpent: customer.orders.reduce((sum, order) => sum + order.total, 0),
        orderCount: customer.orders.length
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    res.json({
      overview: {
        totalUsers,
        totalCustomers,
        totalDrivers,
        totalAdmins,
        verifiedUsers,
        activeUsers,
        onlineDrivers,
        recentSignups
      },
      topCustomers: topCustomerStats,
      verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : '0',
      activeRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(1) : '0'
    });

    logger.info(`Admin ${req.user.email} accessed user statistics dashboard`);

  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
