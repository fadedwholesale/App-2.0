// ===================================
// src/routes/products.js
// ===================================

const express = require('express');
const { Op } = require('sequelize');
const { Product, Category, ProductImage } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      search,
      featured,
      strain,
      minPrice,
      maxPrice,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Build where clause
    const where = { isActive: true };
    
    if (category && category !== 'all') {
      const categoryRecord = await Category.findOne({ where: { slug: category } });
      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      }
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (strain) {
      where.strainType = strain;
    }

    if (minPrice) {
      where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
    }

    // Check cache first
    const cacheKey = `products:${JSON.stringify(where)}:${limit}:${offset}:${sortBy}:${sortOrder}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const { rows: products, count } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductImage,
          as: 'images',
          where: { isPrimary: true },
          required: false,
          attributes: ['imageUrl', 'altText']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    const result = {
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
        thcContent: product.thcContent,
        cbdContent: product.cbdContent,
        strainType: product.strainType,
        effects: product.effects,
        labTested: product.labTested,
        stockQuantity: product.stockQuantity,
        isFeatured: product.isFeatured,
        rating: parseFloat(product.rating),
        reviewCount: product.reviewCount,
        category: product.category,
        imageUrl: product.images[0]?.imageUrl || null,
        inStock: product.stockQuantity > 0
      })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < count
      }
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['imageUrl', 'altText', 'isPrimary'],
          order: [['isPrimary', 'DESC'], ['sortOrder', 'ASC']]
        }
      ]
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      originalPrice: product.originalPrice ? parseFloat(product.originalPrice) : null,
      thcContent: product.thcContent,
      cbdContent: product.cbdContent,
      strainType: product.strainType,
      effects: product.effects,
      labTested: product.labTested,
      labResultsUrl: product.labResultsUrl,
      stockQuantity: product.stockQuantity,
      isFeatured: product.isFeatured,
      rating: parseFloat(product.rating),
      reviewCount: product.reviewCount,
      category: product.category,
      images: product.images,
      inStock: product.stockQuantity > 0
    });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;

// ===================================
// src/routes/orders.js
// ===================================

const express = require('express');
const { Order, OrderItem, Product, DeliveryAddress, PaymentMethod, User } = require('../models');
const { authenticateToken, requireIDVerification } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const { body, validationResult } = require('express-validator');
const PaymentService = require('../services/paymentService');
const NotificationService = require('../services/notificationService');
const CartService = require('../services/cartService');
const logger = require('../utils/logger');

const router = express.Router();

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const { rows: orders, count } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              attributes: ['name', 'price', 'thcContent', 'strainType']
            }
          ]
        },
        {
          model: DeliveryAddress,
          as: 'deliveryAddress',
          attributes: ['name', 'addressLine1', 'city', 'state']
        },
        {
          model: User,
          as: 'driver',
          attributes: ['fullName', 'phone'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const result = {
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: parseFloat(order.subtotal),
        taxAmount: parseFloat(order.taxAmount),
        deliveryFee: parseFloat(order.deliveryFee),
        totalAmount: parseFloat(order.totalAmount),
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        specialInstructions: order.specialInstructions,
        deliveredAt: order.deliveredAt,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          productName: item.Product.name,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice),
          thcContent: item.Product.thcContent,
          strainType: item.Product.strainType
        })),
        deliveryAddress: order.deliveryAddress,
        driver: order.driver
      })),
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < count
      }
    };

    res.json(result);
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              attributes: ['name', 'price', 'thcContent', 'strainType', 'imageUrl']
            }
          ]
        },
        {
          model: DeliveryAddress,
          as: 'deliveryAddress'
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['type', 'lastFour']
        },
        {
          model: User,
          as: 'driver',
          attributes: ['fullName', 'phone'],
          required: false
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: parseFloat(order.subtotal),
      taxAmount: parseFloat(order.taxAmount),
      deliveryFee: parseFloat(order.deliveryFee),
      totalAmount: parseFloat(order.totalAmount),
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      specialInstructions: order.specialInstructions,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      items: order.items,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      driver: order.driver
    });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', [
  authenticateToken,
  requireIDVerification,
  orderLimiter,
  body('deliveryAddressId').isUUID(),
  body('paymentMethodId').isUUID(),
  body('specialInstructions').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { deliveryAddressId, paymentMethodId, specialInstructions } = req.body;
    const userId = req.user.id;

    // Get user's cart
    const cartItems = await CartService.getCart(userId);
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate delivery address belongs to user
    const deliveryAddress = await DeliveryAddress.findOne({
      where: { id: deliveryAddressId, userId }
    });

    if (!deliveryAddress) {
      return res.status(400).json({ error: 'Invalid delivery address' });
    }

    // Validate payment method belongs to user
    const paymentMethod = await PaymentMethod.findOne({
      where: { id: paymentMethodId, userId, isActive: true }
    });

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      const product = await Product.findByPk(cartItem.productId);
      
      if (!product || !product.isActive || product.stockQuantity < cartItem.quantity) {
        return res.status(400).json({ 
          error: `Product ${product?.name || 'unknown'} is not available or insufficient stock`
        });
      }

      const itemTotal = parseFloat(product.price) * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
    }

    // Calculate tax and delivery fee
    const taxRate = 0.0875; // 8.75% (example)
    const taxAmount = subtotal * taxRate;
    const deliveryFee = subtotal >= 100 ? 0 : 5.00;
    const totalAmount = subtotal + taxAmount + deliveryFee;

    // Generate order number
    const orderNumber = `#FS${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = await Order.create({
      orderNumber,
      userId,
      deliveryAddressId,
      paymentMethodId,
      status: 'pending',
      subtotal,
      taxAmount,
      deliveryFee,
      totalAmount,
      estimatedDeliveryTime: 120, // 2 hours default
      specialInstructions
    });

    // Create order items
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...item
      });
    }

    // Process payment
    const paymentResult = await PaymentService.processOrderPayment(order.id, paymentMethodId);

    if (!paymentResult.success) {
      await order.update({ status: 'payment_failed' });
      return res.status(400).json({ 
        error: 'Payment failed',
        details: paymentResult.error
      });
    }

    // Update product stock
    for (const item of orderItems) {
      await Product.decrement('stockQuantity', {
        by: item.quantity,
        where: { id: item.productId }
      });
    }

    // Clear cart
    await CartService.clearCart(userId);

    // Send notifications
    await NotificationService.sendOrderUpdate(order.id, 'confirmed');

    logger.info(`Order created: ${order.id} for user ${userId}`);

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        estimatedDeliveryTime: order.estimatedDeliveryTime
      }
    });

  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

module.exports = router;

// ===================================
// src/services/paymentService.js
// ===================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, PaymentMethod, Order, RewardsTransaction } = require('../models');
const logger = require('../utils/logger');

class PaymentService {
  static async createCustomer(user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: {
          userId: user.id
        }
      });

      await user.update({ stripeCustomerId: customer.id });
      return customer;
    } catch (error) {
      logger.error('Create Stripe customer error:', error);
      throw error;
    }
  }

  static async attachPaymentMethod(userId, paymentMethodId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user.stripeCustomerId) {
        await this.createCustomer(user);
        await user.reload();
      }

      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripeCustomerId
      });

      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      // Determine if this should be primary (first payment method)
      const existingMethods = await PaymentMethod.count({ where: { userId } });
      const isPrimary = existingMethods === 0;

      // If setting as primary, update others
      if (isPrimary) {
        await PaymentMethod.update(
          { isPrimary: false },
          { where: { userId } }
        );
      }

      const newPaymentMethod = await PaymentMethod.create({
        userId,
        type: 'card',
        provider: 'stripe',
        externalId: paymentMethodId,
        lastFour: paymentMethod.card.last4,
        cardBrand: paymentMethod.card.brand,
        expiresAt: new Date(paymentMethod.card.exp_year, paymentMethod.card.exp_month - 1),
        isPrimary
      });

      return newPaymentMethod;
    } catch (error) {
      logger.error('Attach payment method error:', error);
      throw error;
    }
  }

  static async createPaymentIntent(amount, paymentMethodId, customerId) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.CLIENT_URL}/payment-complete`,
        metadata: {
          source: 'faded_skies_app'
        }
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Create payment intent error:', error);
      throw error;
    }
  }

  static async processOrderPayment(orderId, paymentMethodId) {
    try {
      const order = await Order.findByPk(orderId);
      const user = await User.findByPk(order.userId);

      if (!user.stripeCustomerId) {
        await this.createCustomer(user);
        await user.reload();
      }

      const paymentIntent = await this.createPaymentIntent(
        order.totalAmount,
        paymentMethodId,
        user.stripeCustomerId
      );

      if (paymentIntent.status === 'succeeded') {
        await order.update({ 
          status: 'confirmed',
          paymentIntentId: paymentIntent.id
        });

        // Award rewards points (1 point per dollar spent)
        const rewardPoints = Math.floor(order.totalAmount);
        
        await RewardsTransaction.create({
          userId: user.id,
          type: 'earned',
          amount: rewardPoints,
          description: 'Purchase reward',
          orderId
        });

        await user.increment('rewardsBalance', { by: rewardPoints });

        logger.info(`Payment processed successfully for order ${orderId}`);
        return { success: true, paymentIntent };
      }

      return { success: false, error: 'Payment not completed' };
    } catch (error) {
      logger.error('Process order payment error:', error);
      
      await Order.update(
        { status: 'payment_failed' },
        { where: { id: orderId } }
      );

      return { success: false, error: error.message };
    }
  }

  static async processFSCoinPayment(userId, orderId, coinAmount) {
    try {
      const user = await User.findByPk(userId);
      
      if (user.rewardsBalance < coinAmount) {
        return { success: false, error: 'Insufficient FS Coin balance' };
      }

      const order = await Order.findByPk(orderId);
      const coinValue = coinAmount * 0.01; // 1 coin = $0.01

      if (coinValue >= order.totalAmount) {
        // Full payment with coins
        const coinsToUse = Math.ceil(order.totalAmount * 100);
        
        await user.decrement('rewardsBalance', { by: coinsToUse });

        await RewardsTransaction.create({
          userId,
          type: 'redeemed',
          amount: -coinsToUse,
          description: 'Order payment',
          orderId
        });

        await order.update({ status: 'confirmed' });

        return { success: true, message: 'Paid with FS Coins' };
      } else {
        return { 
          success: false, 
          error: 'Insufficient FS Coins for full payment',
          partialAmount: coinValue
        };
      }
    } catch (error) {
      logger.error('Process FS Coin payment error:', error);
      return { success: false, error: error.message };
    }
  }

  static async removePaymentMethod(userId, paymentMethodId) {
    try {
      const paymentMethod = await PaymentMethod.findOne({
        where: { id: paymentMethodId, userId }
      });

      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }

      // Remove from Stripe
      await stripe.paymentMethods.detach(paymentMethod.externalId);

      // Remove from database
      await paymentMethod.destroy();

      // If this was primary, make another one primary
      if (paymentMethod.isPrimary) {
        const nextMethod = await PaymentMethod.findOne({
          where: { userId, isActive: true }
        });

        if (nextMethod) {
          await nextMethod.update({ isPrimary: true });
        }
      }

      return { success: true };
    } catch (error) {
      logger.error('Remove payment method error:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;

// ===================================
// src/services/cartService.js
// ===================================

const redis = require('../config/redis');
const { Product } = require('../models');
const logger = require('../utils/logger');

class CartService {
  static getCartKey(userId) {
    return `cart:${userId}`;
  }

  static async getCart(userId) {
    try {
      const cartData = await redis.get(this.getCartKey(userId));
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      logger.error('Get cart error:', error);
      return [];
    }
  }

  static async addToCart(userId, productId, quantity = 1) {
    try {
      // Validate product exists and is available
      const product = await Product.findByPk(productId);
      if (!product || !product.isActive || product.stockQuantity < quantity) {
        throw new Error('Product not available or insufficient stock');
      }

      const cart = await this.getCart(userId);
      const existingItemIndex = cart.findIndex(item => item.productId === productId);

      if (existingItemIndex >= 0) {
        // Update quantity
        cart[existingItemIndex].quantity += quantity;
        cart[existingItemIndex].updatedAt = new Date().toISOString();
      } else {
        // Add new item
        cart.push({
          productId,
          quantity,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      await redis.setex(this.getCartKey(userId), 86400, JSON.stringify(cart)); // 24 hour expiry
      return cart;
    } catch (error) {
      logger.error('Add to cart error:', error);
      throw error;
    }
  }

  static async updateCartItem(userId, productId, quantity) {
    try {
      const cart = await this.getCart(userId);
      const itemIndex = cart.findIndex(item => item.productId === productId);

      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      if (quantity <= 0) {
        // Remove item
        cart.splice(itemIndex, 1);
      } else {
        // Validate stock
        const product = await Product.findByPk(productId);
        if (!product || product.stockQuantity < quantity) {
          throw new Error('Insufficient stock');
        }

        cart[itemIndex].quantity = quantity;
        cart[itemIndex].updatedAt = new Date().toISOString();
      }

      await redis.setex(this.getCartKey(userId), 86400, JSON.stringify(cart));
      return cart;
    } catch (error) {
      logger.error('Update cart item error:', error);
      throw error;
    }
  }

  static async removeFromCart(userId, productId) {
    try {
      const cart = await this.getCart(userId);
      const filteredCart = cart.filter(item => item.productId !== productId);

      await redis.setex(this.getCartKey(userId), 86400, JSON.stringify(filteredCart));
      return filteredCart;
    } catch (error) {
      logger.error('Remove from cart error:', error);
      throw error;
    }
  }

  static async clearCart(userId) {
    try {
      await redis.del(this.getCartKey(userId));
      return [];
    } catch (error) {
      logger.error('Clear cart error:', error);
      throw error;
    }
  }

  static async getCartWithProducts(userId) {
    try {
      const cart = await this.getCart(userId);
      const cartWithProducts = [];

      for (const item of cart) {
        const product = await Product.findByPk(item.productId, {
          attributes: ['id', 'name', 'price', 'stockQuantity', 'isActive']
        });

        if (product && product.isActive) {
          cartWithProducts.push({
            ...item,
            product: {
              id: product.id,
              name: product.name,
              price: parseFloat(product.price),
              stockQuantity: product.stockQuantity,
              inStock: product.stockQuantity >= item.quantity
            }
          });
        }
      }

      return cartWithProducts;
    } catch (error) {
      logger.error('Get cart with products error:', error);
      return [];
    }
  }
}

module.exports = CartService;

// ===================================
// src/services/notificationService.js
// ===================================

const admin = require('firebase-admin');
const { User, Order } = require('../models');
const logger = require('../utils/logger');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../config/firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    logger.warn('Firebase not initialized - push notifications will not work');
  }
}

class NotificationService {
  static async sendPushNotification(userId, notification) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
        return { success: false, error: 'No FCM tokens found' };
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/icon-192x192.png'
        },
        data: {
          type: notification.type || 'general',
          orderId: notification.orderId || '',
          url: notification.url || '',
          timestamp: new Date().toISOString()
        },
        tokens: user.fcmTokens
      };

      const response = await admin.messaging().sendMulticast(message);
      
      // Remove invalid tokens
      if (response.failureCount > 0) {
        const validTokens = user.fcmTokens.filter((token, index) => {
          return response.responses[index].success;
        });

        await user.update({ fcmTokens: validTokens });
      }

      logger.info(`Push notification sent to user ${userId}: ${notification.title}`);
      return { success: true, response };
    } catch (error) {
      logger.error('Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendOrderUpdate(orderId, status) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [{ model: User, as: 'customer' }]
      });

      if (!order) {
        logger.error(`Order not found: ${orderId}`);
        return;
      }

      const notifications = {
        confirmed: {
          title: '🎉 Order Confirmed!',
          body: `Your order ${order.orderNumber} has been confirmed and is being prepared.`,
          type: 'order_update'
        },
        preparing: {
          title: '👨‍🍳 Preparing Your Order',
          body: `Your order ${order.orderNumber} is being carefully prepared.`,
          type: 'order_update'
        },
        out_for_delivery: {
          title: '🚗 Out for Delivery',
          body: `Your order ${order.orderNumber} is on its way! Track your driver in real-time.`,
          type: 'order_update'
        },
        delivered: {
          title: '✅ Order Delivered',
          body: `Your order ${order.orderNumber} has been delivered. Enjoy!`,
          type: 'order_delivered'
        }
      };

      const notification = notifications[status];
      if (notification) {
        notification.orderId = orderId;
        await this.sendPushNotification(order.userId, notification);
      }
    } catch (error) {
      logger.error('Send order update error:', error);
    }
  }

  static async sendDriverETA(orderId, eta) {
    try {
      const order = await Order.findByPk(orderId);
      if (!order) return;

      const notification = {
        title: '🕒 Delivery Update',
        body: `Your driver will arrive in approximately ${eta} minutes.`,
        type: 'eta_update',
        orderId
      };

      await this.sendPushNotification(order.userId, notification);
    } catch (error) {
      logger.error('Send driver ETA error:', error);
    }
  }

  static async registerFCMToken(userId, token) {
    try {
      const user = await User.findByPk(userId);
      const currentTokens = user.fcmTokens || [];
      
      if (!currentTokens.includes(token)) {
        await user.update({
          fcmTokens: [...currentTokens, token]
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Register FCM token error:', error);
      return { success: false, error: error.message };
    }
  }

  static async unregisterFCMToken(userId, token) {
    try {
      const user = await User.findByPk(userId);
      const currentTokens = user.fcmTokens || [];
      
      await user.update({
        fcmTokens: currentTokens.filter(t => t !== token)
      });

      return { success: true };
    } catch (error) {
      logger.error('Unregister FCM token error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = NotificationService;

// ===================================
// src/websocket/index.js
// ===================================

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, SupportTicket, SupportMessage } = require('../models');
const redis = require('../config/redis');
const logger = require('../utils/logger');

function initializeWebSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(payload.userId);
      
      if (!user || user.accountStatus !== 'active') {
        return next(new Error('Invalid user'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.userName = user.fullName;
      
      next();
    } catch (err) {
      logger.error('WebSocket authentication error:', err);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-specific rooms
    if (socket.userRole === 'agent') {
      socket.join('agents');
      // Mark agent as online
      redis.sadd('agents:online', socket.userId);
    } else if (socket.userRole === 'driver') {
      socket.join('drivers');
      redis.sadd('drivers:online', socket.userId);
    }

    // Live chat functionality
    socket.on('join-chat', async (data) => {
      try {
        const { ticketId } = data;
        
        // Validate ticket belongs to user or user is agent
        const ticket = await SupportTicket.findByPk(ticketId);
        if (!ticket || (ticket.userId !== socket.userId && socket.userRole !== 'agent')) {
          socket.emit('error', { message: 'Unauthorized chat access' });
          return;
        }

        socket.join(`chat:${ticketId}`);
        socket.currentChatTicket = ticketId;

        // Notify others in chat
        socket.broadcast.to(`chat:${ticketId}`).emit('user-joined-chat', {
          userId: socket.userId,
          userName: socket.userName,
          userRole: socket.userRole
        });

        // If customer joined and no agent assigned, find available agent
        if (socket.userRole === 'customer' && !ticket.agentId) {
          const availableAgent = await findAvailableAgent();
          if (availableAgent) {
            await assignAgentToTicket(ticketId, availableAgent.id);
            io.to(`user:${availableAgent.id}`).emit('chat-assignment', {
              ticketId,
              customerName: socket.userName
            });
          }
        }

        logger.info(`User ${socket.userId} joined chat ${ticketId}`);
      } catch (error) {
        logger.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    socket.on('send-message', async (data) => {
      try {
        const { ticketId, message } = data;
        
        if (!ticketId || !message || !socket.currentChatTicket) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Save message to database
        const savedMessage = await SupportMessage.create({
          ticketId,
          senderType: socket.userRole === 'agent' ? 'agent' : 'user',
          senderId: socket.userId,
          message: message.trim()
        });

        const messageData = {
          id: savedMessage.id,
          ticketId,
          message: savedMessage.message,
          senderType: savedMessage.senderType,
          senderId: socket.userId,
          senderName: socket.userName,
          createdAt: savedMessage.createdAt
        };

        // Broadcast to chat room
        io.to(`chat:${ticketId}`).emit('new-message', messageData);

        logger.info(`Message sent in chat ${ticketId} by user ${socket.userId}`);
      } catch (error) {
        logger.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', (data) => {
      try {
        const { ticketId } = data;
        if (ticketId && socket.currentChatTicket === ticketId) {
          socket.broadcast.to(`chat:${ticketId}`).emit('user-typing', {
            userId: socket.userId,
            userName: socket.userName,
            userRole: socket.userRole
          });
        }
      } catch (error) {
        logger.error('Typing indicator error:', error);
      }
    });

    socket.on('stop-typing', (data) => {
      try {
        const { ticketId } = data;
        if (ticketId && socket.currentChatTicket === ticketId) {
          socket.broadcast.to(`chat:${ticketId}`).emit('user-stopped-typing', {
            userId: socket.userId
          });
        }
      } catch (error) {
        logger.error('Stop typing indicator error:', error);
      }
    });

    // Order tracking
    socket.on('track-order', (data) => {
      try {
        const { orderId } = data;
        socket.join(`order:${orderId}`);
        logger.info(`User ${socket.userId} tracking order ${orderId}`);
      } catch (error) {
        logger.error('Track order error:', error);
      }
    });

    // Driver location updates (for drivers only)
    socket.on('driver-location-update', async (data) => {
      try {
        if (socket.userRole !== 'driver') {
          socket.emit('error', { message: 'Unauthorized location update' });
          return;
        }

        const { orderId, lat, lng, heading, speed } = data;
        
        if (!orderId || lat === undefined || lng === undefined) {
          socket.emit('error', { message: 'Invalid location data' });
          return;
        }

        // Update Redis for real-time access
        const locationData = {
          lat, lng, heading, speed, orderId,
          driverId: socket.userId,
          lastUpdate: Date.now()
        };

        await redis.setex(
          `driver:location:${socket.userId}`,
          60, // 1 minute expiry
          JSON.stringify(locationData)
        );

        // Broadcast to customers tracking this order
        socket.broadcast.to(`order:${orderId}`).emit('driver-location', locationData);

        logger.debug(`Location update from driver ${socket.userId} for order ${orderId}`);
      } catch (error) {
        logger.error('Driver location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      try {
        logger.info(`User disconnected: ${socket.userId} (${reason})`);

        // Remove from online sets
        if (socket.userRole === 'agent') {
          await redis.srem('agents:online', socket.userId);
          
          // Remove from active chats
          const activeChats = await redis.smembers(`agent:${socket.userId}:active_chats`);
          for (const chatId of activeChats) {
            await redis.srem(`agent:${socket.userId}:active_chats`, chatId);
          }
        } else if (socket.userRole === 'driver') {
          await redis.srem('drivers:online', socket.userId);
          // Clear location data
          await redis.del(`driver:location:${socket.userId}`);
        }

        // Notify chat rooms if user was in a chat
        if (socket.currentChatTicket) {
          socket.broadcast.to(`chat:${socket.currentChatTicket}`).emit('user-left-chat', {
            userId: socket.userId,
            userName: socket.userName
          });
        }
      } catch (error) {
        logger.error('Disconnect cleanup error:', error);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  // Helper functions
  async function findAvailableAgent() {
    try {
      const onlineAgents = await redis.smembers('agents:online');
      
      if (onlineAgents.length === 0) {
        return null;
      }

      // Simple round-robin assignment based on active chat count
      const agentWorkload = await Promise.all(
        onlineAgents.map(async (agentId) => {
          const activeChats = await redis.scard(`agent:${agentId}:active_chats`);
          return { agentId, activeChats };
        })
      );

      const leastBusyAgent = agentWorkload.sort((a, b) => a.activeChats - b.activeChats)[0];
      return await User.findByPk(leastBusyAgent.agentId);
    } catch (error) {
      logger.error('Find available agent error:', error);
      return null;
    }
  }

  async function assignAgentToTicket(ticketId, agentId) {
    try {
      await SupportTicket.update(
        { agentId },
        { where: { id: ticketId } }
      );

      await redis.sadd(`agent:${agentId}:active_chats`, ticketId);
      
      logger.info(`Agent ${agentId} assigned to ticket ${ticketId}`);
    } catch (error) {
      logger.error('Assign agent to ticket error:', error);
    }
  }

  return io;
}

module.exports = initializeWebSocket;