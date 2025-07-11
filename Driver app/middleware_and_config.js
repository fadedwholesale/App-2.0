// middleware/auth.js - Authentication middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');

// General authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Customer-specific authentication
const authenticateCustomer = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {
      if (req.user.type !== 'customer') {
        return res.status(403).json({ message: 'Customer access required' });
      }
      next();
    });
  } catch (error) {
    return res.status(403).json({ message: 'Authentication failed' });
  }
};

// Driver-specific authentication
const authenticateDriver = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {
      if (req.user.type !== 'driver') {
        return res.status(403).json({ message: 'Driver access required' });
      }
      req.driver = { driverId: req.user.driverId };
      next();
    });
  } catch (error) {
    return res.status(403).json({ message: 'Authentication failed' });
  }
};

// Admin-specific authentication
const authenticateAdmin = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {
      if (req.user.type !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      req.admin = { 
        adminId: req.user.adminId, 
        role: req.user.role 
      };
      next();
    });
  } catch (error) {
    return res.status(403).json({ message: 'Authentication failed' });
  }
};

// Permission-based authorization for admins
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.admin.adminId);
      
      // Super admin has all permissions
      if (admin.role === 'super_admin') {
        return next();
      }

      // Check specific permissions
      const hasPermission = admin.permissions.some(perm => 
        perm.resource === resource && perm.actions.includes(action)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Permission denied: ${action} on ${resource}` 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};

module.exports = {
  authenticateToken,
  authenticateCustomer,
  authenticateDriver,
  authenticateAdmin,
  requirePermission
};

// routes/payouts.js - Payout management routes
const express = require('express');
const Driver = require('../models/Driver');
const { authenticateDriver, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Payout models
const mongoose = require('mongoose');

const payoutMethodSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  type: { type: String, enum: ['bank', 'debit', 'paypal', 'venmo'], required: true },
  
  // Bank account details (encrypted in production)
  bankDetails: {
    accountNumber: String,
    routingNumber: String,
    bankName: String,
    accountHolderName: String
  },
  
  // External payment details
  externalDetails: {
    email: String, // For PayPal/Venmo
    last4: String, // For debit cards
    expiryMonth: Number,
    expiryYear: Number
  },
  
  isPrimary: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  verifiedAt: Date
});

const payoutSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  
  method: {
    type: { type: String, enum: ['bank', 'debit', 'paypal', 'venmo'], required: true },
    details: String // Masked details like "Chase ••••4567"
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // Timing
  requestedAt: { type: Date, default: Date.now },
  processedAt: Date,
  completedAt: Date,
  expectedCompletionDate: Date,
  
  // External references
  externalTransactionId: String,
  failureReason: String,
  
  // Admin tracking
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  adminNotes: String
});

const PayoutMethod = mongoose.model('PayoutMethod', payoutMethodSchema);
const Payout = mongoose.model('Payout', payoutSchema);

// Get driver's payout methods
router.get('/methods', authenticateDriver, async (req, res) => {
  try {
    const methods = await PayoutMethod.find({ driverId: req.driver.driverId })
      .select('-bankDetails.accountNumber -bankDetails.routingNumber')
      .sort({ isPrimary: -1, createdAt: -1 });

    res.json(methods);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new payout method
router.post('/methods', authenticateDriver, async (req, res) => {
  try {
    const { type, bankDetails, externalDetails } = req.body;
    
    // If this is the first method, make it primary
    const existingMethods = await PayoutMethod.countDocuments({ 
      driverId: req.driver.driverId 
    });
    
    const method = new PayoutMethod({
      driverId: req.driver.driverId,
      type,
      bankDetails: type === 'bank' ? bankDetails : undefined,
      externalDetails: type !== 'bank' ? externalDetails : undefined,
      isPrimary: existingMethods === 0,
      isVerified: false // Requires verification process
    });

    await method.save();

    // Return method without sensitive details
    const safeMethod = await PayoutMethod.findById(method._id)
      .select('-bankDetails.accountNumber -bankDetails.routingNumber');

    res.status(201).json({ 
      message: 'Payout method added successfully', 
      method: safeMethod 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Set primary payout method
router.put('/methods/:methodId/primary', authenticateDriver, async (req, res) => {
  try {
    const { methodId } = req.params;

    // Remove primary from all methods
    await PayoutMethod.updateMany(
      { driverId: req.driver.driverId },
      { isPrimary: false }
    );

    // Set new primary
    const method = await PayoutMethod.findOneAndUpdate(
      { _id: methodId, driverId: req.driver.driverId },
      { isPrimary: true },
      { new: true }
    ).select('-bankDetails.accountNumber -bankDetails.routingNumber');

    if (!method) {
      return res.status(404).json({ message: 'Payout method not found' });
    }

    res.json({ message: 'Primary payout method updated', method });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete payout method
router.delete('/methods/:methodId', authenticateDriver, async (req, res) => {
  try {
    const { methodId } = req.params;

    const method = await PayoutMethod.findOneAndDelete({
      _id: methodId,
      driverId: req.driver.driverId
    });

    if (!method) {
      return res.status(404).json({ message: 'Payout method not found' });
    }

    // If deleted method was primary, make another one primary
    if (method.isPrimary) {
      const nextMethod = await PayoutMethod.findOne({ 
        driverId: req.driver.driverId 
      });
      if (nextMethod) {
        nextMethod.isPrimary = true;
        await nextMethod.save();
      }
    }

    res.json({ message: 'Payout method deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Request payout
router.post('/request', authenticateDriver, async (req, res) => {
  try {
    const { amount, method } = req.body;
    
    const driver = await Driver.findById(req.driver.driverId);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (amount > driver.earnings.pending) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Get primary payout method if not specified
    let payoutMethod;
    if (method) {
      payoutMethod = await PayoutMethod.findOne({
        _id: method,
        driverId: req.driver.driverId,
        isVerified: true
      });
    } else {
      payoutMethod = await PayoutMethod.findOne({
        driverId: req.driver.driverId,
        isPrimary: true,
        isVerified: true
      });
    }

    if (!payoutMethod) {
      return res.status(400).json({ 
        message: 'No verified payout method available' 
      });
    }

    // Calculate fees
    let fee = 0;
    let expectedCompletion = new Date();
    
    if (payoutMethod.type === 'bank') {
      // Bank transfers are free but take 3-5 days
      expectedCompletion.setDate(expectedCompletion.getDate() + 3);
    } else {
      // Instant payouts have fees
      fee = Math.max(0.50, amount * 0.01); // $0.50 or 1%, whichever is higher
      expectedCompletion.setHours(expectedCompletion.getHours() + 1); // ~1 hour
    }

    const netAmount = amount - fee;

    // Create payout request
    const payout = new Payout({
      driverId: req.driver.driverId,
      amount,
      fee,
      netAmount,
      method: {
        type: payoutMethod.type,
        details: getMaskedDetails(payoutMethod)
      },
      expectedCompletionDate: expectedCompletion
    });

    await payout.save();

    // Update driver's pending balance
    driver.earnings.pending -= amount;
    await driver.save();

    // In production, integrate with payment processor here
    // For now, we'll simulate the process
    setTimeout(async () => {
      try {
        payout.status = 'processing';
        payout.processedAt = new Date();
        await payout.save();

        // Simulate completion after delay
        setTimeout(async () => {
          payout.status = 'completed';
          payout.completedAt = new Date();
          payout.externalTransactionId = `TX${Date.now()}`;
          await payout.save();

          // Notify driver via socket
          req.app.get('io').to(`driver_${req.driver.driverId}`).emit('payout_completed', {
            payoutId: payout._id,
            amount: netAmount,
            method: payout.method.details
          });
        }, payoutMethod.type === 'bank' ? 5000 : 1000); // Simulate processing time

      } catch (error) {
        console.error('Payout processing error:', error);
      }
    }, 1000);

    res.status(201).json({ 
      message: 'Payout requested successfully', 
      payout: {
        id: payout._id,
        amount: payout.amount,
        fee: payout.fee,
        netAmount: payout.netAmount,
        expectedCompletion: payout.expectedCompletionDate,
        status: payout.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payout history
router.get('/history', authenticateDriver, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const payouts = await Payout.find({ driverId: req.driver.driverId })
      .sort({ requestedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payout.countDocuments({ driverId: req.driver.driverId });

    res.json({
      payouts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayouts: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all payouts
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, startDate, endDate } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.requestedAt = {};
      if (startDate) filter.requestedAt.$gte = new Date(startDate);
      if (endDate) filter.requestedAt.$lte = new Date(endDate);
    }

    const payouts = await Payout.find(filter)
      .populate('driverId', 'firstName lastName email phone')
      .sort({ requestedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payout.countDocuments(filter);

    // Calculate totals
    const summary = await Payout.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalFees: { $sum: '$fee' },
          totalNet: { $sum: '$netAmount' }
        }
      }
    ]);

    res.json({
      payouts,
      summary: summary[0] || { totalAmount: 0, totalFees: 0, totalNet: 0 },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayouts: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Update payout status
router.put('/admin/:payoutId/status', authenticateAdmin, async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status, adminNotes, failureReason } = req.body;

    const updateData = {
      status,
      adminNotes,
      processedBy: req.admin.adminId
    };

    if (status === 'processing') {
      updateData.processedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'failed') {
      updateData.failureReason = failureReason;
      
      // Refund the amount to driver's pending balance
      const payout = await Payout.findById(payoutId);
      if (payout) {
        await Driver.findByIdAndUpdate(payout.driverId, {
          $inc: { 'earnings.pending': payout.amount }
        });
      }
    }

    const payout = await Payout.findByIdAndUpdate(
      payoutId,
      updateData,
      { new: true }
    ).populate('driverId', 'firstName lastName');

    // Notify driver
    req.app.get('io').to(`driver_${payout.driverId._id}`).emit('payout_status_updated', {
      payoutId: payout._id,
      status: payout.status,
      adminNotes: payout.adminNotes
    });

    res.json({ message: 'Payout status updated', payout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to mask sensitive details
function getMaskedDetails(payoutMethod) {
  if (payoutMethod.type === 'bank') {
    return `${payoutMethod.bankDetails.bankName} ••••${payoutMethod.bankDetails.accountNumber?.slice(-4)}`;
  } else if (payoutMethod.type === 'debit') {
    return `Debit ••••${payoutMethod.externalDetails.last4}`;
  } else {
    return `${payoutMethod.type} ${payoutMethod.externalDetails.email}`;
  }
}

module.exports = router;

// package.json
{
  "name": "faded-skies-backend",
  "version": "1.0.0",
  "description": "Backend API for Faded Skies Cannabis Delivery Platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "seed": "node scripts/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.4",
    "mongoose": "^8.0.3",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "express-validator": "^7.0.1",
    "multer": "^1.4.5",
    "cloudinary": "^1.41.0",
    "nodemailer": "^6.9.7",
    "twilio": "^4.19.0",
    "stripe": "^14.9.0",
    "moment": "^2.29.4",
    "geolib": "^3.3.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}

// .env.example
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/faded_skies

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# External Services
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Email Service (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Maps API (for geocoding and distance calculations)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Push Notifications (Firebase)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# Redis (for caching - optional)
REDIS_URL=redis://localhost:6379

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Security
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002

// scripts/seed.js - Database seeding script
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/faded_skies');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Driver.deleteMany({}),
      Admin.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({})
    ]);

    // Create admin user
    const admin = new Admin({
      email: 'admin@fadedskies.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'super_admin',
      permissions: []
    });
    await admin.save();
    console.log('Admin user created');

    // Create sample customers
    const customers = await User.create([
      {
        email: 'sarah.j@example.com',
        password: 'password123',
        phone: '(512) 555-0456',
        firstName: 'Sarah',
        lastName: 'Johnson',
        dateOfBirth: new Date('1990-05-15'),
        addresses: [{
          street: '789 Oak Street',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          coordinates: { lat: 30.2849, lng: -97.7341 },
          isDefault: true
        }],
        isEmailVerified: true,
        medicalRecommendation: {
          hasRecommendation: true,
          verificationStatus: 'verified'
        }
      },
      {
        email: 'mike.r@example.com',
        password: 'password123',
        phone: '(512) 555-0789',
        firstName: 'Mike',
        lastName: 'Rodriguez',
        dateOfBirth: new Date('1985-08-22'),
        addresses: [{
          street: '456 Pine Ave',
          city: 'Austin',
          state: 'TX',
          zipCode: '78704',
          coordinates: { lat: 30.2518, lng: -97.7595 },
          isDefault: true
        }],
        isEmailVerified: true,
        medicalRecommendation: {
          hasRecommendation: true,
          verificationStatus: 'verified'
        }
      }
    ]);
    console.log('Sample customers created');

    // Create sample drivers
    const drivers = await Driver.create([
      {
        email: 'marcus.chen@driver.com',
        password: 'driver123',
        phone: '(512) 555-0123',
        firstName: 'Marcus',
        lastName: 'Chen',
        dateOfBirth: new Date('1988-03-10'),
        driversLicense: {
          number: 'DL123456789',
          state: 'TX',
          expiryDate: new Date('2026-03-10'),
          isVerified: true
        },
        vehicle: {
          make: 'Toyota',
          model: 'Prius',
          year: 2022,
          color: 'Blue',
          licensePlate: 'ABC789'
        },
        status: 'approved',
        rating: 4.8,
        totalDeliveries: 1247,
        earnings: {
          total: 15680.50,
          today: 156.50,
          week: 892.30,
          month: 3420.75,
          pending: 156.50,
          breakdown: {
            basePay: 7440.00,
            mileagePay: 3240.50,
            tips: 5000.00
          },
          totalMilesDriven: 6481
        },
        currentLocation: {
          lat: 30.2672,
          lng: -97.7431
        }
      },
      {
        email: 'alex.kim@driver.com',
        password: 'driver123',
        phone: '(512) 555-0987',
        firstName: 'Alex',
        lastName: 'Kim',
        dateOfBirth: new Date('1992-07-18'),
        driversLicense: {
          number: 'DL987654321',
          state: 'TX',
          expiryDate: new Date('2027-07-18'),
          isVerified: true
        },
        vehicle: {
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          color: 'Silver',
          licensePlate: 'XYZ456'
        },
        status: 'approved',
        rating: 4.9,
        totalDeliveries: 856,
        currentLocation: {
          lat: 30.3072,
          lng: -97.7531
        }
      }
    ]);
    console.log('Sample drivers created');

    // Create sample products
    const products = await Product.create([
      {
        name: 'Purple Haze',
        category: 'flower',
        strain: {
          name: 'Purple Haze',
          type: 'sativa',
          genetics: 'Purple Thai x Haze'
        },
        potency: { thc: 18.5, cbd: 0.8 },
        description: 'A classic sativa strain with energizing effects',
        effects: ['energetic', 'creative', 'euphoric'],
        flavors: ['sweet', 'berry', 'earthy'],
        prices: [
          { unit: 'gram', quantity: 1, price: 15.00, inStock: true, stockQuantity: 50 },
          { unit: 'eighth', quantity: 3.5, price: 45.00, inStock: true, stockQuantity: 25 },
          { unit: 'quarter', quantity: 7, price: 80.00, inStock: true, stockQuantity: 12 }
        ]
      },
      {
        name: 'Indica Gummies',
        category: 'edibles',
        potency: { thc: 10, cbd: 2 },
        description: 'Relaxing gummies perfect for evening use',
        effects: ['relaxing', 'sleepy', 'pain-relief'],
        flavors: ['cherry', 'grape'],
        prices: [
          { unit: 'pack', quantity: 10, price: 25.00, inStock: true, stockQuantity: 100 }
        ]
      },
      {
        name: 'OG Kush Live Resin',
        category: 'concentrates',
        strain: {
          name: 'OG Kush',
          type: 'hybrid'
        },
        potency: { thc: 78.2, cbd: 1.2 },
        description: 'Premium live resin with full spectrum terpenes',
        effects: ['relaxing', 'euphoric', 'creative'],
        flavors: ['pine', 'citrus', 'earthy'],
        prices: [
          { unit: 'gram', quantity: 1, price: 60.00, inStock: true, stockQuantity: 15 }
        ]
      }
    ]);
    console.log('Sample products created');

    console.log('Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@fadedskies.com / admin123');
    console.log('Driver: marcus.chen@driver.com / driver123');
    console.log('Customer: sarah.j@example.com / password123');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;