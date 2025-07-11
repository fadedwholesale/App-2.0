// package.json
{
  "name": "faded-skies-backend",
  "version": "1.0.0",
  "description": "Cannabis delivery platform backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "npx sequelize-cli db:migrate",
    "db:seed": "npx sequelize-cli db:seed:all",
    "db:reset": "npx sequelize-cli db:drop && npx sequelize-cli db:create && npm run db:migrate && npm run db:seed",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "build": "echo 'No build step required'",
    "docker:build": "docker build -t faded-skies-api .",
    "docker:run": "docker run -p 3000:3000 faded-skies-api"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^6.7.0",
    "rate-limit-redis": "^3.0.1",
    "socket.io": "^4.7.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.9.2",
    "sequelize": "^6.32.1",
    "pg": "^8.11.1",
    "pg-hstore": "^2.3.4",
    "redis": "^4.6.7",
    "stripe": "^12.11.0",
    "multer": "^1.4.5-lts.1",
    "multer-s3": "^3.0.1",
    "aws-sdk": "^2.1408.0",
    "nodemailer": "^6.9.3",
    "handlebars": "^4.7.7",
    "firebase-admin": "^11.9.0",
    "@googlemaps/google-maps-services-js": "^3.3.35",
    "axios": "^1.4.0",
    "dotenv": "^16.3.1",
    "winston": "^3.9.0",
    "express-validator": "^7.0.1",
    "cookie-parser": "^1.4.6",
    "express-session": "^1.17.3",
    "connect-redis": "^7.1.0",
    "uuid": "^9.0.0",
    "moment": "^2.29.4",
    "bull": "^4.10.4",
    "sharp": "^0.32.1",
    "@sentry/node": "^7.57.0",
    "newrelic": "^10.3.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.1",
    "supertest": "^6.3.3",
    "eslint": "^8.44.0",
    "eslint-config-standard": "^17.1.0",
    "sequelize-cli": "^6.6.1",
    "@types/node": "^20.4.2"
  },
  "keywords": [
    "cannabis",
    "delivery",
    "api",
    "node.js",
    "express",
    "real-time"
  ],
  "author": "Faded Skies Team",
  "license": "UNLICENSED",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/faded-skies/backend.git"
  }
}

// ===================================
// server.js - Main server entry point
// ===================================

require('dotenv').config();
require('newrelic'); // Must be first

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');

// Internal imports
const { sequelize } = require('./src/models');
const redis = require('./src/config/redis');
const logger = require('./src/utils/logger');
const initializeWebSocket = require('./src/websocket');
const errorHandler = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// Route imports
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const productRoutes = require('./src/routes/products');
const orderRoutes = require('./src/routes/orders');
const paymentRoutes = require('./src/routes/payments');
const supportRoutes = require('./src/routes/support');
const uploadRoutes = require('./src/routes/uploads');
const complianceRoutes = require('./src/routes/compliance');
const healthRoutes = require('./src/routes/health');
const webhookRoutes = require('./src/routes/webhooks');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket
const io = initializeWebSocket(server);
app.set('io', io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing middleware
app.use('/webhooks', express.raw({ type: 'application/json' })); // Raw for webhooks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/health', healthRoutes);
app.use('/webhooks', webhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Faded Skies API',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Test Redis connection
    await redis.ping();
    logger.info('Redis connection established successfully');

    // Sync database (in production, use migrations)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      logger.info('Database synchronized');
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Faded Skies API server running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📚 API Documentation: http://localhost:${PORT}/docs`);
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(async () => {
    try {
      await sequelize.close();
      await redis.quit();
      logger.info('Server shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  server.close(async () => {
    try {
      await sequelize.close();
      await redis.quit();
      logger.info('Server shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

// Start the server
startServer();

module.exports = { app, server };

// ===================================
// src/config/database.js
// ===================================

require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'faded_skies_dev',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'faded_skies_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

// ===================================
// src/config/redis.js
// ===================================

const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis server refused connection');
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

client.on('error', (err) => {
  logger.error('Redis error:', err);
});

client.on('connect', () => {
  logger.info('Connected to Redis');
});

client.on('ready', () => {
  logger.info('Redis is ready');
});

client.on('end', () => {
  logger.info('Redis connection ended');
});

// Connect to Redis
(async () => {
  try {
    await client.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
})();

module.exports = client;

// ===================================
// src/models/index.js
// ===================================

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

// ===================================
// src/models/User.js
// ===================================

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    idVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    idVerificationStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    idDocumentUrl: {
      type: DataTypes.STRING
    },
    rewardsBalance: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    accountStatus: {
      type: DataTypes.ENUM('active', 'suspended', 'closed'),
      defaultValue: 'active'
    },
    role: {
      type: DataTypes.ENUM('customer', 'driver', 'agent', 'admin'),
      defaultValue: 'customer'
    },
    stripeCustomerId: {
      type: DataTypes.STRING
    },
    fcmTokens: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    lastLoginAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true
  });

  User.associate = function(models) {
    User.hasMany(models.DeliveryAddress, {
      foreignKey: 'userId',
      as: 'addresses'
    });
    User.hasMany(models.PaymentMethod, {
      foreignKey: 'userId',
      as: 'paymentMethods'
    });
    User.hasMany(models.Order, {
      foreignKey: 'userId',
      as: 'orders'
    });
    User.hasMany(models.RewardsTransaction, {
      foreignKey: 'userId',
      as: 'rewardsTransactions'
    });
    User.hasMany(models.SupportTicket, {
      foreignKey: 'userId',
      as: 'supportTickets'
    });
  };

  return User;
};

// ===================================
// src/models/Product.js
// ===================================

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2)
    },
    thcContent: {
      type: DataTypes.STRING
    },
    cbdContent: {
      type: DataTypes.STRING
    },
    strainType: {
      type: DataTypes.ENUM('sativa', 'indica', 'hybrid')
    },
    effects: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    labTested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    labResultsUrl: {
      type: DataTypes.STRING
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: true
  });

  Product.associate = function(models) {
    Product.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    Product.hasMany(models.ProductImage, {
      foreignKey: 'productId',
      as: 'images'
    });
    Product.hasMany(models.OrderItem, {
      foreignKey: 'productId'
    });
  };

  return Product;
};

// ===================================
// src/models/Order.js
// ===================================

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    deliveryAddressId: {
      type: DataTypes.UUID,
      references: {
        model: 'delivery_addresses',
        key: 'id'
      }
    },
    paymentMethodId: {
      type: DataTypes.UUID,
      references: {
        model: 'payment_methods',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'payment_failed'),
      defaultValue: 'pending'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    estimatedDeliveryTime: {
      type: DataTypes.INTEGER // minutes
    },
    specialInstructions: {
      type: DataTypes.TEXT
    },
    driverId: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    deliveredAt: {
      type: DataTypes.DATE
    },
    paymentIntentId: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: true
  });

  Order.associate = function(models) {
    Order.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'customer'
    });
    Order.belongsTo(models.User, {
      foreignKey: 'driverId',
      as: 'driver'
    });
    Order.belongsTo(models.DeliveryAddress, {
      foreignKey: 'deliveryAddressId',
      as: 'deliveryAddress'
    });
    Order.belongsTo(models.PaymentMethod, {
      foreignKey: 'paymentMethodId',
      as: 'paymentMethod'
    });
    Order.hasMany(models.OrderItem, {
      foreignKey: 'orderId',
      as: 'items'
    });
    Order.hasMany(models.OrderTracking, {
      foreignKey: 'orderId',
      as: 'tracking'
    });
  };

  return Order;
};

// ===================================
// src/middleware/auth.js
// ===================================

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.userId);
    
    if (!user || user.accountStatus !== 'active') {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
};

const requireIDVerification = (req, res, next) => {
  if (!req.user.idVerified) {
    return res.status(403).json({ 
      error: 'ID verification required to perform this action',
      code: 'ID_VERIFICATION_REQUIRED',
      redirectTo: '/id-verification'
    });
  }
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(payload.userId);
      
      if (user && user.accountStatus === 'active') {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireIDVerification,
  requireRole,
  optionalAuth
};

// ===================================
// src/routes/auth.js
// ===================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const EmailService = require('../services/emailService');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Register validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('fullName').isLength({ min: 2, max: 100 }).trim(),
  body('phone').matches(/^\(\d{3}\) \d{3}-\d{4}$/),
  body('dateOfBirth').isISO8601().toDate()
];

// Login validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Register endpoint
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, fullName, phone, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Calculate age
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    // Validate minimum age (21 for cannabis)
    if (age < 21) {
      return res.status(400).json({ 
        error: 'Must be 21 or older to register',
        code: 'AGE_REQUIREMENT_NOT_MET'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      fullName,
      phone,
      dateOfBirth,
      age
    });

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(user);
    } catch (emailError) {
      logger.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`New user registered: ${user.id} (${user.email})`);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        age: user.age,
        idVerified: user.idVerified,
        rewardsBalance: user.rewardsBalance
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ 
        error: 'Account suspended or closed',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`User logged in: ${user.id} (${user.email})`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        age: user.age,
        idVerified: user.idVerified,
        rewardsBalance: user.rewardsBalance,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: 'Internal server error'
    });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token required',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    const payload = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (payload.type !== 'refresh') {
      return res.status(401).json({ 
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    const user = await User.findByPk(payload.userId);
    if (!user || user.accountStatus !== 'active') {
      return res.status(401).json({ 
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      accessToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({ 
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // In a more sophisticated setup, you might blacklist the token
  // For now, we'll just return success and let the client handle it
  res.json({ message: 'Logout successful' });
});

// Forgot password endpoint
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    
    // Always return success to prevent email enumeration
    if (user) {
      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // In production, save the reset token to database and send email
      logger.info(`Password reset requested for user: ${user.id}`);
      
      // TODO: Send password reset email
      // await EmailService.sendPasswordResetEmail(user, resetToken);
    }

    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Password reset request failed',
      message: 'Internal server error'
    });
  }
});

module.exports = router;