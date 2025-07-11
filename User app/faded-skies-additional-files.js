// ===================================
// src/routes/users.js
// ===================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const { User, DeliveryAddress, PaymentMethod, RewardsTransaction } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { idDocumentUploader } = require('../services/uploadService');
const IDVerificationService = require('../services/idVerificationService');
const PaymentService = require('../services/paymentService');
const logger = require('../utils/logger');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash', 'stripeCustomerId', 'fcmTokens'] }
    });

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      age: user.age,
      idVerified: user.idVerified,
      idVerificationStatus: user.idVerificationStatus,
      rewardsBalance: user.rewardsBalance,
      accountStatus: user.accountStatus,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('fullName').optional().isLength({ min: 2, max: 100 }).trim(),
  body('phone').optional().matches(/^\(\d{3}\) \d{3}-\d{4}$/),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { fullName, phone, email } = req.body;
    const userId = req.user.id;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ 
        where: { email },
        attributes: ['id']
      });
      
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ 
          error: 'Email already in use',
          code: 'EMAIL_TAKEN'
        });
      }
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;

    await User.update(updateData, { where: { id: userId } });

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash', 'stripeCustomerId', 'fcmTokens'] }
    });

    logger.info(`Profile updated for user: ${userId}`);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ID Verification upload
router.post('/id-verification', [
  authenticateToken,
  idDocumentUploader.single('idDocument'),
  body('documentType').isIn(['drivers_license', 'state_id', 'passport', 'military_id'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'ID document file is required' });
    }

    const { documentType } = req.body;
    const userId = req.user.id;
    const documentUrl = req.file.location; // S3 URL

    // Process ID verification
    const result = await IDVerificationService.processIDDocument(
      userId, 
      documentUrl, 
      documentType
    );

    if (!result.success) {
      return res.status(400).json({ 
        error: 'ID verification failed',
        details: result.error
      });
    }

    // Update user record
    await User.update({
      idDocumentUrl: documentUrl,
      idVerificationStatus: 'processing'
    }, { where: { id: userId } });

    logger.info(`ID verification submitted for user: ${userId}`);

    res.json({
      message: 'ID document uploaded successfully',
      verificationId: result.verificationId,
      status: 'processing'
    });
  } catch (error) {
    logger.error('ID verification error:', error);
    res.status(500).json({ error: 'Failed to process ID verification' });
  }
});

// Get delivery addresses
router.get('/addresses', authenticateToken, async (req, res) => {
  try {
    const addresses = await DeliveryAddress.findAll({
      where: { userId: req.user.id },
      order: [['isPrimary', 'DESC'], ['createdAt', 'ASC']]
    });

    res.json({ addresses });
  } catch (error) {
    logger.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Add delivery address
router.post('/addresses', [
  authenticateToken,
  body('name').isLength({ min: 1, max: 100 }).trim(),
  body('addressLine1').isLength({ min: 5, max: 255 }).trim(),
  body('city').isLength({ min: 2, max: 100 }).trim(),
  body('state').isLength({ min: 2, max: 2 }).trim(),
  body('zipCode').matches(/^\d{5}(-\d{4})?$/),
  body('addressType').isIn(['home', 'work', 'other']),
  body('deliveryInstructions').optional().isLength({ max: 500 }).trim(),
  body('isPrimary').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, addressLine1, addressLine2, city, state, zipCode, addressType, deliveryInstructions, isPrimary } = req.body;
    const userId = req.user.id;

    // If this is being set as primary, update others
    if (isPrimary) {
      await DeliveryAddress.update(
        { isPrimary: false },
        { where: { userId } }
      );
    }

    // Check if this is the first address (auto-primary)
    const addressCount = await DeliveryAddress.count({ where: { userId } });
    const shouldBePrimary = isPrimary || addressCount === 0;

    const address = await DeliveryAddress.create({
      userId,
      name,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      zipCode,
      addressType,
      deliveryInstructions: deliveryInstructions || null,
      isPrimary: shouldBePrimary
    });

    logger.info(`Address added for user: ${userId}`);

    res.status(201).json({
      message: 'Address added successfully',
      address
    });
  } catch (error) {
    logger.error('Add address error:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// Update delivery address
router.put('/addresses/:id', [
  authenticateToken,
  body('name').optional().isLength({ min: 1, max: 100 }).trim(),
  body('addressLine1').optional().isLength({ min: 5, max: 255 }).trim(),
  body('city').optional().isLength({ min: 2, max: 100 }).trim(),
  body('state').optional().isLength({ min: 2, max: 2 }).trim(),
  body('zipCode').optional().matches(/^\d{5}(-\d{4})?$/),
  body('addressType').optional().isIn(['home', 'work', 'other']),
  body('deliveryInstructions').optional().isLength({ max: 500 }).trim(),
  body('isPrimary').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const address = await DeliveryAddress.findOne({
      where: { id, userId }
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // If setting as primary, update others
    if (updateData.isPrimary) {
      await DeliveryAddress.update(
        { isPrimary: false },
        { where: { userId, id: { [Op.ne]: id } } }
      );
    }

    await address.update(updateData);

    res.json({
      message: 'Address updated successfully',
      address
    });
  } catch (error) {
    logger.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Delete delivery address
router.delete('/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await DeliveryAddress.findOne({
      where: { id, userId }
    });

    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const wasPrimary = address.isPrimary;
    await address.destroy();

    // If deleted address was primary, make another one primary
    if (wasPrimary) {
      const nextAddress = await DeliveryAddress.findOne({
        where: { userId },
        order: [['createdAt', 'ASC']]
      });

      if (nextAddress) {
        await nextAddress.update({ isPrimary: true });
      }
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    logger.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// Get payment methods
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.findAll({
      where: { userId: req.user.id, isActive: true },
      attributes: { exclude: ['externalId'] },
      order: [['isPrimary', 'DESC'], ['createdAt', 'ASC']]
    });

    res.json({ paymentMethods });
  } catch (error) {
    logger.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Add payment method
router.post('/payment-methods', [
  authenticateToken,
  body('stripePaymentMethodId').notEmpty().trim(),
  body('type').isIn(['card', 'apple_pay', 'google_pay'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { stripePaymentMethodId, type } = req.body;
    const userId = req.user.id;

    const paymentMethod = await PaymentService.attachPaymentMethod(
      userId, 
      stripePaymentMethodId
    );

    logger.info(`Payment method added for user: ${userId}`);

    res.status(201).json({
      message: 'Payment method added successfully',
      paymentMethod
    });
  } catch (error) {
    logger.error('Add payment method error:', error);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

// Delete payment method
router.delete('/payment-methods/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await PaymentService.removePaymentMethod(userId, id);

    res.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    logger.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Failed to remove payment method' });
  }
});

// Get rewards history
router.get('/rewards', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    const { rows: transactions, count } = await RewardsTransaction.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const user = await User.findByPk(userId, {
      attributes: ['rewardsBalance']
    });

    res.json({
      currentBalance: user.rewardsBalance,
      transactions,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < count
      }
    });
  } catch (error) {
    logger.error('Get rewards error:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

module.exports = router;

// ===================================
// src/routes/support.js
// ===================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const { SupportTicket, SupportMessage, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Create support ticket
router.post('/tickets', [
  authenticateToken,
  body('subject').isLength({ min: 5, max: 255 }).trim(),
  body('category').isIn(['order', 'payment', 'account', 'product', 'delivery', 'other']),
  body('message').isLength({ min: 10, max: 2000 }).trim(),
  body('priority').optional().isIn(['low', 'medium', 'high'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { subject, category, message, priority = 'medium' } = req.body;
    const userId = req.user.id;

    const ticket = await SupportTicket.create({
      userId,
      subject,
      category,
      priority,
      status: 'open'
    });

    // Create initial message
    await SupportMessage.create({
      ticketId: ticket.id,
      senderType: 'user',
      senderId: userId,
      message
    });

    logger.info(`Support ticket created: ${ticket.id} by user ${userId}`);

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });
  } catch (error) {
    logger.error('Create support ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// Get user's support tickets
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const { rows: tickets, count } = await SupportTicket.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['fullName'],
          required: false
        }
      ]
    });

    res.json({
      tickets: tickets.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        agentName: ticket.agent?.fullName || null,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < count
      }
    });
  } catch (error) {
    logger.error('Get support tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

// Get ticket messages
router.get('/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ticket belongs to user or user is agent
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket || (ticket.userId !== userId && req.user.role !== 'agent')) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const messages = await SupportMessage.findAll({
      where: { ticketId: id },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['fullName', 'role']
        }
      ]
    });

    res.json({
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status
      },
      messages: messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        senderType: msg.senderType,
        senderName: msg.sender?.fullName || 'System',
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    logger.error('Get ticket messages error:', error);
    res.status(500).json({ error: 'Failed to fetch ticket messages' });
  }
});

// Add message to ticket
router.post('/tickets/:id/messages', [
  authenticateToken,
  body('message').isLength({ min: 1, max: 2000 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    // Verify ticket belongs to user or user is agent
    const ticket = await SupportTicket.findByPk(id);
    if (!ticket || (ticket.userId !== userId && req.user.role !== 'agent')) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Create message
    const newMessage = await SupportMessage.create({
      ticketId: id,
      senderType: req.user.role === 'agent' ? 'agent' : 'user',
      senderId: userId,
      message
    });

    // Update ticket timestamp
    await ticket.update({ updatedAt: new Date() });

    logger.info(`Message added to ticket ${id} by user ${userId}`);

    res.status(201).json({
      message: 'Message added successfully',
      messageData: {
        id: newMessage.id,
        message: newMessage.message,
        senderType: newMessage.senderType,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    logger.error('Add ticket message error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// Agent endpoints
router.get('/agent/tickets', [
  authenticateToken,
  requireRole(['agent', 'admin'])
], async (req, res) => {
  try {
    const { status = 'open', limit = 50, offset = 0 } = req.query;

    const { rows: tickets, count } = await SupportTicket.findAndCountAll({
      where: status !== 'all' ? { status } : {},
      order: [['priority', 'DESC'], ['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['fullName', 'email']
        },
        {
          model: User,
          as: 'agent',
          attributes: ['fullName'],
          required: false
        }
      ]
    });

    res.json({
      tickets: tickets.map(ticket => ({
        id: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        customerName: ticket.customer.fullName,
        customerEmail: ticket.customer.email,
        agentName: ticket.agent?.fullName || null,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < count
      }
    });
  } catch (error) {
    logger.error('Get agent tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

module.exports = router;

// ===================================
// src/routes/health.js
// ===================================

const express = require('express');
const { sequelize } = require('../models');
const redis = require('../config/redis');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Basic health check
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    checks: {}
  };

  let isHealthy = true;

  try {
    // Database check
    const start = Date.now();
    await sequelize.authenticate();
    const dbTime = Date.now() - start;
    health.checks.database = {
      status: 'healthy',
      responseTime: `${dbTime}ms`
    };
  } catch (error) {
    health.checks.database = {
      status: 'unhealthy',
      error: error.message,
      responseTime: 'timeout'
    };
    isHealthy = false;
  }

  try {
    // Redis check
    const start = Date.now();
    await redis.ping();
    const redisTime = Date.now() - start;
    health.checks.redis = {
      status: 'healthy',
      responseTime: `${redisTime}ms`
    };
  } catch (error) {
    health.checks.redis = {
      status: 'unhealthy',
      error: error.message,
      responseTime: 'timeout'
    };
    isHealthy = false;
  }

  try {
    // External services check
    const stripeCheck = await stripe.balance.retrieve();
    health.checks.stripe = {
      status: 'healthy',
      available: stripeCheck.available
    };
  } catch (error) {
    health.checks.stripe = {
      status: 'degraded',
      error: 'Stripe API unavailable'
    };
    // Don't mark as unhealthy for external service issues
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
    usage: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    }
  };

  health.status = isHealthy ? 'healthy' : 'unhealthy';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json(health);
});

// Detailed metrics
router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    system: {
      loadAverage: process.loadavg ? process.loadavg() : null,
      freeMemory: process.freemem ? process.freemem() : null,
      totalMemory: process.totalmem ? process.totalmem() : null
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      version: process.env.APP_VERSION || '1.0.0'
    }
  };

  res.json(metrics);
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check critical dependencies
    await sequelize.authenticate();
    await redis.ping();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;

// ===================================
// src/routes/webhooks.js
// ===================================

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Order, User } = require('../models');
const NotificationService = require('../services/notificationService');
const EmailService = require('../services/emailService');
const logger = require('../utils/logger');

const router = express.Router();

// Stripe webhook
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Firebase/FCM webhook (for message delivery receipts)
router.post('/fcm', (req, res) => {
  try {
    const { messageId, status, deviceToken } = req.body;
    
    logger.info(`FCM delivery receipt: ${messageId} - ${status}`);
    
    // Handle failed deliveries by removing invalid tokens
    if (status === 'failed' || status === 'invalid_token') {
      // Remove invalid token from user records
      // This would require a more sophisticated lookup
      logger.warn(`Invalid FCM token detected: ${deviceToken}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('FCM webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper functions
async function handlePaymentSucceeded(paymentIntent) {
  try {
    const order = await Order.findOne({
      where: { paymentIntentId: paymentIntent.id },
      include: [{ model: User, as: 'customer' }]
    });

    if (order) {
      await order.update({ status: 'confirmed' });
      
      // Send confirmation notifications
      await NotificationService.sendOrderUpdate(order.id, 'confirmed');
      await EmailService.sendOrderConfirmation(order);
      
      logger.info(`Payment succeeded for order: ${order.id}`);
    }
  } catch (error) {
    logger.error('Handle payment succeeded error:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    const order = await Order.findOne({
      where: { paymentIntentId: paymentIntent.id },
      include: [{ model: User, as: 'customer' }]
    });

    if (order) {
      await order.update({ status: 'payment_failed' });
      
      // Send failure notification
      await NotificationService.sendPushNotification(order.userId, {
        title: '❌ Payment Failed',
        body: `Payment for order ${order.orderNumber} could not be processed. Please try again.`,
        type: 'payment_failed',
        orderId: order.id
      });
      
      logger.info(`Payment failed for order: ${order.id}`);
    }
  } catch (error) {
    logger.error('Handle payment failed error:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    // Handle subscription cancellation if applicable
    logger.info(`Subscription deleted: ${subscription.id}`);
  } catch (error) {
    logger.error('Handle subscription deleted error:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    // Handle invoice payment success if applicable
    logger.info(`Invoice payment succeeded: ${invoice.id}`);
  } catch (error) {
    logger.error('Handle invoice payment succeeded error:', error);
  }
}

module.exports = router;

// ===================================
// src/middleware/errorHandler.js
// ===================================

const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Default error
  let error = {
    message: 'Internal server error',
    status: 500
  };

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.status = 400;
    error.details = err.errors;
  }

  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    error.message = 'Database validation failed';
    error.status = 400;
    error.details = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    error.message = 'Resource already exists';
    error.status = 409;
    error.field = err.errors[0]?.path;
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error.message = 'Invalid reference';
    error.status = 400;
  }

  if (err.name === 'SequelizeConnectionError') {
    error.message = 'Database connection failed';
    error.status = 503;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // Stripe errors
  if (err.type === 'StripeCardError') {
    error.message = 'Payment failed';
    error.status = 400;
    error.details = err.message;
  }

  if (err.type === 'StripeInvalidRequestError') {
    error.message = 'Invalid payment request';
    error.status = 400;
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    error.status = 400;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected file field';
    error.status = 400;
  }

  // Rate limiting errors
  if (err.status === 429) {
    error.message = 'Too many requests';
    error.status = 429;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    delete error.details;
    if (error.status === 500) {
      error.message = 'Internal server error';
    }
  }

  res.status(error.status).json({
    error: error.message,
    ...(error.details && { details: error.details }),
    ...(error.field && { field: error.field }),
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

module.exports = errorHandler;

// ===================================
// src/middleware/rateLimiter.js
// ===================================

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

const createRateLimiter = (options) => {
  const defaults = {
    store: new RedisStore({
      client: redis,
      prefix: 'rl:'
    }),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.round(options.windowMs / 1000)} seconds.`,
        retryAfter: Math.round(options.windowMs / 1000)
      });
    }
  };

  return rateLimit({ ...defaults, ...options });
};

// Different rate limiters for different endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  message: 'Too many authentication attempts from this IP',
  skipSuccessfulRequests: true
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many API requests from this IP'
});

const orderLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 orders per minute per IP
  message: 'Too many orders placed from this IP',
  skipSuccessfulRequests: false
});

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute per IP
  message: 'Too many file uploads from this IP'
});

const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute per IP
  message: 'Too many chat messages from this IP'
});

// Strict limiter for sensitive endpoints
const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour per IP
  message: 'Too many attempts from this IP'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  orderLimiter,
  uploadLimiter,
  chatLimiter,
  strictLimiter
};

// ===================================
// src/utils/logger.js
// ===================================

const winston = require('winston');
const path = require('path');

// Custom format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: {
    service: 'faded-skies-api',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      silent: process.env.NODE_ENV === 'test'
    }),

    // File transports
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],

  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Add request logging middleware
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

module.exports = logger;