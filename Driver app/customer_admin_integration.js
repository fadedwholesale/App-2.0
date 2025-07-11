// routes/customers.js - Customer app routes
const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateCustomer } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get customer profile
router.get('/profile', authenticateCustomer, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update customer profile
router.put('/profile', authenticateCustomer, [
  body('firstName').optional().isLength({ min: 2 }),
  body('lastName').optional().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add/update delivery address
router.post('/addresses', authenticateCustomer, [
  body('street').notEmpty(),
  body('city').notEmpty(),
  body('state').isLength({ min: 2, max: 2 }),
  body('zipCode').isPostalCode('US'),
  body('coordinates.lat').isFloat({ min: -90, max: 90 }),
  body('coordinates.lng').isFloat({ min: -180, max: 180 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { street, city, state, zipCode, coordinates, instructions, isDefault } = req.body;
    
    const user = await User.findById(req.user.userId);
    
    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    // Add new address
    user.addresses.push({
      street,
      city,
      state,
      zipCode,
      coordinates,
      instructions,
      isDefault: isDefault || user.addresses.length === 0
    });
    
    await user.save();
    res.json({ message: 'Address added successfully', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all products
router.get('/products', authenticateCustomer, async (req, res) => {
  try {
    const { category, page = 1, limit = 20, search } = req.query;
    
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'strain.name': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get product categories
router.get('/categories', authenticateCustomer, async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Place order
router.post('/orders', authenticateCustomer, [
  body('items').isArray({ min: 1 }),
  body('deliveryAddress').notEmpty(),
  body('paymentMethod').notEmpty(),
  body('subtotal').isFloat({ min: 0 }),
  body('total').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      items,
      deliveryAddress,
      paymentMethod,
      subtotal,
      taxes,
      deliveryFee,
      tip,
      total,
      specialInstructions
    } = req.body;

    // Get customer info
    const customer = await User.findById(req.user.userId);
    
    // Validate items and calculate totals
    let calculatedSubtotal = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ 
          message: `Product ${item.productId} not available` 
        });
      }
      
      const priceInfo = product.prices.find(p => 
        p.unit === item.unit && p.quantity === item.quantity
      );
      
      if (!priceInfo || !priceInfo.inStock) {
        return res.status(400).json({ 
          message: `${product.name} (${item.unit}) not available` 
        });
      }
      
      const itemTotal = priceInfo.price * item.quantity;
      calculatedSubtotal += itemTotal;
      
      validatedItems.push({
        productId: product._id,
        name: product.name,
        category: product.category,
        strain: product.strain?.name,
        potency: product.potency,
        quantity: item.quantity,
        unit: item.unit,
        price: priceInfo.price,
        total: itemTotal
      });
    }

    // Create order
    const order = new Order({
      customerId: req.user.userId,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email
      },
      items: validatedItems,
      subtotal: calculatedSubtotal,
      taxes: taxes || calculatedSubtotal * 0.08, // 8% tax
      deliveryFee: deliveryFee || 5.00,
      tip: tip || 0,
      total: total,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      estimatedDistance: calculateDistance(
        { lat: 30.2672, lng: -97.7431 }, // Store location
        deliveryAddress.coordinates
      )
    });

    await order.save();

    // Emit socket event for new order
    req.app.get('io').emit('new_order_placed', {
      orderId: order._id,
      customerId: order.customerId,
      deliveryAddress: order.deliveryAddress,
      total: order.total,
      priority: order.priority,
      estimatedDistance: order.estimatedDistance
    });

    res.status(201).json({ 
      message: 'Order placed successfully', 
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000) // 45 minutes
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Track order
router.get('/orders/:orderId/track', authenticateCustomer, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ 
      _id: orderId, 
      customerId: req.user.userId 
    }).populate('driverId', 'firstName lastName phone vehicle rating currentLocation');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const trackingInfo = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      actualDeliveryTime: order.actualDeliveryTime,
      driver: order.driverId ? {
        name: `${order.driverId.firstName} ${order.driverId.lastName}`,
        phone: order.driverId.phone,
        vehicle: order.driverId.vehicle,
        rating: order.driverId.rating,
        currentLocation: order.driverId.currentLocation
      } : null,
      tracking: order.tracking,
      timeline: [
        { 
          status: 'pending', 
          timestamp: order.placedAt, 
          description: 'Order placed and payment confirmed' 
        }
      ]
    };

    // Add timeline events based on order status
    if (order.acceptedAt) {
      trackingInfo.timeline.push({
        status: 'accepted',
        timestamp: order.acceptedAt,
        description: `Order accepted by ${order.driverId?.firstName || 'driver'}`
      });
    }

    if (order.pickedUpAt) {
      trackingInfo.timeline.push({
        status: 'picked_up',
        timestamp: order.pickedUpAt,
        description: 'Order picked up from store'
      });
    }

    if (order.deliveredAt) {
      trackingInfo.timeline.push({
        status: 'delivered',
        timestamp: order.deliveredAt,
        description: 'Order delivered successfully'
      });
    }

    res.json(trackingInfo);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message to driver
router.post('/orders/:orderId/message', authenticateCustomer, [
  body('message').notEmpty().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { message } = req.body;
    
    const order = await Order.findOne({ 
      _id: orderId, 
      customerId: req.user.userId,
      status: { $in: ['accepted', 'picked_up', 'in_transit'] }
    });

    if (!order) {
      return res.status(404).json({ message: 'Active order not found' });
    }

    // Add message to order
    order.messages.push({
      sender: 'customer',
      message,
      timestamp: new Date()
    });
    await order.save();

    // Send real-time message to driver
    req.app.get('io').to(`driver_${order.driverId}`).emit('new_message', {
      orderId: order._id,
      sender: 'customer',
      message,
      timestamp: new Date()
    });

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rate driver after delivery
router.post('/orders/:orderId/rate', authenticateCustomer, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('feedback').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { rating, feedback } = req.body;
    
    const order = await Order.findOneAndUpdate(
      { 
        _id: orderId, 
        customerId: req.user.userId,
        status: 'delivered',
        'customerRating.rating': { $exists: false }
      },
      {
        customerRating: {
          rating,
          feedback,
          submittedAt: new Date()
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found or already rated' 
      });
    }

    // Update driver's overall rating
    if (order.driverId) {
      const Driver = require('../models/Driver');
      const driver = await Driver.findById(order.driverId);
      
      if (driver) {
        const newTotalRatings = driver.totalRatings + 1;
        const newAverageRating = ((driver.rating * driver.totalRatings) + rating) / newTotalRatings;
        
        driver.rating = Math.round(newAverageRating * 10) / 10;
        driver.totalRatings = newTotalRatings;
        await driver.save();
      }
    }

    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order history
router.get('/orders', authenticateCustomer, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const filter = { customerId: req.user.userId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('driverId', 'firstName lastName rating')
      .sort({ placedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order statistics
router.get('/stats', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.user.userId;
    
    const stats = await Order.aggregate([
      { $match: { customerId: mongoose.Types.ObjectId(customerId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'delivered'] }, '$total', 0] 
            } 
          },
          averageOrderValue: {
            $avg: { 
              $cond: [{ $eq: ['$status', 'delivered'] }, '$total', null] 
            }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get favorite products
    const favoriteProducts = await Order.aggregate([
      { 
        $match: { 
          customerId: mongoose.Types.ObjectId(customerId),
          status: 'delivered'
        } 
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          category: { $first: '$items.category' },
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      summary: stats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        deliveredOrders: 0
      },
      favoriteProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

function calculateDistance(point1, point2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = router;

// utils/notifications.js - Notification system
const nodemailer = require('nodemailer');
const twilio = require('twilio');

class NotificationService {
  constructor() {
    // Email setup
    this.emailTransporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // SMS setup
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  async sendEmail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
        text
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log('Email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async sendSMS(to, message) {
    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });

      console.log('SMS sent:', result.sid);
      return result;
    } catch (error) {
      console.error('SMS send error:', error);
      throw error;
    }
  }

  // Order-specific notifications
  async notifyOrderPlaced(order, customer) {
    const subject = `Order Confirmation - ${order.orderNumber}`;
    const message = `Hi ${customer.firstName}, your order ${order.orderNumber} has been placed and will be delivered soon!`;
    
    await Promise.all([
      this.sendEmail(customer.email, subject, this.getOrderEmailTemplate(order, customer), message),
      this.sendSMS(customer.phone, message)
    ]);
  }

  async notifyOrderAccepted(order, customer, driver) {
    const subject = `Driver Assigned - ${order.orderNumber}`;
    const message = `Great news! ${driver.firstName} is on the way with your order. ETA: 20-30 minutes.`;
    
    await Promise.all([
      this.sendEmail(customer.email, subject, this.getDriverAssignedTemplate(order, customer, driver), message),
      this.sendSMS(customer.phone, message)
    ]);
  }

  async notifyOrderDelivered(order, customer) {
    const subject = `Order Delivered - ${order.orderNumber}`;
    const message = `Your order ${order.orderNumber} has been delivered! Enjoy your purchase from Faded Skies.`;
    
    await Promise.all([
      this.sendEmail(customer.email, subject, this.getDeliveryConfirmationTemplate(order, customer), message),
      this.sendSMS(customer.phone, message)
    ]);
  }

  async notifyDriverNewOrder(order, driver) {
    const message = `New delivery available! $${order.driverCompensation?.total || 8.50} for ${order.estimatedDistance}mi delivery. Check your app!`;
    
    // Push notification would be better here, but SMS as backup
    await this.sendSMS(driver.phone, message);
  }

  async notifyPayoutCompleted(payout, driver) {
    const subject = 'Payout Completed';
    const message = `Your payout of $${payout.netAmount} has been processed and will arrive in your account soon.`;
    
    await Promise.all([
      this.sendEmail(driver.email, subject, this.getPayoutTemplate(payout, driver), message),
      this.sendSMS(driver.phone, message)
    ]);
  }

  // Email templates
  getOrderEmailTemplate(order, customer) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Order Confirmation</h1>
        <p>Hi ${customer.firstName},</p>
        <p>Thank you for your order! Here are the details:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order ${order.orderNumber}</h3>
          <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
          <p><strong>Delivery Address:</strong><br>
          ${order.deliveryAddress.street}<br>
          ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}</p>
          <p><strong>Items:</strong></p>
          <ul>
            ${order.items.map(item => `<li>${item.name} - ${item.quantity}x ${item.unit} - $${item.total.toFixed(2)}</li>`).join('')}
          </ul>
        </div>
        
        <p>We'll notify you when a driver accepts your order!</p>
        <p>Questions? Reply to this email or call us at (512) 555-FADE</p>
        
        <p>Best regards,<br>The Faded Skies Team</p>
      </div>
    `;
  }

  getDriverAssignedTemplate(order, customer, driver) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Driver Assigned!</h1>
        <p>Hi ${customer.firstName},</p>
        <p>Great news! Your order is on the way.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Driver</h3>
          <p><strong>Name:</strong> ${driver.firstName} ${driver.lastName}</p>
          <p><strong>Rating:</strong> ⭐ ${driver.rating}/5.0</p>
          <p><strong>Vehicle:</strong> ${driver.vehicle.color} ${driver.vehicle.year} ${driver.vehicle.make} ${driver.vehicle.model}</p>
          <p><strong>License Plate:</strong> ${driver.vehicle.licensePlate}</p>
          <p><strong>Phone:</strong> ${driver.phone}</p>
        </div>
        
        <p><strong>Estimated delivery:</strong> 20-30 minutes</p>
        <p>You can track your order in real-time through our app!</p>
        
        <p>Best regards,<br>The Faded Skies Team</p>
      </div>
    `;
  }

  getDeliveryConfirmationTemplate(order, customer) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Order Delivered! 🎉</h1>
        <p>Hi ${customer.firstName},</p>
        <p>Your order ${order.orderNumber} has been successfully delivered!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Summary</h3>
          <p><strong>Delivered to:</strong><br>
          ${order.deliveryAddress.street}<br>
          ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}</p>
          <p><strong>Delivery Time:</strong> ${order.deliveredAt.toLocaleString()}</p>
          <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        </div>
        
        <p>We hope you enjoy your purchase! Please consider rating your driver and leaving feedback.</p>
        <p>Thank you for choosing Faded Skies! 🌿</p>
        
        <p>Best regards,<br>The Faded Skies Team</p>
      </div>
    `;
  }

  getPayoutTemplate(payout, driver) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Payout Completed! 💰</h1>
        <p>Hi ${driver.firstName},</p>
        <p>Your payout has been processed successfully!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payout Details</h3>
          <p><strong>Amount:</strong> $${payout.amount.toFixed(2)}</p>
          ${payout.fee > 0 ? `<p><strong>Fee:</strong> -$${payout.fee.toFixed(2)}</p>` : ''}
          <p><strong>Net Amount:</strong> $${payout.netAmount.toFixed(2)}</p>
          <p><strong>Method:</strong> ${payout.method.details}</p>
          <p><strong>Expected Arrival:</strong> ${payout.expectedCompletionDate ? payout.expectedCompletionDate.toLocaleDateString() : '1-3 business days'}</p>
        </div>
        
        <p>Keep up the great work delivering for Faded Skies!</p>
        
        <p>Best regards,<br>The Faded Skies Team</p>
      </div>
    `;
  }
}

module.exports = new NotificationService();

// utils/fileUpload.js - File upload handling
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, and DOCX files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Upload to Cloudinary
const uploadToCloudinary = (buffer, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Driver document upload routes
const express = require('express');
const { authenticateDriver, authenticateAdmin } = require('../middleware/auth');
const Driver = require('../models/Driver');

const fileRouter = express.Router();

// Driver profile photo upload
fileRouter.post('/driver/profile-photo', authenticateDriver, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer, 
      'faded-skies/drivers/profiles',
      'image'
    );

    // Update driver profile
    await Driver.findByIdAndUpdate(req.driver.driverId, {
      profilePhoto: result.secure_url
    });

    res.json({ 
      message: 'Profile photo uploaded successfully',
      url: result.secure_url 
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Driver license upload
fileRouter.post('/driver/license', authenticateDriver, upload.single('license'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(
      req.file.buffer, 
      'faded-skies/drivers/documents'
    );

    // Update driver documents
    await Driver.findByIdAndUpdate(req.driver.driverId, {
      'documents.driversLicense': result.secure_url,
      'driversLicense.isVerified': false // Reset verification status
    });

    res.json({ 
      message: 'Driver license uploaded successfully',
      url: result.secure_url 
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Vehicle insurance upload
fileRouter.post('/driver/insurance', authenticateDriver, upload.single('insurance'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(
      req.file.buffer, 
      'faded-skies/drivers/documents'
    );

    await Driver.findByIdAndUpdate(req.driver.driverId, {
      'documents.insurance': result.secure_url,
      'vehicle.insurance.isVerified': false
    });

    res.json({ 
      message: 'Insurance document uploaded successfully',
      url: result.secure_url 
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Order delivery photo upload
fileRouter.post('/orders/:orderId/delivery-photo', authenticateDriver, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { orderId } = req.params;
    
    // Verify driver owns this order
    const Order = require('../models/Order');
    const order = await Order.findOne({ 
      _id: orderId, 
      driverId: req.driver.driverId 
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const result = await uploadToCloudinary(
      req.file.buffer, 
      'faded-skies/deliveries',
      'image'
    );

    // Add photo to order tracking
    if (!order.tracking.deliveryPhotos) {
      order.tracking.deliveryPhotos = [];
    }
    order.tracking.deliveryPhotos.push(result.secure_url);
    await order.save();

    res.json({ 
      message: 'Delivery photo uploaded successfully',
      url: result.secure_url 
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Admin: Product image upload
fileRouter.post('/admin/products/:productId/image', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { productId } = req.params;
    
    const result = await uploadToCloudinary(
      req.file.buffer, 
      'faded-skies/products',
      'image'
    );

    const Product = require('../models/Product');
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.images) {
      product.images = [];
    }
    product.images.push(result.secure_url);
    await product.save();

    res.json({ 
      message: 'Product image uploaded successfully',
      url: result.secure_url 
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

module.exports = { fileRouter, upload, uploadToCloudinary };