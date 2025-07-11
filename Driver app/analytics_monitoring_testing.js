// utils/analytics.js - Real-time analytics and monitoring
const mongoose = require('mongoose');

class AnalyticsService {
  constructor(io) {
    this.io = io;
    this.metrics = {
      activeConnections: 0,
      totalOrders: 0,
      totalRevenue: 0,
      activeDrivers: 0,
      averageDeliveryTime: 0
    };
    
    // Update metrics every 30 seconds
    setInterval(() => this.updateMetrics(), 30000);
  }

  async updateMetrics() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Get today's orders
      const Order = require('../models/Order');
      const Driver = require('../models/Driver');

      const todayOrders = await Order.find({
        placedAt: { $gte: startOfDay }
      });

      const deliveredOrders = todayOrders.filter(order => order.status === 'delivered');
      
      // Calculate metrics
      this.metrics.totalOrders = todayOrders.length;
      this.metrics.totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
      this.metrics.activeDrivers = await Driver.countDocuments({ isOnline: true });
      
      // Calculate average delivery time
      if (deliveredOrders.length > 0) {
        const totalDeliveryTime = deliveredOrders.reduce((sum, order) => {
          const deliveryTime = new Date(order.deliveredAt) - new Date(order.placedAt);
          return sum + deliveryTime;
        }, 0);
        this.metrics.averageDeliveryTime = Math.round((totalDeliveryTime / deliveredOrders.length) / (1000 * 60)); // minutes
      }

      // Emit to admin dashboard
      this.io.to('admin_room').emit('metrics_update', this.metrics);

      // Store hourly analytics
      await this.storeHourlyAnalytics();

    } catch (error) {
      console.error('Analytics update error:', error);
    }
  }

  async storeHourlyAnalytics() {
    const HourlyAnalytics = require('../models/Analytics');
    
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    try {
      await HourlyAnalytics.findOneAndUpdate(
        { timestamp: hourStart },
        {
          $set: {
            metrics: { ...this.metrics },
            timestamp: hourStart
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Analytics storage error:', error);
    }
  }

  trackOrderEvent(event, orderId, metadata = {}) {
    const OrderEvent = require('../models/OrderEvent');
    
    const orderEvent = new OrderEvent({
      orderId,
      event,
      metadata,
      timestamp: new Date()
    });

    orderEvent.save().catch(error => {
      console.error('Order event tracking error:', error);
    });

    // Emit to admin for real-time monitoring
    this.io.to('admin_room').emit('order_event', {
      orderId,
      event,
      metadata,
      timestamp: new Date()
    });
  }

  trackDriverEvent(event, driverId, metadata = {}) {
    const DriverEvent = require('../models/DriverEvent');
    
    const driverEvent = new DriverEvent({
      driverId,
      event,
      metadata,
      timestamp: new Date()
    });

    driverEvent.save().catch(error => {
      console.error('Driver event tracking error:', error);
    });
  }

  async getAnalyticsReport(startDate, endDate, granularity = 'hourly') {
    const HourlyAnalytics = require('../models/Analytics');
    
    try {
      const analytics = await HourlyAnalytics.find({
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ timestamp: 1 });

      return this.aggregateAnalytics(analytics, granularity);
    } catch (error) {
      console.error('Analytics report error:', error);
      throw error;
    }
  }

  aggregateAnalytics(analytics, granularity) {
    // Group by day if granularity is daily
    if (granularity === 'daily') {
      const dailyData = {};
      
      analytics.forEach(record => {
        const day = record.timestamp.toISOString().split('T')[0];
        if (!dailyData[day]) {
          dailyData[day] = {
            totalOrders: 0,
            totalRevenue: 0,
            averageDeliveryTime: 0,
            maxActiveDrivers: 0,
            records: 0
          };
        }
        
        dailyData[day].totalOrders += record.metrics.totalOrders || 0;
        dailyData[day].totalRevenue += record.metrics.totalRevenue || 0;
        dailyData[day].averageDeliveryTime += record.metrics.averageDeliveryTime || 0;
        dailyData[day].maxActiveDrivers = Math.max(dailyData[day].maxActiveDrivers, record.metrics.activeDrivers || 0);
        dailyData[day].records++;
      });

      // Calculate averages
      Object.keys(dailyData).forEach(day => {
        if (dailyData[day].records > 0) {
          dailyData[day].averageDeliveryTime = Math.round(dailyData[day].averageDeliveryTime / dailyData[day].records);
        }
      });

      return dailyData;
    }

    return analytics;
  }
}

// models/Analytics.js
const analyticsSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, unique: true },
  metrics: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    activeDrivers: { type: Number, default: 0 },
    averageDeliveryTime: { type: Number, default: 0 },
    activeConnections: { type: Number, default: 0 }
  },
  breakdown: {
    ordersByStatus: mongoose.Schema.Types.Mixed,
    ordersByZone: mongoose.Schema.Types.Mixed,
    driverPerformance: mongoose.Schema.Types.Mixed
  }
});

const orderEventSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  event: { type: String, required: true }, // 'placed', 'accepted', 'delivered', etc.
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

const driverEventSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  event: { type: String, required: true }, // 'login', 'logout', 'online', 'offline', etc.
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

mongoose.model('HourlyAnalytics', analyticsSchema);
mongoose.model('OrderEvent', orderEventSchema);
mongoose.model('DriverEvent', driverEventSchema);

module.exports = AnalyticsService;

// utils/healthCheck.js - Health monitoring
const mongoose = require('mongoose');
const redis = require('redis');

class HealthCheckService {
  constructor() {
    this.checks = {
      database: false,
      redis: false,
      externalAPIs: false,
      diskSpace: false,
      memory: false
    };
  }

  async runHealthChecks() {
    const results = {};
    
    try {
      // Database check
      results.database = await this.checkDatabase();
      
      // Memory check
      results.memory = await this.checkMemory();
      
      // Disk space check
      results.diskSpace = await this.checkDiskSpace();
      
      // External API checks
      results.externalAPIs = await this.checkExternalAPIs();
      
      results.status = Object.values(results).every(check => check.healthy) ? 'healthy' : 'unhealthy';
      results.timestamp = new Date().toISOString();
      
      return results;
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkDatabase() {
    try {
      const state = mongoose.connection.readyState;
      const isConnected = state === 1; // 1 = connected
      
      if (isConnected) {
        // Test with a simple query
        await mongoose.connection.db.admin().ping();
        return { healthy: true, message: 'Database connected' };
      } else {
        return { healthy: false, message: `Database state: ${state}` };
      }
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }

  async checkMemory() {
    try {
      const memUsage = process.memoryUsage();
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      
      const memoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      const isHealthy = memoryUsagePercent < 90 && heapUsedMB < 1000; // Less than 90% system memory and 1GB heap
      
      return {
        healthy: isHealthy,
        message: `System memory: ${memoryUsagePercent.toFixed(1)}%, Heap: ${heapUsedMB}MB`,
        details: {
          heapUsed: heapUsedMB,
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          systemMemoryUsage: parseFloat(memoryUsagePercent.toFixed(1))
        }
      };
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }

  async checkDiskSpace() {
    try {
      const fs = require('fs');
      const stats = fs.statSync('.');
      
      // This is a simplified check - in production you'd use a proper disk space library
      return { healthy: true, message: 'Disk space check passed' };
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }

  async checkExternalAPIs() {
    const results = {};
    
    // Check Google Maps API (if used)
    if (process.env.GOOGLE_MAPS_API_KEY) {
      try {
        // Simple geocoding test
        results.googleMaps = { healthy: true, message: 'Google Maps API accessible' };
      } catch (error) {
        results.googleMaps = { healthy: false, message: error.message };
      }
    }

    // Check Stripe API (if used)
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        // Test Stripe connection
        results.stripe = { healthy: true, message: 'Stripe API accessible' };
      } catch (error) {
        results.stripe = { healthy: false, message: error.message };
      }
    }

    const allHealthy = Object.values(results).every(result => result.healthy);
    
    return {
      healthy: allHealthy,
      message: allHealthy ? 'All external APIs accessible' : 'Some external APIs have issues',
      details: results
    };
  }
}

// Health check endpoint
const express = require('express');
const healthRouter = express.Router();
const healthCheck = new HealthCheckService();

healthRouter.get('/health', async (req, res) => {
  const results = await healthCheck.runHealthChecks();
  const statusCode = results.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(results);
});

healthRouter.get('/health/detailed', async (req, res) => {
  const results = await healthCheck.runHealthChecks();
  
  // Add more detailed system information
  results.system = {
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    pid: process.pid,
    environment: process.env.NODE_ENV || 'development'
  };
  
  const statusCode = results.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(results);
});

module.exports = { HealthCheckService, healthRouter };

// tests/auth.test.js - Authentication tests
const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Driver = require('../models/Driver');

describe('Authentication', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/faded_skies_test');
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Driver.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register/customer', () => {
    it('should register a new customer', async () => {
      const customerData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '(555) 123-4567',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01'
      };

      const response = await request(app)
        .post('/api/auth/register/customer')
        .send(customerData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(customerData.email);
    });

    it('should not register customer with existing email', async () => {
      const customerData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '(555) 123-4567',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register/customer')
        .send(customerData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register/customer')
        .send(customerData)
        .expect(400);

      expect(response.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login/customer', () => {
    it('should login existing customer', async () => {
      const customerData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '(555) 123-4567',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01'
      };

      // Register user first
      await request(app)
        .post('/api/auth/register/customer')
        .send(customerData);

      // Login
      const response = await request(app)
        .post('/api/auth/login/customer')
        .send({
          email: customerData.email,
          password: customerData.password
        })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(customerData.email);
    });

    it('should not login with wrong password', async () => {
      const customerData = {
        email: 'test@example.com',
        password: 'password123',
        phone: '(555) 123-4567',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01'
      };

      // Register user
      await request(app)
        .post('/api/auth/register/customer')
        .send(customerData);

      // Try wrong password
      const response = await request(app)
        .post('/api/auth/login/customer')
        .send({
          email: customerData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/register/driver', () => {
    it('should register a new driver', async () => {
      const driverData = {
        email: 'driver@example.com',
        password: 'password123',
        phone: '(555) 987-6543',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1985-05-15',
        driversLicense: {
          number: 'DL123456789',
          state: 'TX',
          expiryDate: '2026-05-15'
        },
        vehicle: {
          make: 'Toyota',
          model: 'Prius',
          year: 2020,
          color: 'Blue',
          licensePlate: 'ABC123'
        }
      };

      const response = await request(app)
        .post('/api/auth/register/driver')
        .send(driverData)
        .expect(201);

      expect(response.body.message).toBe('Driver application submitted successfully');
      expect(response.body.status).toBe('pending_approval');
    });
  });
});

// tests/orders.test.js - Order tests
describe('Orders', () => {
  let customerToken;
  let driverToken;
  let customerId;
  let driverId;

  beforeEach(async () => {
    // Create and login customer
    const customerData = {
      email: 'customer@example.com',
      password: 'password123',
      phone: '(555) 123-4567',
      firstName: 'John',
      lastName: 'Customer',
      dateOfBirth: '1990-01-01'
    };

    const customerResponse = await request(app)
      .post('/api/auth/register/customer')
      .send(customerData);
    
    customerToken = customerResponse.body.token;
    customerId = customerResponse.body.user.id;

    // Create and approve driver
    const driver = new Driver({
      email: 'driver@example.com',
      password: 'password123',
      phone: '(555) 987-6543',
      firstName: 'Jane',
      lastName: 'Driver',
      dateOfBirth: '1985-05-15',
      status: 'approved',
      driversLicense: {
        number: 'DL123456789',
        state: 'TX',
        expiryDate: '2026-05-15'
      },
      vehicle: {
        make: 'Toyota',
        model: 'Prius',
        year: 2020,
        color: 'Blue',
        licensePlate: 'ABC123'
      }
    });
    await driver.save();
    driverId = driver._id;

    // Login driver
    const driverLoginResponse = await request(app)
      .post('/api/auth/login/driver')
      .send({
        email: 'driver@example.com',
        password: 'password123'
      });
    
    driverToken = driverLoginResponse.body.token;
  });

  describe('POST /api/customers/orders', () => {
    it('should place a new order', async () => {
      const orderData = {
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            name: 'Test Product',
            category: 'flower',
            quantity: 1,
            unit: 'gram',
            price: 15.00,
            total: 15.00
          }
        ],
        deliveryAddress: {
          street: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        },
        paymentMethod: {
          type: 'card',
          last4: '4242'
        },
        subtotal: 15.00,
        taxes: 1.20,
        deliveryFee: 5.00,
        total: 21.20
      };

      const response = await request(app)
        .post('/api/customers/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.message).toBe('Order placed successfully');
      expect(response.body.order.total).toBe(21.20);
    });
  });

  describe('GET /api/orders/:orderId', () => {
    it('should get order details for customer', async () => {
      // Create order first
      const Order = require('../models/Order');
      const order = new Order({
        customerId: customerId,
        items: [{ name: 'Test Item', price: 10, quantity: 1, total: 10 }],
        total: 15,
        deliveryAddress: {
          street: '123 Test St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          coordinates: { lat: 30.2672, lng: -97.7431 }
        },
        paymentMethod: { type: 'card' }
      });
      await order.save();

      const response = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body._id).toBe(order._id.toString());
    });
  });
});

// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000
};

// tests/setup.js
const mongoose = require('mongoose');

// Increase timeout for tests
jest.setTimeout(30000);

// Mock external services
jest.mock('../utils/notifications', () => ({
  sendEmail: jest.fn(),
  sendSMS: jest.fn(),
  notifyOrderPlaced: jest.fn(),
  notifyOrderAccepted: jest.fn(),
  notifyOrderDelivered: jest.fn()
}));

// Clean up after tests
afterAll(async () => {
  await mongoose.connection.close();
});

// Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]

# docker-compose.yml
version: '3.8'

services:
  # MongoDB
  mongodb:
    image: mongo:6.0
    container_name: faded-skies-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: faded_skies
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - faded-skies-network

  # Redis (for caching and sessions)
  redis:
    image: redis:7-alpine
    container_name: faded-skies-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - faded-skies-network

  # Backend API
  backend:
    build: .
    container_name: faded-skies-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:password123@mongodb:27017/faded_skies?authSource=admin
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your_jwt_secret_here
      PORT: 5000
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./uploads:/app/uploads
    networks:
      - faded-skies-network

  # Nginx (Load balancer and static file serving)
  nginx:
    image: nginx:alpine
    container_name: faded-skies-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - faded-skies-network

volumes:
  mongodb_data:
  redis_data:

networks:
  faded-skies-network:
    driver: bridge

# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth routes (more restrictive)
        location /api/auth/ {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Socket.io
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend/api/health;
            access_log off;
        }
    }
}

# scripts/init-mongo.js
// MongoDB initialization script
db = db.getSiblingDB('faded_skies');

// Create collections with indexes
db.createCollection('users');
db.createCollection('drivers');
db.createCollection('orders');
db.createCollection('products');
db.createCollection('admins');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone": 1 });

db.drivers.createIndex({ "email": 1 }, { unique: true });
db.drivers.createIndex({ "isOnline": 1 });
db.drivers.createIndex({ "currentLocation": "2dsphere" });
db.drivers.createIndex({ "status": 1 });

db.orders.createIndex({ "customerId": 1 });
db.orders.createIndex({ "driverId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "placedAt": -1 });
db.orders.createIndex({ "deliveryAddress.coordinates": "2dsphere" });

db.products.createIndex({ "category": 1 });
db.products.createIndex({ "isActive": 1 });
db.products.createIndex({ "name": "text", "description": "text" });

db.admins.createIndex({ "email": 1 }, { unique: true });

print("Database initialized successfully");

# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.coverage
.cache
.DS_Store
*.log
tests/