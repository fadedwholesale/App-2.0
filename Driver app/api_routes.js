// routes/auth.js - Authentication routes
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Customer registration
router.post('/register/customer', async (req, res) => {
  try {
    const { email, password, phone, firstName, lastName, dateOfBirth } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      phone,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth)
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, type: 'customer' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Driver registration
router.post('/register/driver', async (req, res) => {
  try {
    const {
      email, password, phone, firstName, lastName, dateOfBirth,
      driversLicense, vehicle
    } = req.body;
    
    // Check if driver already exists
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver already exists' });
    }

    // Create new driver
    const driver = new Driver({
      email,
      password,
      phone,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      driversLicense,
      vehicle,
      status: 'pending' // Requires admin approval
    });

    await driver.save();

    res.status(201).json({
      message: 'Driver application submitted successfully',
      driverId: driver._id,
      status: 'pending_approval'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Customer login
router.post('/login/customer', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, type: 'customer' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        addresses: user.addresses,
        paymentMethods: user.paymentMethods,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Driver login
router.post('/login/driver', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find driver
    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if driver is approved
    if (driver.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Account pending approval', 
        status: driver.status 
      });
    }

    // Check password
    const isPasswordValid = await driver.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    driver.lastActiveAt = new Date();
    await driver.save();

    // Generate token
    const token = jwt.sign(
      { driverId: driver._id, type: 'driver' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      driver: {
        id: driver._id,
        email: driver.email,
        firstName: driver.firstName,
        lastName: driver.lastName,
        phone: driver.phone,
        vehicle: driver.vehicle,
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        earnings: driver.earnings,
        isOnline: driver.isOnline,
        currentLocation: driver.currentLocation
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin login
router.post('/login/admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ message: 'Account deactivated' });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    // Generate token
    const token = jwt.sign(
      { adminId: admin._id, type: 'admin', role: admin.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Token verification
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    if (req.user.type === 'customer') {
      const user = await User.findById(req.user.userId).select('-password');
      res.json({ user, type: 'customer' });
    } else if (req.user.type === 'driver') {
      const driver = await Driver.findById(req.user.driverId).select('-password');
      res.json({ driver, type: 'driver' });
    } else if (req.user.type === 'admin') {
      const admin = await Admin.findById(req.user.adminId).select('-password');
      res.json({ admin, type: 'admin' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

// routes/drivers.js - Driver-specific routes
const express = require('express');
const Driver = require('../models/Driver');
const Order = require('../models/Order');
const { authenticateDriver } = require('../middleware/auth');

const router = express.Router();

// Get driver profile
router.get('/profile', authenticateDriver, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver.driverId).select('-password');
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update driver profile
router.put('/profile', authenticateDriver, async (req, res) => {
  try {
    const updates = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.driver.driverId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).select('-password');
    
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update driver location
router.post('/location', authenticateDriver, async (req, res) => {
  try {
    const { lat, lng, accuracy, heading, speed } = req.body;
    
    const driver = await Driver.findByIdAndUpdate(
      req.driver.driverId,
      {
        currentLocation: { lat, lng, accuracy, heading, speed },
        lastActiveAt: new Date()
      },
      { new: true }
    );

    res.json({ message: 'Location updated', location: driver.currentLocation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle online status
router.post('/status', authenticateDriver, async (req, res) => {
  try {
    const { isOnline } = req.body;
    
    const driver = await Driver.findByIdAndUpdate(
      req.driver.driverId,
      { 
        isOnline,
        lastActiveAt: new Date()
      },
      { new: true }
    );

    res.json({ message: 'Status updated', isOnline: driver.isOnline });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available orders
router.get('/orders/available', authenticateDriver, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver.driverId);
    
    if (!driver.isOnline) {
      return res.json([]);
    }

    // Find orders within 10 miles
    const orders = await Order.find({
      status: 'pending',
      'deliveryAddress.coordinates.lat': {
        $gte: driver.currentLocation.lat - 0.145, // ~10 miles
        $lte: driver.currentLocation.lat + 0.145
      },
      'deliveryAddress.coordinates.lng': {
        $gte: driver.currentLocation.lng - 0.145,
        $lte: driver.currentLocation.lng + 0.145
      }
    }).populate('customerId', 'firstName lastName phone');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept an order
router.post('/orders/:orderId/accept', authenticateDriver, async (req, res) => {
  try {
    const { orderId } = req.params;
    const driverId = req.driver.driverId;

    // Check if order is still available
    const order = await Order.findById(orderId);
    if (!order || order.status !== 'pending') {
      return res.status(400).json({ message: 'Order no longer available' });
    }

    // Assign order to driver
    order.driverId = driverId;
    order.status = 'accepted';
    order.acceptedAt = new Date();
    await order.save();

    // Populate driver info
    await order.populate('driverId', 'firstName lastName phone vehicle rating');

    res.json({ message: 'Order accepted', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.put('/orders/:orderId/status', authenticateDriver, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const driverId = req.driver.driverId;

    const order = await Order.findOne({ _id: orderId, driverId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update status with timestamp
    order.status = status;
    if (status === 'picked_up') {
      order.pickedUpAt = new Date();
    } else if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.actualDeliveryTime = new Date();
      
      // Calculate earnings
      const distance = order.actualDistance || order.estimatedDistance || 3;
      const basePay = 6.00;
      const mileagePay = distance * 0.50;
      const totalEarnings = basePay + mileagePay + (order.tip || 0);
      
      order.driverCompensation = {
        basePay,
        mileagePay,
        tip: order.tip || 0,
        total: totalEarnings
      };

      // Update driver earnings
      await Driver.findByIdAndUpdate(driverId, {
        $inc: {
          'earnings.total': totalEarnings,
          'earnings.today': totalEarnings,
          'earnings.pending': totalEarnings,
          totalDeliveries: 1
        }
      });
    }

    await order.save();
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get driver's current orders
router.get('/orders/current', authenticateDriver, async (req, res) => {
  try {
    const orders = await Order.find({
      driverId: req.driver.driverId,
      status: { $in: ['accepted', 'picked_up', 'in_transit'] }
    }).populate('customerId', 'firstName lastName phone');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get driver's order history
router.get('/orders/history', authenticateDriver, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const orders = await Order.find({
      driverId: req.driver.driverId,
      status: { $in: ['delivered', 'cancelled'] }
    })
    .populate('customerId', 'firstName lastName')
    .sort({ completedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get earnings breakdown
router.get('/earnings', authenticateDriver, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver.driverId);
    
    // Get today's completed orders for detailed breakdown
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayOrders = await Order.find({
      driverId: req.driver.driverId,
      status: 'delivered',
      deliveredAt: { $gte: startOfDay }
    });

    const todayStats = todayOrders.reduce((acc, order) => ({
      totalEarnings: acc.totalEarnings + (order.driverCompensation?.total || 0),
      basePay: acc.basePay + (order.driverCompensation?.basePay || 0),
      mileagePay: acc.mileagePay + (order.driverCompensation?.mileagePay || 0),
      tips: acc.tips + (order.driverCompensation?.tip || 0),
      deliveries: acc.deliveries + 1
    }), { totalEarnings: 0, basePay: 0, mileagePay: 0, tips: 0, deliveries: 0 });

    res.json({
      summary: driver.earnings,
      today: todayStats,
      recentOrders: todayOrders.slice(-5)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

// routes/orders.js - Order management routes
const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Driver = require('../models/Driver');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Place new order (customer)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'customer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const orderData = {
      ...req.body,
      customerId: req.user.userId,
      status: 'pending',
      placedAt: new Date()
    };

    const order = new Order(orderData);
    await order.save();

    // Emit socket event for new order
    req.app.get('io').emit('new_order_placed', {
      orderId: order._id,
      customerId: order.customerId,
      deliveryAddress: order.deliveryAddress,
      total: order.total,
      items: order.items
    });

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order by ID
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    let order;
    if (req.user.type === 'customer') {
      order = await Order.findOne({ _id: orderId, customerId: req.user.userId })
        .populate('driverId', 'firstName lastName phone vehicle rating');
    } else if (req.user.type === 'driver') {
      order = await Order.findOne({ _id: orderId, driverId: req.user.driverId })
        .populate('customerId', 'firstName lastName phone');
    } else {
      order = await Order.findById(orderId)
        .populate('customerId', 'firstName lastName phone email')
        .populate('driverId', 'firstName lastName phone vehicle rating');
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer's orders
router.get('/customer/history', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'customer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 20, status } = req.query;
    
    const filter = { customerId: req.user.userId };
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('driverId', 'firstName lastName phone vehicle rating')
      .sort({ placedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel order
router.post('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    let order;
    if (req.user.type === 'customer') {
      order = await Order.findOne({ _id: orderId, customerId: req.user.userId });
    } else if (req.user.type === 'driver') {
      order = await Order.findOne({ _id: orderId, driverId: req.user.driverId });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = req.user.type;
    order.cancellationReason = reason;
    await order.save();

    // Emit socket event
    req.app.get('io').emit('order_cancelled', {
      orderId: order._id,
      cancelledBy: req.user.type,
      reason
    });

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add rating/feedback
router.post('/:orderId/rating', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, feedback } = req.body;

    const order = await Order.findById(orderId);
    if (!order || order.status !== 'delivered') {
      return res.status(400).json({ message: 'Invalid order for rating' });
    }

    if (req.user.type === 'customer') {
      if (order.customerId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      order.customerRating = {
        rating,
        feedback,
        submittedAt: new Date()
      };

      // Update driver's rating
      if (order.driverId) {
        const driver = await Driver.findById(order.driverId);
        const newTotalRatings = driver.totalRatings + 1;
        const newAverageRating = ((driver.rating * driver.totalRatings) + rating) / newTotalRatings;
        
        driver.rating = Math.round(newAverageRating * 10) / 10;
        driver.totalRatings = newTotalRatings;
        await driver.save();
      }
    }

    await order.save();
    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

// routes/admin.js - Admin routes
const express = require('express');
const Order = require('../models/Order');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's stats
    const todayOrders = await Order.countDocuments({
      placedAt: { $gte: startOfDay }
    });

    const todayRevenue = await Order.aggregate([
      { $match: { placedAt: { $gte: startOfDay }, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // Active drivers
    const activeDrivers = await Driver.countDocuments({ isOnline: true });
    const totalDrivers = await Driver.countDocuments({ status: 'approved' });

    // Pending approvals
    const pendingDrivers = await Driver.countDocuments({ status: 'pending' });

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      today: {
        orders: todayOrders,
        revenue: todayRevenue[0]?.total || 0,
        activeDrivers,
        pendingOrders: await Order.countDocuments({ status: 'pending' })
      },
      totals: {
        totalDrivers,
        pendingDrivers,
        totalCustomers: await User.countDocuments()
      },
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all orders with filters
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      startDate, 
      endDate,
      driverId,
      customerId 
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (driverId) filter.driverId = driverId;
    if (customerId) filter.customerId = customerId;
    
    if (startDate || endDate) {
      filter.placedAt = {};
      if (startDate) filter.placedAt.$gte = new Date(startDate);
      if (endDate) filter.placedAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('customerId', 'firstName lastName email phone')
      .populate('driverId', 'firstName lastName phone vehicle')
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

// Get all drivers
router.get('/drivers', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, isOnline } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (isOnline !== undefined) filter.isOnline = isOnline === 'true';

    const drivers = await Driver.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Driver.countDocuments(filter);

    res.json({
      drivers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDrivers: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/reject driver
router.put('/drivers/:driverId/status', authenticateAdmin, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, notes } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { 
        status,
        adminNotes: notes,
        approvedAt: status === 'approved' ? new Date() : undefined,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');

    // TODO: Send notification to driver about status change

    res.json({ message: 'Driver status updated', driver });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get analytics data
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Orders over time
    const orderTrends = await Order.aggregate([
      {
        $match: {
          placedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$placedAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$total", 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top performing drivers
    const topDrivers = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          deliveredAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$driverId',
          totalDeliveries: { $sum: 1 },
          totalEarnings: { $sum: '$driverCompensation.total' }
        }
      },
      { $sort: { totalDeliveries: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'drivers',
          localField: '_id',
          foreignField: '_id',
          as: 'driver'
        }
      }
    ]);

    res.json({
      period,
      orderTrends,
      topDrivers,
      summary: {
        totalOrders: await Order.countDocuments({
          placedAt: { $gte: startDate, $lte: endDate }
        }),
        totalRevenue: await Order.aggregate([
          {
            $match: {
              status: 'delivered',
              deliveredAt: { $gte: startDate, $lte: endDate }
            }
          },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]).then(result => result[0]?.total || 0),
        avgOrderValue: await Order.aggregate([
          {
            $match: {
              status: 'delivered',
              deliveredAt: { $gte: startDate, $lte: endDate }
            }
          },
          { $group: { _id: null, avg: { $avg: '$total' } } }
        ]).then(result => result[0]?.avg || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;