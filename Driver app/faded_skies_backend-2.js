// server.js - Main Express server with Socket.io
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
});

// Import models
const User = require('./models/User');
const Driver = require('./models/Driver');
const Order = require('./models/Order');
const Admin = require('./models/Admin');

// Import routes
const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/drivers');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const payoutRoutes = require('./routes/payouts');

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/faded_skies', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payouts', payoutRoutes);

// Socket.io for real-time communication
const connectedDrivers = new Map();
const connectedCustomers = new Map();
const connectedAdmins = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Driver joins
  socket.on('driver_connect', async (data) => {
    const { driverId, location } = data;
    connectedDrivers.set(driverId, {
      socketId: socket.id,
      location: location,
      isOnline: true,
      lastUpdate: new Date()
    });
    
    // Update driver status in database
    await Driver.findByIdAndUpdate(driverId, {
      isOnline: true,
      currentLocation: location,
      lastActiveAt: new Date()
    });

    // Notify admin of driver coming online
    io.to('admin_room').emit('driver_status_changed', {
      driverId,
      isOnline: true,
      location
    });

    socket.join(`driver_${driverId}`);
    console.log(`Driver ${driverId} connected and online`);
  });

  // Customer joins
  socket.on('customer_connect', (data) => {
    const { customerId } = data;
    connectedCustomers.set(customerId, socket.id);
    socket.join(`customer_${customerId}`);
    console.log(`Customer ${customerId} connected`);
  });

  // Admin joins
  socket.on('admin_connect', (data) => {
    const { adminId } = data;
    connectedAdmins.set(adminId, socket.id);
    socket.join('admin_room');
    
    // Send current system status to admin
    socket.emit('system_status', {
      onlineDrivers: connectedDrivers.size,
      activeOrders: 0, // Will be populated from database
      totalEarnings: 0
    });
    
    console.log(`Admin ${adminId} connected`);
  });

  // Driver location updates
  socket.on('driver_location_update', async (data) => {
    const { driverId, location, speed, heading } = data;
    
    if (connectedDrivers.has(driverId)) {
      connectedDrivers.get(driverId).location = location;
      connectedDrivers.get(driverId).lastUpdate = new Date();
      
      // Update database
      await Driver.findByIdAndUpdate(driverId, {
        currentLocation: location,
        lastActiveAt: new Date()
      });

      // If driver has active order, update customer
      const activeOrder = await Order.findOne({
        driverId: driverId,
        status: { $in: ['accepted', 'picked_up', 'in_transit'] }
      });

      if (activeOrder) {
        io.to(`customer_${activeOrder.customerId}`).emit('driver_location_update', {
          orderId: activeOrder._id,
          location,
          speed,
          heading,
          estimatedArrival: calculateETA(location, activeOrder.deliveryAddress.coordinates)
        });

        // Update admin dashboard
        io.to('admin_room').emit('live_delivery_update', {
          orderId: activeOrder._id,
          driverId,
          location,
          status: activeOrder.status
        });
      }
    }
  });

  // Driver status changes (online/offline)
  socket.on('driver_status_change', async (data) => {
    const { driverId, isOnline } = data;
    
    if (connectedDrivers.has(driverId)) {
      connectedDrivers.get(driverId).isOnline = isOnline;
      
      await Driver.findByIdAndUpdate(driverId, {
        isOnline: isOnline,
        lastActiveAt: new Date()
      });

      // Notify admin
      io.to('admin_room').emit('driver_status_changed', {
        driverId,
        isOnline
      });

      if (!isOnline) {
        // Handle any active orders
        const activeOrders = await Order.find({
          driverId: driverId,
          status: { $in: ['assigned', 'accepted'] }
        });

        for (const order of activeOrders) {
          // Reassign orders back to pool
          order.driverId = null;
          order.status = 'pending';
          await order.save();

          // Notify customer
          io.to(`customer_${order.customerId}`).emit('order_status_update', {
            orderId: order._id,
            status: 'pending',
            message: 'Finding a new driver for your order...'
          });

          // Notify admin
          io.to('admin_room').emit('order_reassigned', {
            orderId: order._id,
            reason: 'driver_offline'
          });
        }
      }
    }
  });

  // Order status updates
  socket.on('order_status_update', async (data) => {
    const { orderId, status, driverId, location } = data;
    
    try {
      const order = await Order.findByIdAndUpdate(orderId, {
        status: status,
        updatedAt: new Date()
      }, { new: true }).populate('customerId driverId');

      // Notify customer
      io.to(`customer_${order.customerId._id}`).emit('order_status_update', {
        orderId: order._id,
        status: status,
        driver: {
          name: order.driverId.name,
          phone: order.driverId.phone,
          vehicle: order.driverId.vehicle,
          rating: order.driverId.rating
        },
        estimatedArrival: status === 'in_transit' ? 
          calculateETA(location, order.deliveryAddress.coordinates) : null
      });

      // Notify admin
      io.to('admin_room').emit('order_status_update', {
        orderId: order._id,
        status: status,
        driverId: order.driverId._id,
        timestamp: new Date()
      });

      // Handle completion
      if (status === 'delivered') {
        await handleOrderCompletion(order);
      }

    } catch (error) {
      console.error('Error updating order status:', error);
    }
  });

  // New order placement (from customer app)
  socket.on('place_order', async (data) => {
    try {
      const order = new Order(data);
      await order.save();
      
      // Find available drivers nearby
      const nearbyDrivers = await findNearbyDrivers(
        data.deliveryAddress.coordinates,
        5 // 5 mile radius
      );

      if (nearbyDrivers.length > 0) {
        // Notify nearby drivers
        nearbyDrivers.forEach(driver => {
          if (connectedDrivers.has(driver._id.toString())) {
            io.to(`driver_${driver._id}`).emit('new_order_available', {
              orderId: order._id,
              customer: data.customer,
              items: data.items,
              total: data.total,
              deliveryAddress: data.deliveryAddress,
              distance: calculateDistance(
                driver.currentLocation,
                data.deliveryAddress.coordinates
              ),
              estimatedEarnings: calculateDriverEarnings(data.total, data.distance)
            });
          }
        });

        // Notify customer
        io.to(`customer_${data.customerId}`).emit('order_placed', {
          orderId: order._id,
          estimatedPickupTime: 30, // minutes
          availableDrivers: nearbyDrivers.length
        });
      } else {
        // No drivers available
        io.to(`customer_${data.customerId}`).emit('no_drivers_available', {
          orderId: order._id,
          estimatedWait: 45 // minutes
        });
      }

      // Notify admin
      io.to('admin_room').emit('new_order_placed', {
        orderId: order._id,
        customer: data.customer,
        total: data.total,
        availableDrivers: nearbyDrivers.length
      });

    } catch (error) {
      console.error('Error placing order:', error);
      socket.emit('order_error', { message: 'Failed to place order' });
    }
  });

  // Driver accepts order
  socket.on('accept_order', async (data) => {
    const { orderId, driverId } = data;
    
    try {
      const order = await Order.findById(orderId);
      
      if (order && order.status === 'pending') {
        order.driverId = driverId;
        order.status = 'accepted';
        order.acceptedAt = new Date();
        await order.save();

        // Notify customer
        const driver = await Driver.findById(driverId);
        io.to(`customer_${order.customerId}`).emit('order_accepted', {
          orderId: order._id,
          driver: {
            name: driver.name,
            phone: driver.phone,
            vehicle: driver.vehicle,
            rating: driver.rating,
            photo: driver.profilePhoto
          },
          estimatedPickupTime: 20
        });

        // Notify other drivers that order is taken
        connectedDrivers.forEach((driverData, dId) => {
          if (dId !== driverId) {
            io.to(`driver_${dId}`).emit('order_no_longer_available', {
              orderId: order._id
            });
          }
        });

        // Notify admin
        io.to('admin_room').emit('order_accepted', {
          orderId: order._id,
          driverId: driverId,
          timestamp: new Date()
        });

        // Confirm to accepting driver
        socket.emit('order_accept_confirmed', {
          orderId: order._id,
          customer: order.customer,
          deliveryAddress: order.deliveryAddress
        });

      } else {
        socket.emit('order_accept_failed', {
          orderId: orderId,
          reason: 'Order no longer available'
        });
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      socket.emit('order_accept_failed', {
        orderId: orderId,
        reason: 'Server error'
      });
    }
  });

  // Messages between driver and customer
  socket.on('send_message', async (data) => {
    const { orderId, senderId, senderType, message } = data;
    
    try {
      const order = await Order.findById(orderId);
      if (!order) return;

      const messageData = {
        orderId,
        senderId,
        senderType, // 'driver' or 'customer'
        message,
        timestamp: new Date()
      };

      // Save message to database
      // (You might want a separate Messages collection)

      // Send to recipient
      if (senderType === 'driver') {
        io.to(`customer_${order.customerId}`).emit('new_message', messageData);
      } else {
        io.to(`driver_${order.driverId}`).emit('new_message', messageData);
      }

      // Notify admin
      io.to('admin_room').emit('order_message', messageData);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from connected drivers
    for (const [driverId, driverData] of connectedDrivers.entries()) {
      if (driverData.socketId === socket.id) {
        connectedDrivers.delete(driverId);
        
        // Update database
        await Driver.findByIdAndUpdate(driverId, {
          isOnline: false,
          lastActiveAt: new Date()
        });

        // Notify admin
        io.to('admin_room').emit('driver_disconnected', {
          driverId,
          timestamp: new Date()
        });
        break;
      }
    }

    // Remove from connected customers
    for (const [customerId, socketId] of connectedCustomers.entries()) {
      if (socketId === socket.id) {
        connectedCustomers.delete(customerId);
        break;
      }
    }

    // Remove from connected admins
    for (const [adminId, socketId] of connectedAdmins.entries()) {
      if (socketId === socket.id) {
        connectedAdmins.delete(adminId);
        break;
      }
    }
  });
});

// Helper functions
function calculateDistance(point1, point2) {
  // Haversine formula for calculating distance between two coordinates
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

function calculateETA(driverLocation, destination) {
  const distance = calculateDistance(driverLocation, destination);
  const avgSpeed = 25; // mph average in city
  const timeInHours = distance / avgSpeed;
  return Math.round(timeInHours * 60); // return minutes
}

function calculateDriverEarnings(orderTotal, distance) {
  const basePay = 6.00;
  const mileageRate = 0.50;
  const mileagePay = distance * mileageRate;
  return basePay + mileagePay;
}

async function findNearbyDrivers(location, radiusMiles) {
  return await Driver.find({
    isOnline: true,
    'currentLocation.lat': {
      $gte: location.lat - (radiusMiles / 69), // Rough conversion
      $lte: location.lat + (radiusMiles / 69)
    },
    'currentLocation.lng': {
      $gte: location.lng - (radiusMiles / 54.6), // Rough conversion
      $lte: location.lng + (radiusMiles / 54.6)
    }
  });
}

async function handleOrderCompletion(order) {
  try {
    // Calculate final earnings
    const distance = order.actualDistance || order.estimatedDistance;
    const basePay = order.basePay || 6.00;
    const mileagePay = distance * 0.50;
    const tip = order.tip || 0;
    const totalEarnings = basePay + mileagePay + tip;

    // Update driver earnings
    await Driver.findByIdAndUpdate(order.driverId, {
      $inc: {
        'earnings.total': totalEarnings,
        'earnings.today': totalEarnings,
        'earnings.pending': totalEarnings,
        totalDeliveries: 1
      }
    });

    // Create payout record
    // (Implementation depends on your payout system)

    // Update order with final details
    order.completedAt = new Date();
    order.finalEarnings = {
      basePay,
      mileagePay,
      tip,
      total: totalEarnings
    };
    await order.save();

    console.log(`Order ${order._id} completed. Driver earned $${totalEarnings}`);
  } catch (error) {
    console.error('Error handling order completion:', error);
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };