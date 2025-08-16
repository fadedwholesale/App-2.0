import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import driverRoutes from './routes/drivers';
import adminRoutes from './routes/admin';
import adminUsersRoutes from './routes/admin/users';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import notificationRoutes from './routes/notifications';

// Import middleware
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Import socket handlers
import { initializeSocket } from './socket/socketHandlers';

// Import services
import { connectRedis } from './services/redis';
import { initializeJobs } from './services/jobs';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/drivers', authenticateToken, driverRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize Socket.IO
initializeSocket(io);

// Initialize services
async function initializeServices() {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Initialize background jobs
    await initializeJobs();
    logger.info('Background jobs initialized');

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Socket.IO enabled`);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📋 API Documentation: http://localhost:${PORT}/health`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

function gracefulShutdown() {
  logger.info('Received shutdown signal, closing server gracefully...');
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close server after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Start the server
startServer();

export { io };
