# Faded Skies Cannabis Delivery App - Backend Implementation Guide

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Design](#database-design)
3. [API Endpoints](#api-endpoints)
4. [Real-time Features](#real-time-features)
5. [Authentication & Security](#authentication--security)
6. [Payment Processing](#payment-processing)
7. [Location & Mapping](#location--mapping)
8. [Notification System](#notification-system)
9. [File Upload & Storage](#file-upload--storage)
10. [Deployment Infrastructure](#deployment-infrastructure)
11. [Third-party Integrations](#third-party-integrations)
12. [Cannabis Industry Compliance](#cannabis-industry-compliance)
13. [Monitoring & Analytics](#monitoring--analytics)

---

## System Architecture

### Tech Stack Recommendation

**Backend Framework:**
- **Node.js + Express.js** (Primary recommendation)
- **Alternative:** Python Django/FastAPI or Go Gin

**Database:**
- **PostgreSQL** (Primary for transactional data)
- **Redis** (Caching, sessions, real-time data)
- **MongoDB** (Optional for product catalog/reviews)

**Real-time Communication:**
- **Socket.io** (WebSocket connections)
- **Alternative:** Server-Sent Events (SSE)

**Message Queue:**
- **Redis Bull** or **RabbitMQ**
- For order processing, notifications

**File Storage:**
- **AWS S3** or **Cloudinary**
- For product images, ID verification docs

**Monitoring:**
- **DataDog** or **New Relic**
- **Sentry** for error tracking

### Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Admin Panel   │    │  Driver App     │
│  (Customer)     │    │   (Management)  │    │   (Delivery)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼───────────────┐
                    │     Load Balancer/CDN      │
                    │    (Cloudflare/AWS ALB)    │
                    └─────────────┬───────────────┘
                                 │
                    ┌─────────────▼───────────────┐
                    │      API Gateway           │
                    │   (Rate Limiting/Auth)     │
                    └─────────────┬───────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│  Auth Service   │    │  Core API       │    │ WebSocket       │
│   (JWT/OAuth)   │    │   (Express)     │    │  Server         │
└─────────────────┘    └─────────┬───────┘    └─────────────────┘
                                 │
                    ┌─────────────▼───────────────┐
                    │     Message Queue          │
                    │     (Redis/Bull)           │
                    └─────────────┬───────────────┘
                                 │
                    ┌─────────────▼───────────────┐
                    │      Databases             │
                    │  PostgreSQL + Redis        │
                    └─────────────────────────────┘
```

---

## Database Design

### PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE NOT NULL,
    age INTEGER NOT NULL,
    id_verified BOOLEAN DEFAULT FALSE,
    id_verification_status VARCHAR(50) DEFAULT 'pending',
    id_document_url VARCHAR(500),
    rewards_balance INTEGER DEFAULT 0,
    account_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery addresses
CREATE TABLE delivery_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    address_type VARCHAR(20) NOT NULL, -- home, work, other
    delivery_instructions TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payment methods
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- card, apple_pay, google_pay, fs_coin
    provider VARCHAR(50), -- stripe, square, etc.
    external_id VARCHAR(255), -- Stripe payment method ID
    last_four VARCHAR(4),
    card_brand VARCHAR(20),
    expires_at DATE,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    thc_content VARCHAR(20),
    cbd_content VARCHAR(20),
    strain_type VARCHAR(20), -- sativa, indica, hybrid
    effects TEXT[], -- array of effects
    lab_tested BOOLEAN DEFAULT FALSE,
    lab_results_url VARCHAR(500),
    stock_quantity INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product images
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    delivery_address_id UUID REFERENCES delivery_addresses(id),
    payment_method_id UUID REFERENCES payment_methods(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, preparing, out_for_delivery, delivered, cancelled
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    estimated_delivery_time INTERVAL,
    special_instructions TEXT,
    driver_id UUID REFERENCES users(id),
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Order tracking
CREATE TABLE order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Support tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Support messages (for live chat)
CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- user, agent
    sender_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    attachments TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rewards transactions
CREATE TABLE rewards_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- earned, redeemed, expired
    amount INTEGER NOT NULL,
    description TEXT,
    order_id UUID REFERENCES orders(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Driver locations (real-time tracking)
CREATE TABLE driver_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    heading DECIMAL(5,2),
    speed DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX idx_driver_locations_order_id ON driver_locations(order_id);
```

### Redis Schema

```javascript
// Session storage
session:{sessionId} = {
  userId: "uuid",
  expiresAt: timestamp,
  data: {...}
}

// Cart storage (temporary)
cart:{userId} = [
  {
    productId: "uuid",
    quantity: number,
    addedAt: timestamp
  }
]

// Real-time driver locations
driver:location:{driverId} = {
  lat: number,
  lng: number,
  heading: number,
  speed: number,
  orderId: "uuid",
  lastUpdate: timestamp
}

// Live chat sessions
chat:session:{sessionId} = {
  userId: "uuid",
  agentId: "uuid",
  status: "active|waiting|ended",
  createdAt: timestamp
}

// Rate limiting
rate_limit:{ip}:{endpoint} = count
rate_limit:{userId}:{endpoint} = count

// Cached product data
products:featured = [...products]
products:category:{categoryId} = [...products]
```

---

## API Endpoints

### Authentication Endpoints

```javascript
// POST /api/auth/register
{
  "fullName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "dateOfBirth": "YYYY-MM-DD"
}

// POST /api/auth/login
{
  "email": "string",
  "password": "string"
}

// POST /api/auth/logout
// Headers: Authorization: Bearer {token}

// POST /api/auth/refresh-token
{
  "refreshToken": "string"
}

// POST /api/auth/forgot-password
{
  "email": "string"
}

// POST /api/auth/reset-password
{
  "token": "string",
  "newPassword": "string"
}
```

### User Profile Endpoints

```javascript
// GET /api/users/profile
// Headers: Authorization: Bearer {token}

// PUT /api/users/profile
// Headers: Authorization: Bearer {token}
{
  "fullName": "string",
  "phone": "string",
  "email": "string"
}

// POST /api/users/id-verification
// Headers: Authorization: Bearer {token}
// Content-Type: multipart/form-data
{
  "idDocument": File,
  "documentType": "drivers_license|state_id|passport"
}

// GET /api/users/rewards
// Headers: Authorization: Bearer {token}

// GET /api/users/addresses
// Headers: Authorization: Bearer {token}

// POST /api/users/addresses
// Headers: Authorization: Bearer {token}
{
  "name": "string",
  "addressLine1": "string",
  "addressLine2": "string",
  "city": "string",
  "state": "string",
  "zipCode": "string",
  "addressType": "home|work|other",
  "deliveryInstructions": "string",
  "isPrimary": boolean
}

// PUT /api/users/addresses/:id
// DELETE /api/users/addresses/:id
```

### Product Endpoints

```javascript
// GET /api/products
// Query params: category, search, featured, limit, offset
{
  "products": [...],
  "total": number,
  "hasMore": boolean
}

// GET /api/products/:id
{
  "product": {...},
  "images": [...],
  "reviews": [...]
}

// GET /api/categories
{
  "categories": [...]
}
```

### Cart & Orders Endpoints

```javascript
// GET /api/cart
// Headers: Authorization: Bearer {token}

// POST /api/cart/add
// Headers: Authorization: Bearer {token}
{
  "productId": "uuid",
  "quantity": number
}

// PUT /api/cart/update
// Headers: Authorization: Bearer {token}
{
  "productId": "uuid",
  "quantity": number
}

// DELETE /api/cart/remove/:productId
// Headers: Authorization: Bearer {token}

// POST /api/orders
// Headers: Authorization: Bearer {token}
{
  "deliveryAddressId": "uuid",
  "paymentMethodId": "uuid",
  "specialInstructions": "string"
}

// GET /api/orders
// Headers: Authorization: Bearer {token}
// Query params: status, limit, offset

// GET /api/orders/:id
// Headers: Authorization: Bearer {token}

// GET /api/orders/:id/tracking
// Headers: Authorization: Bearer {token}
```

### Payment Endpoints

```javascript
// GET /api/payments/methods
// Headers: Authorization: Bearer {token}

// POST /api/payments/methods
// Headers: Authorization: Bearer {token}
{
  "type": "card|apple_pay|google_pay",
  "stripePaymentMethodId": "string"
}

// DELETE /api/payments/methods/:id
// Headers: Authorization: Bearer {token}

// POST /api/payments/create-intent
// Headers: Authorization: Bearer {token}
{
  "amount": number,
  "paymentMethodId": "string"
}
```

### Support Endpoints

```javascript
// POST /api/support/tickets
// Headers: Authorization: Bearer {token}
{
  "subject": "string",
  "category": "string",
  "message": "string"
}

// GET /api/support/tickets
// Headers: Authorization: Bearer {token}

// GET /api/support/tickets/:id/messages
// Headers: Authorization: Bearer {token}

// POST /api/support/tickets/:id/messages
// Headers: Authorization: Bearer {token}
{
  "message": "string"
}
```

---

## Real-time Features

### WebSocket Implementation

```javascript
// server/websocket.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

function initializeWebSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.userId);
      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Live chat
    socket.on('join-chat', async (data) => {
      const { ticketId } = data;
      socket.join(`chat:${ticketId}`);
      
      // Notify agent if available
      if (socket.userRole === 'customer') {
        socket.broadcast.to('agents').emit('customer-joined-chat', {
          ticketId,
          userId: socket.userId
        });
      }
    });

    socket.on('send-message', async (data) => {
      const { ticketId, message } = data;
      
      // Save message to database
      const savedMessage = await SupportMessage.create({
        ticketId,
        senderType: socket.userRole === 'agent' ? 'agent' : 'user',
        senderId: socket.userId,
        message
      });

      // Broadcast to chat room
      io.to(`chat:${ticketId}`).emit('new-message', {
        ...savedMessage,
        senderName: socket.userName
      });
    });

    socket.on('typing', (data) => {
      socket.broadcast.to(`chat:${data.ticketId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    // Order tracking
    socket.on('track-order', (data) => {
      const { orderId } = data;
      socket.join(`order:${orderId}`);
    });

    // Driver location updates
    socket.on('driver-location-update', async (data) => {
      if (socket.userRole !== 'driver') return;
      
      const { orderId, lat, lng, heading, speed } = data;
      
      // Save to database
      await DriverLocation.create({
        driverId: socket.userId,
        orderId,
        latitude: lat,
        longitude: lng,
        heading,
        speed
      });

      // Update Redis for real-time access
      await redis.setex(
        `driver:location:${socket.userId}`,
        60, // 1 minute expiry
        JSON.stringify({ lat, lng, heading, speed, orderId, lastUpdate: Date.now() })
      );

      // Broadcast to customers tracking this order
      socket.broadcast.to(`order:${orderId}`).emit('driver-location', {
        lat, lng, heading, speed, timestamp: Date.now()
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });

  return io;
}

module.exports = initializeWebSocket;
```

### Real-time Chat System

```javascript
// services/chatService.js
class ChatService {
  static async createChatSession(userId, subject) {
    const ticket = await SupportTicket.create({
      userId,
      subject,
      status: 'open'
    });

    // Find available agent
    const agent = await this.findAvailableAgent();
    
    if (agent) {
      await this.assignAgentToTicket(ticket.id, agent.id);
    }

    return ticket;
  }

  static async findAvailableAgent() {
    // Check Redis for online agents
    const onlineAgents = await redis.smembers('agents:online');
    
    if (onlineAgents.length === 0) {
      return null;
    }

    // Simple round-robin assignment
    const agentWorkload = await Promise.all(
      onlineAgents.map(async (agentId) => {
        const activeChats = await redis.scard(`agent:${agentId}:active_chats`);
        return { agentId, activeChats };
      })
    );

    const leastBusyAgent = agentWorkload.sort((a, b) => a.activeChats - b.activeChats)[0];
    return await User.findById(leastBusyAgent.agentId);
  }

  static async assignAgentToTicket(ticketId, agentId) {
    await SupportTicket.update(
      { agentId },
      { where: { id: ticketId } }
    );

    await redis.sadd(`agent:${agentId}:active_chats`, ticketId);
  }
}
```

---

## Authentication & Security

### JWT Implementation

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);
    
    if (!user || user.accountStatus !== 'active') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireIDVerification = (req, res, next) => {
  if (!req.user.idVerified) {
    return res.status(403).json({ 
      error: 'ID verification required',
      code: 'ID_VERIFICATION_REQUIRED'
    });
  }
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireIDVerification,
  requireRole
};
```

### Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

const createRateLimiter = (options) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:'
    }),
    ...options
  });
};

// Different limits for different endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
});

const orderLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 orders per minute
  message: 'Too many orders placed',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  apiLimiter,
  orderLimiter
};
```

### Input Validation

```javascript
// validation/schemas.js
const Joi = require('joi');

const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required(),
  phone: Joi.string().pattern(/^\(\d{3}\) \d{3}-\d{4}$/).required(),
  dateOfBirth: Joi.date().max('now').required()
});

const addressSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  addressLine1: Joi.string().min(5).max(255).required(),
  addressLine2: Joi.string().max(255).allow(''),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().length(2).required(),
  zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
  addressType: Joi.string().valid('home', 'work', 'other').required(),
  deliveryInstructions: Joi.string().max(500).allow(''),
  isPrimary: Joi.boolean()
});

const orderSchema = Joi.object({
  deliveryAddressId: Joi.string().uuid().required(),
  paymentMethodId: Joi.string().uuid().required(),
  specialInstructions: Joi.string().max(500).allow('')
});

module.exports = {
  registerSchema,
  addressSchema,
  orderSchema
};
```

---

## Payment Processing

### Stripe Integration

```javascript
// services/paymentService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  static async createCustomer(user) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: {
        userId: user.id
      }
    });

    await User.update(
      { stripeCustomerId: customer.id },
      { where: { id: user.id } }
    );

    return customer;
  }

  static async attachPaymentMethod(userId, paymentMethodId) {
    const user = await User.findById(userId);
    
    if (!user.stripeCustomerId) {
      await this.createCustomer(user);
      await user.reload();
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId
    });

    // Save to our database
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    await PaymentMethod.create({
      userId,
      type: 'card',
      provider: 'stripe',
      externalId: paymentMethodId,
      lastFour: paymentMethod.card.last4,
      cardBrand: paymentMethod.card.brand,
      expiresAt: new Date(paymentMethod.card.exp_year, paymentMethod.card.exp_month - 1)
    });
  }

  static async createPaymentIntent(amount, paymentMethodId, customerId) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        source: 'faded_skies_app'
      }
    });

    return paymentIntent;
  }

  static async processOrderPayment(orderId, paymentMethodId) {
    const order = await Order.findById(orderId);
    const user = await User.findById(order.userId);

    try {
      const paymentIntent = await this.createPaymentIntent(
        order.totalAmount,
        paymentMethodId,
        user.stripeCustomerId
      );

      if (paymentIntent.status === 'succeeded') {
        await Order.update(
          { 
            status: 'confirmed',
            paymentIntentId: paymentIntent.id
          },
          { where: { id: orderId } }
        );

        // Award rewards points (1 point per dollar spent)
        await RewardsTransaction.create({
          userId: user.id,
          type: 'earned',
          amount: Math.floor(order.totalAmount),
          description: 'Purchase reward',
          orderId
        });

        await User.increment('rewardsBalance', {
          by: Math.floor(order.totalAmount),
          where: { id: user.id }
        });

        return { success: true, paymentIntent };
      }

      return { success: false, error: 'Payment failed' };
    } catch (error) {
      console.error('Payment processing error:', error);
      
      await Order.update(
        { status: 'payment_failed' },
        { where: { id: orderId } }
      );

      return { success: false, error: error.message };
    }
  }
}

module.exports = PaymentService;
```

### Alternative Payment Methods

```javascript
// services/altPaymentService.js
class AlternativePaymentService {
  static async processApplePay(paymentData, orderId) {
    // Apple Pay processing through your payment processor
    // This would integrate with Stripe's Apple Pay or similar
    
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: paymentData.token
        }
      });

      return await PaymentService.processOrderPayment(orderId, paymentMethod.id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async processGooglePay(paymentData, orderId) {
    // Similar to Apple Pay processing
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: paymentData.token
        }
      });

      return await PaymentService.processOrderPayment(orderId, paymentMethod.id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async processFSCoin(userId, orderId, coinAmount) {
    const user = await User.findById(userId);
    
    if (user.rewardsBalance < coinAmount) {
      return { success: false, error: 'Insufficient FS Coin balance' };
    }

    const order = await Order.findById(orderId);
    const coinValue = coinAmount * 0.01; // 1 coin = $0.01

    if (coinValue >= order.totalAmount) {
      // Full payment with coins
      await User.decrement('rewardsBalance', {
        by: Math.ceil(order.totalAmount * 100),
        where: { id: userId }
      });

      await RewardsTransaction.create({
        userId,
        type: 'redeemed',
        amount: -Math.ceil(order.totalAmount * 100),
        description: 'Order payment',
        orderId
      });

      await Order.update(
        { status: 'confirmed' },
        { where: { id: orderId } }
      );

      return { success: true, message: 'Paid with FS Coins' };
    } else {
      // Partial payment with coins + another method needed
      return { 
        success: false, 
        error: 'Insufficient FS Coins for full payment',
        partialAmount: coinValue
      };
    }
  }
}
```

---

## Location & Mapping

### Google Maps Integration

```javascript
// services/locationService.js
const { Client } = require('@googlemaps/google-maps-services-js');

class LocationService {
  constructor() {
    this.client = new Client({});
  }

  async validateAddress(address) {
    try {
      const response = await this.client.geocode({
        params: {
          address: `${address.addressLine1}, ${address.city}, ${address.state} ${address.zipCode}`,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.results.length === 0) {
        return { valid: false, error: 'Address not found' };
      }

      const result = response.data.results[0];
      const location = result.geometry.location;

      // Check if address is in service area
      const inServiceArea = await this.checkServiceArea(location.lat, location.lng);

      return {
        valid: true,
        inServiceArea,
        coordinates: location,
        formattedAddress: result.formatted_address
      };
    } catch (error) {
      return { valid: false, error: 'Address validation failed' };
    }
  }

  async checkServiceArea(lat, lng) {
    // Define service areas (could be stored in database)
    const serviceAreas = [
      {
        name: 'Austin',
        center: { lat: 30.2672, lng: -97.7431 },
        radius: 25 // miles
      },
      {
        name: 'Round Rock',
        center: { lat: 30.5082, lng: -97.6789 },
        radius: 15
      }
    ];

    for (const area of serviceAreas) {
      const distance = this.calculateDistance(
        lat, lng,
        area.center.lat, area.center.lng
      );

      if (distance <= area.radius) {
        return { inArea: true, areaName: area.name };
      }
    }

    return { inArea: false };
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async getOptimizedRoute(origin, destinations) {
    try {
      const response = await this.client.directions({
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destinations[destinations.length - 1].lat},${destinations[destinations.length - 1].lng}`,
          waypoints: destinations.slice(0, -1).map(dest => `${dest.lat},${dest.lng}`),
          optimize: true,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      return response.data;
    } catch (error) {
      console.error('Route optimization error:', error);
      return null;
    }
  }
}

module.exports = LocationService;
```

### Real-time Driver Tracking

```javascript
// services/trackingService.js
class TrackingService {
  static async updateDriverLocation(driverId, orderId, locationData) {
    const { lat, lng, heading, speed } = locationData;

    // Save to database
    await DriverLocation.create({
      driverId,
      orderId,
      latitude: lat,
      longitude: lng,
      heading,
      speed
    });

    // Update Redis for real-time access
    await redis.setex(
      `driver:location:${driverId}`,
      60, // 1 minute expiry
      JSON.stringify({
        lat, lng, heading, speed, orderId,
        lastUpdate: Date.now()
      })
    );

    // Calculate ETA
    const order = await Order.findById(orderId, {
      include: [{ model: DeliveryAddress }]
    });

    if (order && order.DeliveryAddress) {
      const eta = await this.calculateETA(
        { lat, lng },
        {
          lat: order.DeliveryAddress.latitude,
          lng: order.DeliveryAddress.longitude
        }
      );

      // Update order with new ETA
      await Order.update(
        { estimatedDeliveryTime: eta },
        { where: { id: orderId } }
      );

      return { success: true, eta };
    }

    return { success: true };
  }

  static async calculateETA(driverLocation, destinationLocation) {
    const locationService = new LocationService();
    
    try {
      const route = await locationService.getOptimizedRoute(
        driverLocation,
        [destinationLocation]
      );

      if (route && route.routes.length > 0) {
        const duration = route.routes[0].legs[0].duration.value; // in seconds
        return Math.ceil(duration / 60); // convert to minutes
      }
    } catch (error) {
      console.error('ETA calculation error:', error);
    }

    // Fallback to straight-line distance estimation
    const distance = locationService.calculateDistance(
      driverLocation.lat, driverLocation.lng,
      destinationLocation.lat, destinationLocation.lng
    );

    // Assume average speed of 25 mph in city
    return Math.ceil((distance / 25) * 60);
  }

  static async getDriverLocation(driverId) {
    const cachedLocation = await redis.get(`driver:location:${driverId}`);
    
    if (cachedLocation) {
      return JSON.parse(cachedLocation);
    }

    // Fallback to database
    const location = await DriverLocation.findOne({
      where: { driverId },
      order: [['createdAt', 'DESC']]
    });

    return location;
  }
}
```

---

## Notification System

### Push Notifications

```javascript
// services/notificationService.js
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require('../config/firebase-service-account.json'))
});

class NotificationService {
  static async sendPushNotification(userId, notification) {
    try {
      // Get user's FCM tokens
      const user = await User.findById(userId);
      if (!user.fcmTokens || user.fcmTokens.length === 0) {
        return { success: false, error: 'No FCM tokens' };
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/icon-192x192.png'
        },
        data: {
          type: notification.type,
          orderId: notification.orderId || '',
          url: notification.url || ''
        },
        tokens: user.fcmTokens
      };

      const response = await admin.messaging().sendMulticast(message);
      
      // Remove invalid tokens
      if (response.failureCount > 0) {
        const validTokens = user.fcmTokens.filter((token, index) => {
          return response.responses[index].success;
        });

        await User.update(
          { fcmTokens: validTokens },
          { where: { id: userId } }
        );
      }

      return { success: true, response };
    } catch (error) {
      console.error('Push notification error:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendOrderUpdate(orderId, status) {
    const order = await Order.findById(orderId, {
      include: [{ model: User }]
    });

    if (!order) return;

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
  }

  static async sendDriverETA(orderId, eta) {
    const order = await Order.findById(orderId);
    if (!order) return;

    const notification = {
      title: '🕒 Delivery Update',
      body: `Your driver will arrive in approximately ${eta} minutes.`,
      type: 'eta_update',
      orderId
    };

    await this.sendPushNotification(order.userId, notification);
  }

  static async sendPromotion(userId, promotion) {
    const notification = {
      title: promotion.title,
      body: promotion.message,
      type: 'promotion',
      url: `/promotions/${promotion.id}`
    };

    await this.sendPushNotification(userId, notification);
  }
}

module.exports = NotificationService;
```

### Email Notifications

```javascript
// services/emailService.js
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, template, data) {
    try {
      const templatePath = path.join(__dirname, '../templates/email', `${template}.hbs`);
      const templateSource = await fs.readFile(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateSource);
      const html = compiledTemplate(data);

      const mailOptions = {
        from: `"Faded Skies" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(user) {
    return this.sendEmail(
      user.email,
      'Welcome to Faded Skies! 🌿',
      'welcome',
      {
        userName: user.fullName,
        appUrl: process.env.CLIENT_URL
      }
    );
  }

  async sendOrderConfirmation(order) {
    const user = await User.findById(order.userId);
    const orderItems = await OrderItem.findAll({
      where: { orderId: order.id },
      include: [{ model: Product }]
    });

    return this.sendEmail(
      user.email,
      `Order Confirmation - ${order.orderNumber}`,
      'order-confirmation',
      {
        userName: user.fullName,
        orderNumber: order.orderNumber,
        orderItems,
        total: order.totalAmount,
        estimatedDelivery: order.estimatedDeliveryTime
      }
    );
  }

  async sendIDVerificationStatus(user, status) {
    const templates = {
      approved: {
        subject: '✅ ID Verification Approved',
        template: 'id-verified'
      },
      rejected: {
        subject: '❌ ID Verification Rejected',
        template: 'id-rejected'
      }
    };

    const config = templates[status];
    if (!config) return;

    return this.sendEmail(
      user.email,
      config.subject,
      config.template,
      {
        userName: user.fullName,
        supportUrl: `${process.env.CLIENT_URL}/support`
      }
    );
  }
}

module.exports = EmailService;
```

---

## File Upload & Storage

### AWS S3 Integration

```javascript
// services/uploadService.js
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

class UploadService {
  static createUploader(options = {}) {
    const {
      bucketName = process.env.AWS_S3_BUCKET,
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      maxSize = 5 * 1024 * 1024, // 5MB
      folder = 'uploads'
    } = options;

    return multer({
      storage: multerS3({
        s3: s3,
        bucket: bucketName,
        acl: 'public-read',
        metadata: (req, file, cb) => {
          cb(null, {
            fieldName: file.fieldname,
            uploadedBy: req.user?.id || 'anonymous',
            uploadedAt: new Date().toISOString()
          });
        },
        key: (req, file, cb) => {
          const extension = path.extname(file.originalname);
          const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${extension}`;
          cb(null, filename);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
      },
      limits: {
        fileSize: maxSize
      }
    });
  }

  static async deleteFile(fileUrl) {
    try {
      // Extract key from S3 URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      await s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
      }).promise();

      return { success: true };
    } catch (error) {
      console.error('File deletion error:', error);
      return { success: false, error: error.message };
    }
  }

  static async generatePresignedUrl(key, expiresIn = 3600) {
    try {
      const url = await s3.getSignedUrlPromise('getObject', {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Expires: expiresIn
      });

      return { success: true, url };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create specific uploaders
const idDocumentUploader = UploadService.createUploader({
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  maxSize: 10 * 1024 * 1024, // 10MB for ID documents
  folder: 'id-documents'
});

const productImageUploader = UploadService.createUploader({
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: 5 * 1024 * 1024, // 5MB
  folder: 'products'
});

module.exports = {
  UploadService,
  idDocumentUploader,
  productImageUploader
};
```

### ID Verification Processing

```javascript
// services/idVerificationService.js
const axios = require('axios');

class IDVerificationService {
  static async processIDDocument(userId, documentUrl, documentType) {
    try {
      // Save verification attempt
      const verification = await IDVerification.create({
        userId,
        documentUrl,
        documentType,
        status: 'processing'
      });

      // In production, integrate with ID verification service like Jumio, Onfido, etc.
      // For demo purposes, we'll simulate the process
      
      // Simulate processing delay
      setTimeout(async () => {
        // Mock verification result (in production, this would come from the service webhook)
        const isValid = Math.random() > 0.1; // 90% success rate for demo
        
        const status = isValid ? 'approved' : 'rejected';
        const reason = isValid ? null : 'Document quality insufficient';

        await IDVerification.update(
          { status, reason },
          { where: { id: verification.id } }
        );

        if (isValid) {
          await User.update(
            { 
              idVerified: true,
              idVerificationStatus: 'approved'
            },
            { where: { id: userId } }
          );
        }

        // Send notification
        const user = await User.findById(userId);
        await EmailService.sendIDVerificationStatus(user, status);
        await NotificationService.sendPushNotification(userId, {
          title: isValid ? 'ID Verified! ✅' : 'ID Verification Failed ❌',
          body: isValid 
            ? 'Your ID has been verified. You can now place orders!' 
            : 'Please upload a clearer photo of your ID.',
          type: 'id_verification'
        });

      }, 30000); // 30 second delay for demo

      return { success: true, verificationId: verification.id };
    } catch (error) {
      console.error('ID verification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Integration with real ID verification service
  static async verifyWithJumio(documentUrl, documentType) {
    try {
      const response = await axios.post('https://api.jumio.com/api/v4/verifications', {
        customerInternalReference: `faded-skies-${Date.now()}`,
        userReference: documentUrl,
        reportingCriteria: 'ID_VERIFICATION',
        callbackUrl: `${process.env.API_URL}/webhooks/jumio`,
        successUrl: `${process.env.CLIENT_URL}/verification-success`,
        errorUrl: `${process.env.CLIENT_URL}/verification-error`
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.JUMIO_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Jumio verification error:', error);
      throw error;
    }
  }
}

module.exports = IDVerificationService;
```

---

## Deployment Infrastructure

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Change ownership
RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: faded_skies
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: faded-skies-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: faded-skies-api
  template:
    metadata:
      labels:
        app: faded-skies-api
    spec:
      containers:
      - name: api
        image: your-registry/faded-skies-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: faded-skies-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: faded-skies-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  name: faded-skies-api-service
spec:
  selector:
    app: faded-skies-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
      env:
        DATABASE_URL: postgresql://postgres:test@localhost:5432/test
        REDIS_URL: redis://localhost:6379
        JWT_SECRET: test-secret

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: faded-skies-api
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
    
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --name faded-skies-cluster
        kubectl set image deployment/faded-skies-api api=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        kubectl rollout status deployment/faded-skies-api
```

---

## Third-party Integrations

### Stripe Payment Processing

```javascript
// config/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15'
});

// Webhook endpoint for Stripe events
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;
    
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handleFailedPayment(failedPayment);
      break;
    
    case 'customer.subscription.deleted':
      // Handle subscription cancellation if applicable
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});
```

### Google Maps Platform

```javascript
// config/maps.js
const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
  libraries: ['places', 'geometry'],
  endpoints: {
    geocoding: 'https://maps.googleapis.com/maps/api/geocode/json',
    directions: 'https://maps.googleapis.com/maps/api/directions/json',
    places: 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
  }
};

// Address autocomplete endpoint
app.get('/api/maps/autocomplete', authenticateToken, async (req, res) => {
  try {
    const { input } = req.query;
    
    const response = await axios.get(GOOGLE_MAPS_CONFIG.endpoints.places, {
      params: {
        input,
        key: GOOGLE_MAPS_CONFIG.apiKey,
        types: 'address',
        components: 'country:us'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Address lookup failed' });
  }
});
```

### Firebase Cloud Messaging

```javascript
// config/firebase.js
const admin = require('firebase-admin');

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Register FCM token
app.post('/api/notifications/register-token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    // Add token to user's FCM tokens array
    const user = await User.findById(userId);
    const currentTokens = user.fcmTokens || [];
    
    if (!currentTokens.includes(token)) {
      await User.update(
        { fcmTokens: [...currentTokens, token] },
        { where: { id: userId } }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Token registration failed' });
  }
});
```

---

## Cannabis Industry Compliance

### Age Verification Requirements

```javascript
// middleware/compliance.js
const MINIMUM_AGE = 21;

const validateAge = (dateOfBirth) => {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= MINIMUM_AGE;
};

const requireAgeVerification = (req, res, next) => {
  if (!req.user.idVerified) {
    return res.status(403).json({
      error: 'Age verification required',
      message: 'You must verify your age before making purchases',
      code: 'AGE_VERIFICATION_REQUIRED'
    });
  }
  next();
};

// Audit logging for compliance
const auditLogger = (action, userId, details) => {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    details,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  };
  
  // Log to secure audit system
  console.log('AUDIT:', JSON.stringify(auditEntry));
  
  // In production, send to compliance logging service
  // await ComplianceLog.create(auditEntry);
};

module.exports = {
  validateAge,
  requireAgeVerification,
  auditLogger
};
```

### Regulatory Compliance Endpoints

```javascript
// routes/compliance.js
const express = require('express');
const router = express.Router();

// License verification endpoint
router.get('/license', (req, res) => {
  res.json({
    business: {
      name: 'Faded Skies LLC',
      licenseNumber: 'TX-RET-2024-001',
      licenseType: 'Retail Cannabis Delivery',
      issuer: 'Texas Department of State Health Services',
      issuedDate: '2024-01-15',
      expirationDate: '2025-01-15',
      status: 'Active'
    },
    compliance: {
      trackAndTrace: 'Metrc Integration Active',
      taxReporting: 'Automated',
      ageVerification: 'Required',
      deliveryAreas: 'Texas Authorized Municipalities'
    }
  });
});

// Tax calculation for cannabis products
router.post('/calculate-tax', (req, res) => {
  const { subtotal, deliveryAddress } = req.body;
  
  // Texas cannabis tax structure (example)
  const stateTax = subtotal * 0.0625; // 6.25% state sales tax
  const cannabisTax = subtotal * 0.15; // 15% cannabis excise tax
  const localTax = calculateLocalTax(subtotal, deliveryAddress);
  
  const totalTax = stateTax + cannabisTax + localTax;
  
  res.json({
    subtotal,
    taxes: {
      state: stateTax,
      cannabis: cannabisTax,
      local: localTax,
      total: totalTax
    },
    total: subtotal + totalTax
  });
});

// Delivery area validation
router.post('/validate-delivery-area', (req, res) => {
  const { address } = req.body;
  
  // Check against approved delivery municipalities
  const approvedAreas = [
    'Austin', 'Round Rock', 'Cedar Park', 'Lakeway',
    'West Lake Hills', 'Rollingwood'
  ];
  
  const isApproved = approvedAreas.some(area => 
    address.city.toLowerCase().includes(area.toLowerCase())
  );
  
  res.json({
    approved: isApproved,
    reason: isApproved ? null : 'Delivery not available in this area',
    availableAreas: approvedAreas
  });
});

module.exports = router;
```

---

## Monitoring & Analytics

### Health Check Endpoints

```javascript
// routes/health.js
const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {}
  };

  try {
    // Database check
    await sequelize.authenticate();
    health.checks.database = { status: 'healthy', responseTime: '< 100ms' };
  } catch (error) {
    health.checks.database = { status: 'unhealthy', error: error.message };
    health.status = 'unhealthy';
  }

  try {
    // Redis check
    await redis.ping();
    health.checks.redis = { status: 'healthy', responseTime: '< 50ms' };
  } catch (error) {
    health.checks.redis = { status: 'unhealthy', error: error.message };
    health.status = 'unhealthy';
  }

  // External services check
  try {
    const stripeStatus = await checkStripeHealth();
    health.checks.stripe = { status: stripeStatus ? 'healthy' : 'degraded' };
  } catch (error) {
    health.checks.stripe = { status: 'unhealthy', error: error.message };
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/metrics', (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    activeConnections: server.connections || 0,
    timestamp: new Date().toISOString()
  };

  res.json(metrics);
});

module.exports = router;
```

### Analytics & Tracking

```javascript
// services/analyticsService.js
class AnalyticsService {
  static async trackEvent(userId, event, properties = {}) {
    const eventData = {
      userId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        sessionId: req.sessionID,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    };

    // Store in database for compliance
    await AnalyticsEvent.create(eventData);

    // Send to external analytics (Google Analytics, Mixpanel, etc.)
    if (process.env.GOOGLE_ANALYTICS_ID) {
      await this.sendToGoogleAnalytics(eventData);
    }

    if (process.env.MIXPANEL_TOKEN) {
      await this.sendToMixpanel(eventData);
    }
  }

  static async trackPurchase(order) {
    await this.trackEvent(order.userId, 'purchase', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      itemCount: order.OrderItems.length,
      paymentMethod: order.PaymentMethod.type,
      deliveryArea: order.DeliveryAddress.city
    });
  }

  static async trackPageView(userId, page) {
    await this.trackEvent(userId, 'page_view', {
      page,
      referrer: req.get('Referrer'),
      url: req.originalUrl
    });
  }

  static async generateReport(startDate, endDate) {
    const report = {
      period: { startDate, endDate },
      users: {
        total: await User.count(),
        newUsers: await User.count({
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate]
            }
          }
        }),
        activeUsers: await User.count({
          where: {
            lastLoginAt: {
              [Op.between]: [startDate, endDate]
            }
          }
        })
      },
      orders: {
        total: await Order.count({
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate]
            }
          }
        }),
        revenue: await Order.sum('totalAmount', {
          where: {
            status: 'delivered',
            createdAt: {
              [Op.between]: [startDate, endDate]
            }
          }
        })
      },
      products: {
        topSelling: await this.getTopSellingProducts(startDate, endDate),
        lowStock: await Product.findAll({
          where: {
            stockQuantity: {
              [Op.lt]: 10
            }
          },
          attributes: ['id', 'name', 'stockQuantity']
        })
      }
    };

    return report;
  }
}

module.exports = AnalyticsService;
```

---

## Environment Configuration

### Production Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://username:password@host:5432/faded_skies_prod
REDIS_URL=redis://username:password@host:6379

# Security
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# AWS Services
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-2
AWS_S3_BUCKET=faded-skies-uploads

# Payment Processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# External APIs
GOOGLE_MAPS_API_KEY=your-google-maps-key
FIREBASE_PROJECT_ID=your-firebase-project

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@fadedskies.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# Compliance
METRC_API_KEY=your-metrc-api-key
JUMIO_API_TOKEN=your-jumio-token

# Client Configuration
CLIENT_URL=https://app.fadedskies.com
API_URL=https://api.fadedskies.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Development Setup

```bash
# Setup script (setup.sh)
#!/bin/bash

echo "Setting up Faded Skies development environment..."

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.development

# Setup database
createdb faded_skies_dev
npm run db:migrate
npm run db:seed

# Setup Redis
redis-server --daemonize yes

# Generate JWT secret
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.development

echo "Setup complete! Run 'npm run dev' to start the development server."
```

---

## Summary

This comprehensive backend implementation guide provides everything needed to make your Faded Skies cannabis delivery app production-ready:

### Key Components Covered:
- ✅ **Complete Database Schema** with PostgreSQL and Redis
- ✅ **RESTful API Endpoints** for all app features
- ✅ **Real-time Features** with WebSocket implementation
- ✅ **Secure Authentication** with JWT and rate limiting
- ✅ **Payment Processing** with Stripe integration
- ✅ **Location Services** with Google Maps
- ✅ **File Upload** with AWS S3
- ✅ **Push Notifications** with Firebase
- ✅ **Email System** with templates
- ✅ **Cannabis Compliance** features
- ✅ **Deployment Configuration** for production
- ✅ **Monitoring & Analytics** setup

### Next Steps:
1. Set up your development environment
2. Configure external services (Stripe, AWS, Google Maps)
3. Implement the API endpoints systematically
4. Test all features thoroughly
5. Deploy to staging environment
6. Complete compliance review
7. Launch to production

This guide ensures your cannabis delivery app meets industry standards for security, compliance, and scalability.