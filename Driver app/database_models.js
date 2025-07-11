// models/User.js - Customer model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  instructions: String,
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  
  // ID verification
  idVerification: {
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    idType: String, // 'drivers_license', 'passport', etc.
    idNumber: String,
    verifiedAt: Date,
    rejectionReason: String
  },

  // Medical recommendation
  medicalRecommendation: {
    hasRecommendation: { type: Boolean, default: false },
    recommendationNumber: String,
    expiryDate: Date,
    issuingDoctor: String,
    verificationStatus: { type: String, enum: ['pending', 'verified', 'expired'], default: 'pending' }
  },

  // Addresses
  addresses: [addressSchema],

  // Payment methods
  paymentMethods: [{
    id: String,
    type: { type: String, enum: ['card', 'bank', 'apple_pay', 'google_pay'] },
    last4: String,
    expiryMonth: Number,
    expiryYear: Number,
    isDefault: { type: Boolean, default: false }
  }],

  // Preferences
  preferences: {
    notifications: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      newProducts: { type: Boolean, default: false }
    },
    deliveryInstructions: String
  },

  // Order history
  orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  
  // Account status
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: Date
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

// models/Driver.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  color: { type: String, required: true },
  licensePlate: { type: String, required: true },
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    isVerified: { type: Boolean, default: false }
  },
  registration: {
    number: String,
    expiryDate: Date,
    isVerified: { type: Boolean, default: false }
  }
});

const earningsSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  today: { type: Number, default: 0 },
  week: { type: Number, default: 0 },
  month: { type: Number, default: 0 },
  year: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  
  // Detailed breakdown
  breakdown: {
    basePay: { type: Number, default: 0 },
    mileagePay: { type: Number, default: 0 },
    tips: { type: Number, default: 0 },
    bonuses: { type: Number, default: 0 }
  },
  
  // Mileage tracking
  totalMilesDriven: { type: Number, default: 0 },
  todayMiles: { type: Number, default: 0 }
});

const driverSchema = new mongoose.Schema({
  // Personal Information
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  
  // Driver's License
  driversLicense: {
    number: { type: String, required: true },
    state: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    isVerified: { type: Boolean, default: false }
  },

  // Background Check
  backgroundCheck: {
    status: { type: String, enum: ['pending', 'in_progress', 'approved', 'rejected'], default: 'pending' },
    completedAt: Date,
    expiryDate: Date,
    provider: String
  },

  // Vehicle Information
  vehicle: vehicleSchema,

  // Profile
  profilePhoto: String,
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalDeliveries: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  
  // Current Status
  isOnline: { type: Boolean, default: false },
  currentLocation: {
    lat: Number,
    lng: Number,
    accuracy: Number,
    heading: Number,
    speed: Number
  },
  
  // Work Schedule
  schedule: {
    isScheduled: { type: Boolean, default: false },
    shifts: [{
      dayOfWeek: { type: Number, min: 0, max: 6 }, // 0 = Sunday
      startTime: String, // "09:00"
      endTime: String,   // "17:00"
      isActive: { type: Boolean, default: true }
    }]
  },

  // Earnings
  earnings: earningsSchema,

  // Payout Settings
  payoutSettings: {
    method: { type: String, enum: ['instant', 'daily', 'weekly'], default: 'weekly' },
    bankAccount: {
      accountNumber: String,
      routingNumber: String,
      bankName: String,
      accountHolderName: String,
      isVerified: { type: Boolean, default: false }
    },
    instantPayFee: { type: Number, default: 0.50 }
  },

  // Performance Metrics
  performance: {
    acceptanceRate: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 0 }
  },

  // Account Status
  status: { type: String, enum: ['pending', 'approved', 'suspended', 'deactivated'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActiveAt: Date,
  approvedAt: Date
});

driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

driverSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate rating
driverSchema.methods.calculateRating = function() {
  if (this.totalRatings === 0) return 0;
  return Math.round((this.rating * this.totalRatings) / this.totalRatings * 10) / 10;
};

module.exports = mongoose.model('Driver', driverSchema);

// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true }, // 'flower', 'edibles', 'concentrates', etc.
  strain: String,
  potency: {
    thc: Number,
    cbd: Number
  },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true }, // 'gram', 'eighth', 'piece', etc.
  price: { type: Number, required: true },
  total: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: { type: String, unique: true },
  
  // Customer information
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: {
    firstName: String,
    lastName: String,
    phone: String,
    email: String
  },

  // Driver information
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  driver: {
    firstName: String,
    lastName: String,
    phone: String,
    vehicle: {
      make: String,
      model: String,
      color: String,
      licensePlate: String
    }
  },

  // Order items
  items: [orderItemSchema],
  
  // Pricing
  subtotal: { type: Number, required: true },
  taxes: { type: Number, required: true },
  deliveryFee: { type: Number, default: 5.00 },
  tip: { type: Number, default: 0 },
  total: { type: Number, required: true },

  // Addresses
  pickupAddress: {
    name: String, // Dispensary name
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    phone: String
  },
  
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    instructions: String
  },

  // Order status and timing
  status: {
    type: String,
    enum: ['pending', 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed'],
    default: 'pending'
  },
  
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Timing
  placedAt: { type: Date, default: Date.now },
  assignedAt: Date,
  acceptedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,

  // Distance and route
  estimatedDistance: Number, // miles
  actualDistance: Number,
  estimatedDuration: Number, // minutes
  actualDuration: Number,

  // Payment
  paymentMethod: {
    type: { type: String, enum: ['card', 'cash', 'apple_pay', 'google_pay'], required: true },
    last4: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
  },

  // Driver compensation
  driverCompensation: {
    basePay: { type: Number, default: 6.00 },
    mileagePay: Number,
    tip: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    total: Number
  },

  // Tracking and communication
  tracking: {
    driverLocation: {
      lat: Number,
      lng: Number,
      timestamp: Date
    },
    estimatedArrival: Date,
    deliveryPhotos: [String], // URLs to delivery confirmation photos
    signature: String // Base64 encoded signature
  },

  messages: [{
    sender: { type: String, enum: ['customer', 'driver', 'system'] },
    message: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
  }],

  // Ratings and feedback
  customerRating: {
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    submittedAt: Date
  },
  
  driverRating: {
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,
    submittedAt: Date
  },

  // Special instructions
  specialInstructions: String,
  
  // Compliance
  ageVerified: { type: Boolean, default: false },
  idChecked: { type: Boolean, default: false },
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: { type: String, enum: ['customer', 'driver', 'system'] },
  cancelledAt: Date,

  // Admin notes
  adminNotes: String,
  flagged: { type: Boolean, default: false },
  flagReason: String
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find the last order of the day
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const lastOrder = await mongoose.model('Order').findOne({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    }).sort({ createdAt: -1 });
    
    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-3));
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `FS${year}${month}${day}${sequence.toString().padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

// models/Admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  
  role: {
    type: String,
    enum: ['super_admin', 'operations_manager', 'customer_service', 'finance'],
    required: true
  },
  
  permissions: [{
    resource: String, // 'orders', 'drivers', 'customers', 'analytics', etc.
    actions: [String] // 'read', 'write', 'delete', 'approve', etc.
  }],
  
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
});

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);

// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['flower', 'edibles', 'concentrates', 'vapes', 'topicals', 'accessories']
  },
  
  // Cannabis-specific info
  strain: {
    name: String,
    type: { type: String, enum: ['indica', 'sativa', 'hybrid'] },
    genetics: String
  },
  
  potency: {
    thc: { type: Number, min: 0, max: 100 },
    cbd: { type: Number, min: 0, max: 100 },
    thca: { type: Number, min: 0, max: 100 },
    cbda: { type: Number, min: 0, max: 100 }
  },
  
  // Product details
  description: String,
  effects: [String], // ['relaxing', 'euphoric', 'creative', etc.]
  flavors: [String], // ['citrus', 'earthy', 'sweet', etc.]
  
  // Pricing and inventory
  prices: [{
    unit: String, // 'gram', 'eighth', 'quarter', 'half', 'ounce', 'piece'
    quantity: Number,
    price: Number,
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0 }
  }],
  
  // Media
  images: [String], // URLs
  
  // Lab results
  labResults: {
    testDate: Date,
    lab: String,
    results: mongoose.Schema.Types.Mixed, // Detailed lab results
    certificate: String // URL to certificate
  },
  
  // Compliance
  complianceInfo: {
    batch: String,
    harvest: String,
    packaged: Date,
    tested: Date,
    uid: String // State tracking UID
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);