import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export function initializeSocket(io: Server) {
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      
      // Join role-specific rooms
      if (socket.userRole === 'DRIVER') {
        socket.join('drivers');
        handleDriverConnection(socket, io);
      } else if (socket.userRole === 'ADMIN' || socket.userRole === 'SUPER_ADMIN') {
        socket.join('admins');
        handleAdminConnection(socket, io);
      } else {
        socket.join('customers');
        handleCustomerConnection(socket, io);
      }
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userId}`);
      handleDisconnection(socket, io);
    });

    // Generic message handler
    socket.on('message', (data) => {
      logger.info(`Message from ${socket.userId}:`, data);
    });
  });
}

// Driver-specific socket handlers
function handleDriverConnection(socket: AuthenticatedSocket, io: Server) {
  // Driver goes online
  socket.on('driver:online', async (data) => {
    try {
      await prisma.driver.update({
        where: { userId: socket.userId },
        data: {
          isOnline: true,
          currentLat: data.lat,
          currentLng: data.lng,
          lastLocationUpdate: new Date()
        }
      });

      // Notify admins that driver is online
      io.to('admins').emit('driver:status_changed', {
        driverId: socket.userId,
        status: 'online',
        location: { lat: data.lat, lng: data.lng }
      });

      logger.info(`Driver ${socket.userId} went online`);
    } catch (error) {
      logger.error('Error updating driver online status:', error);
    }
  });

  // Driver goes offline
  socket.on('driver:offline', async () => {
    try {
      await prisma.driver.update({
        where: { userId: socket.userId },
        data: {
          isOnline: false,
          lastLocationUpdate: new Date()
        }
      });

      // Notify admins that driver is offline
      io.to('admins').emit('driver:status_changed', {
        driverId: socket.userId,
        status: 'offline'
      });

      logger.info(`Driver ${socket.userId} went offline`);
    } catch (error) {
      logger.error('Error updating driver offline status:', error);
    }
  });

  // Driver location update
  socket.on('driver:location_update', async (data) => {
    try {
      const { lat, lng, heading, speed } = data;

      await prisma.driver.update({
        where: { userId: socket.userId },
        data: {
          currentLat: lat,
          currentLng: lng,
          lastLocationUpdate: new Date()
        }
      });

      // Find active orders for this driver
      const activeOrders = await prisma.order.findMany({
        where: {
          driverId: socket.userId,
          status: {
            in: ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT']
          }
        },
        include: {
          customer: true
        }
      });

      // Send location updates to customers with active orders
      activeOrders.forEach(order => {
        io.to(`user:${order.customer.id}`).emit('delivery:location_update', {
          orderId: order.id,
          driverLocation: { lat, lng, heading, speed },
          timestamp: new Date()
        });
      });

      // Send to admins for tracking
      io.to('admins').emit('driver:location_update', {
        driverId: socket.userId,
        location: { lat, lng, heading, speed },
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error updating driver location:', error);
    }
  });

  // Driver accepts order
  socket.on('driver:accept_order', async (data) => {
    try {
      const { orderId } = data;

      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          driverId: socket.userId,
          status: 'ACCEPTED'
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Create status history
      await prisma.orderStatusHistory.create({
        data: {
          orderId: orderId,
          status: 'ACCEPTED'
        }
      });

      // Notify customer
      io.to(`user:${order.customer.id}`).emit('order:status_update', {
        orderId: orderId,
        status: 'ACCEPTED',
        message: 'Your order has been accepted by a driver!',
        driver: {
          name: order.customer.name, // Will be replaced with actual driver info
          phone: order.customer.phone
        }
      });

      // Notify admins
      io.to('admins').emit('order:status_update', {
        orderId: orderId,
        status: 'ACCEPTED',
        driverId: socket.userId
      });

      logger.info(`Driver ${socket.userId} accepted order ${orderId}`);
    } catch (error) {
      logger.error('Error accepting order:', error);
      socket.emit('error', { message: 'Failed to accept order' });
    }
  });

  // Driver updates order status
  socket.on('driver:update_order_status', async (data) => {
    try {
      const { orderId, status, notes } = data;

      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          customer: true,
          driver: {
            include: {
              user: true
            }
          }
        }
      });

      // Create status history
      await prisma.orderStatusHistory.create({
        data: {
          orderId: orderId,
          status: status,
          notes: notes
        }
      });

      // Calculate earnings if order is delivered
      if (status === 'DELIVERED') {
        const basePay = 6.00; // Base delivery fee
        const mileageRate = 0.50; // Per mile
        const distance = 5; // Calculate actual distance
        const mileagePay = distance * mileageRate;
        const totalEarnings = basePay + mileagePay + (order.tip || 0);

        // Create earning record
        await prisma.earning.create({
          data: {
            driverId: socket.userId!,
            orderId: orderId,
            type: 'BASE_PAY',
            amount: totalEarnings
          }
        });

        // Update driver earnings
        await prisma.driver.update({
          where: { userId: socket.userId },
          data: {
            totalEarnings: {
              increment: totalEarnings
            },
            pendingEarnings: {
              increment: totalEarnings
            },
            totalDeliveries: {
              increment: 1
            }
          }
        });
      }

      // Notify customer
      const statusMessages = {
        PICKED_UP: 'Your order has been picked up and is on the way!',
        IN_TRANSIT: 'Your order is in transit',
        DELIVERED: 'Your order has been delivered! Enjoy your purchase!'
      };

      io.to(`user:${order.customer.id}`).emit('order:status_update', {
        orderId: orderId,
        status: status,
        message: statusMessages[status as keyof typeof statusMessages] || `Order status updated to ${status}`,
        timestamp: new Date()
      });

      // Notify admins
      io.to('admins').emit('order:status_update', {
        orderId: orderId,
        status: status,
        driverId: socket.userId,
        timestamp: new Date()
      });

      logger.info(`Order ${orderId} status updated to ${status} by driver ${socket.userId}`);
    } catch (error) {
      logger.error('Error updating order status:', error);
      socket.emit('error', { message: 'Failed to update order status' });
    }
  });
}

// Customer-specific socket handlers
function handleCustomerConnection(socket: AuthenticatedSocket, io: Server) {
  // Customer places order
  socket.on('customer:order_placed', (data) => {
    // Notify all online drivers about new order
    io.to('drivers').emit('order:new_order_available', {
      orderId: data.orderId,
      customerLocation: data.location,
      orderValue: data.total,
      distance: data.estimatedDistance,
      items: data.items
    });

    // Notify admins
    io.to('admins').emit('order:new_order', {
      orderId: data.orderId,
      customerId: socket.userId,
      timestamp: new Date()
    });
  });

  // Customer cancels order
  socket.on('customer:cancel_order', async (data) => {
    try {
      const { orderId, reason } = data;

      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });

      // Notify assigned driver if any
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { driver: true }
      });

      if (order?.driverId) {
        io.to(`user:${order.driverId}`).emit('order:cancelled', {
          orderId: orderId,
          reason: reason
        });
      }

      // Notify admins
      io.to('admins').emit('order:cancelled', {
        orderId: orderId,
        customerId: socket.userId,
        reason: reason
      });

      logger.info(`Order ${orderId} cancelled by customer ${socket.userId}`);
    } catch (error) {
      logger.error('Error cancelling order:', error);
    }
  });
}

// Admin-specific socket handlers
function handleAdminConnection(socket: AuthenticatedSocket, io: Server) {
  // Admin joins specific monitoring rooms
  socket.join('order_monitoring');
  socket.join('driver_monitoring');
  socket.join('system_monitoring');

  // Admin broadcasts system message
  socket.on('admin:broadcast_message', (data) => {
    const { message, type, targetAudience } = data;

    switch (targetAudience) {
      case 'drivers':
        io.to('drivers').emit('system:message', {
          message,
          type,
          from: 'admin',
          timestamp: new Date()
        });
        break;
      case 'customers':
        io.to('customers').emit('system:message', {
          message,
          type,
          from: 'admin',
          timestamp: new Date()
        });
        break;
      case 'all':
        io.emit('system:message', {
          message,
          type,
          from: 'admin',
          timestamp: new Date()
        });
        break;
    }
  });

  // Admin manually assigns order to driver
  socket.on('admin:assign_order', async (data) => {
    try {
      const { orderId, driverId } = data;

      await prisma.order.update({
        where: { id: orderId },
        data: {
          driverId: driverId,
          status: 'ASSIGNED'
        }
      });

      // Notify driver
      io.to(`user:${driverId}`).emit('order:assigned', {
        orderId: orderId,
        message: 'You have been assigned a new order'
      });

      logger.info(`Admin ${socket.userId} assigned order ${orderId} to driver ${driverId}`);
    } catch (error) {
      logger.error('Error assigning order:', error);
    }
  });
}

// Handle socket disconnection
function handleDisconnection(socket: AuthenticatedSocket, io: Server) {
  if (socket.userRole === 'DRIVER') {
    // Update driver offline status
    prisma.driver.update({
      where: { userId: socket.userId },
      data: {
        isOnline: false,
        lastLocationUpdate: new Date()
      }
    }).catch(error => {
      logger.error('Error updating driver offline status on disconnect:', error);
    });
  }
}

// Utility function to emit to specific user
export function emitToUser(io: Server, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

// Utility function to emit to all users of a role
export function emitToRole(io: Server, role: string, event: string, data: any) {
  const roomName = role.toLowerCase() + 's'; // drivers, admins, customers
  io.to(roomName).emit(event, data);
}
