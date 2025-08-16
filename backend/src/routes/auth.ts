import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { sendSMS } from '../services/sms';
import { sendPushNotification } from '../services/notifications';

const router = express.Router();

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone('any'),
  body('role').optional().isIn(['CUSTOMER', 'DRIVER']),
  body('dateOfBirth').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name, phone, role = 'CUSTOMER', dateOfBirth, driverData } = req.body;

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

    // Create user with verification enabled by default for immediate login
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        isVerified: true,  // Set as verified by default for immediate access
        isActive: true     // Ensure account is active
      }
    });

    // If registering as driver, create driver profile
    if (role === 'DRIVER' && driverData) {
      await prisma.driver.create({
        data: {
          userId: user.id,
          licenseNumber: driverData.licenseNumber,
          vehicleMake: driverData.vehicleMake,
          vehicleModel: driverData.vehicleModel,
          vehicleYear: driverData.vehicleYear,
          vehicleColor: driverData.vehicleColor,
          licensePlate: driverData.licensePlate
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    // Remove password from response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token
    });

    // Send welcome SMS
    if (phone) {
      await sendSMS(phone, `Welcome to Faded Skies! Your account has been created successfully.`);
    }

    logger.info(`New user registered: ${email} (${role})`);

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, pushToken, platform } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        Driver: true,
        Admin: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account has been deactivated'
      });
    }

    // Note: Removed isVerified check to allow immediate login after signup
    // Users can access the app immediately and verify ID later for purchases

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Save push token if provided
    if (pushToken && platform) {
      await prisma.pushToken.upsert({
        where: { token: pushToken },
        update: {
          userId: user.id,
          platform,
          isActive: true
        },
        create: {
          userId: user.id,
          token: pushToken,
          platform,
          isActive: true
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    // Prepare user response
    const userResponse: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt
    };

    // Add role-specific data
    if (user.role === 'DRIVER' && user.Driver) {
      userResponse.driver = {
        id: user.Driver[0]?.id,
        licenseNumber: user.Driver[0]?.licenseNumber,
        vehicle: {
          make: user.Driver[0]?.vehicleMake,
          model: user.Driver[0]?.vehicleModel,
          year: user.Driver[0]?.vehicleYear,
          color: user.Driver[0]?.vehicleColor,
          licensePlate: user.Driver[0]?.licensePlate
        },
        isOnline: user.Driver[0]?.isOnline,
        rating: user.Driver[0]?.rating,
        totalDeliveries: user.Driver[0]?.totalDeliveries,
        earnings: {
          total: user.Driver[0]?.totalEarnings,
          pending: user.Driver[0]?.pendingEarnings,
          weekly: user.Driver[0]?.weeklyEarnings,
          monthly: user.Driver[0]?.monthlyEarnings
        }
      };
    }

    if (user.role === 'ADMIN' && user.Admin) {
      userResponse.admin = {
        role: user.Admin[0]?.role,
        permissions: user.Admin[0]?.permissions,
        lastLogin: user.Admin[0]?.lastLogin
      };

      // Update last login
      await prisma.admin.update({
        where: { userId: user.id },
        data: { lastLogin: new Date() }
      });
    }

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });

    logger.info(`User logged in: ${email} (${user.role})`);

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res): Promise<any> => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        error: 'Refresh token required'
      });
    }

    // Verify the existing token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Generate new token
    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.json({
      token: newToken
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 3600000) // 1 hour
      }
    });

    // Send reset SMS if phone number exists
    if (user.phone) {
      await sendSMS(
        user.phone,
        `Your Faded Skies password reset code: ${resetToken.slice(-6)}. This code expires in 1 hour.`
      );
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

    logger.info(`Password reset requested for: ${email}`);

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token, password } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        error: 'Invalid reset token'
      });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.json({
      message: 'Password reset successful'
    });

    // Send confirmation SMS
    if (user.phone) {
      await sendSMS(user.phone, 'Your Faded Skies password has been successfully reset.');
    }

    logger.info(`Password reset completed for user: ${user.email}`);

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Logout (invalidate push token)
router.post('/logout', async (req, res) => {
  try {
    const { pushToken } = req.body;

    if (pushToken) {
      await prisma.pushToken.updateMany({
        where: { token: pushToken },
        data: { isActive: false }
      });
    }

    res.json({
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Verify account (for email/phone verification)
router.post('/verify', [
  body('token').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        isVerified: false
      }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid verification token'
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null
      }
    });

    res.json({
      message: 'Account verified successfully'
    });

    logger.info(`Account verified: ${user.email}`);

  } catch (error) {
    logger.error('Account verification error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
