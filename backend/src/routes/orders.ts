import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { calculateDeliveryFee, calculateTax } from '../utils/calculations';
import { sendPushNotification } from '../services/notifications';
import { io } from '../server';

const router = express.Router();

// Create new order
router.post('/', [
  body('items').isArray({ min: 1 }),
  body('items.*.productId').notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('deliveryAddress').notEmpty(),
  body('deliveryLat').optional().isFloat(),
  body('deliveryLng').optional().isFloat(),
  body('paymentMethod').notEmpty(),
  body('specialInstructions').optional().isString(),
  body('tip').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      items,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      paymentMethod,
      specialInstructions,
      tip = 0
    } = req.body;

    const userId = req.user.userId;

    // Verify all products exist and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(400).json({
          error: `Product with ID ${item.productId} not found`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          error: `Product ${product.name} is not available`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Calculate fees
    const deliveryFee = calculateDeliveryFee(subtotal, deliveryLat, deliveryLng);
    const tax = calculateTax(subtotal);
    const total = subtotal + tax + deliveryFee + tip;

    // Generate unique order number
    const orderNumber = `FS${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: userId,
        subtotal,
        tax,
        deliveryFee,
        tip,
        total,
        paymentMethod,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        specialInstructions,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true
      }
    });

    // Create initial status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'PENDING'
      }
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });

      // Log inventory change
      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          type: 'SALE',
          quantity: -item.quantity,
          reason: `Order ${orderNumber}`,
          previousQty: 0, // Will be updated by trigger
          newQty: 0
        }
      });
    }

    // Emit real-time event for new order
    if (io) {
      io.to('drivers').emit('order:new_order_available', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerLocation: { lat: deliveryLat, lng: deliveryLng },
        deliveryAddress,
        orderValue: total,
        estimatedDistance: 5, // Calculate actual distance
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity
        })),
        createdAt: order.createdAt
      });

      io.to('admins').emit('order:new_order', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: userId,
        total,
        timestamp: new Date()
      });
    }

    // Send push notification to available drivers
    const availableDrivers = await prisma.driver.findMany({
      where: {
        isOnline: true,
        isAvailable: true
      },
      include: {
        user: {
          include: {
            pushTokens: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    for (const driver of availableDrivers) {
      for (const pushToken of driver.user.pushTokens) {
        await sendPushNotification(
          pushToken.token,
          'New Order Available!',
          `Order ${orderNumber} - $${total.toFixed(2)} - ${deliveryAddress}`,
          {
            type: 'new_order',
            orderId: order.id
          }
        );
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        estimatedDelivery: order.estimatedDelivery,
        items: order.items
      }
    });

    logger.info(`New order created: ${orderNumber} by user ${userId}`);

  } catch (error) {
    logger.error('Create order error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get user's orders
router.get('/', [
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.userId;
    const userRole = req.user.role;
    const { status, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let whereClause: any = {};

    // Filter based on user role
    if (userRole === 'CUSTOMER') {
      whereClause.customerId = userId;
    } else if (userRole === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { userId }
      });
      if (driver) {
        whereClause.driverId = driver.id;
      }
    }
    // Admins can see all orders (no additional filter)

    if (status) {
      whereClause.status = status;
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              product: true
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          driver: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true
                }
              }
            }
          },
          statusHistory: {
            orderBy: {
              timestamp: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: Number(limit)
      }),
      prisma.order.count({ where: whereClause })
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Get specific order
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        driver: {
          include: {
            user: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    // Check if user has permission to view this order
    if (userRole === 'CUSTOMER' && order.customerId !== userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    if (userRole === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { userId }
      });
      if (driver && order.driverId !== driver.id) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    res.json({ order });

  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Update order status (drivers and admins only)
router.patch('/:orderId/status', [
  body('status').isIn(['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { orderId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check permissions
    if (!['DRIVER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    // If driver, verify they are assigned to this order
    if (userRole === 'DRIVER') {
      const driver = await prisma.driver.findUnique({
        where: { userId }
      });
      
      if (!driver || order.driverId !== driver.id) {
        return res.status(403).json({
          error: 'You are not assigned to this order'
        });
      }
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined
      },
      include: {
        customer: true,
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    // Create status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status,
        notes
      }
    });

    // Handle driver earnings for delivered orders
    if (status === 'DELIVERED' && userRole === 'DRIVER') {
      const basePay = 6.00;
      const mileageRate = 0.50;
      const distance = 5; // Calculate actual distance
      const mileagePay = distance * mileageRate;
      const totalEarnings = basePay + mileagePay + (order.tip || 0);

      // Create earning records
      await prisma.earning.createMany({
        data: [
          {
            driverId: order.driverId!,
            orderId: orderId,
            type: 'BASE_PAY',
            amount: basePay
          },
          {
            driverId: order.driverId!,
            orderId: orderId,
            type: 'MILEAGE',
            amount: mileagePay
          },
          {
            driverId: order.driverId!,
            orderId: orderId,
            type: 'TIP',
            amount: order.tip || 0
          }
        ]
      });

      // Update driver earnings
      await prisma.driver.update({
        where: { id: order.driverId! },
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

    // Emit real-time updates
    if (io) {
      // Notify customer
      io.to(`user:${order.customerId}`).emit('order:status_update', {
        orderId,
        status,
        message: getStatusMessage(status),
        timestamp: new Date()
      });

      // Notify admins
      io.to('admins').emit('order:status_update', {
        orderId,
        status,
        driverId: order.driverId,
        timestamp: new Date()
      });
    }

    // Send push notification to customer
    const customerPushTokens = await prisma.pushToken.findMany({
      where: {
        userId: order.customerId,
        isActive: true
      }
    });

    for (const pushToken of customerPushTokens) {
      await sendPushNotification(
        pushToken.token,
        'Order Update',
        getStatusMessage(status),
        {
          type: 'order_update',
          orderId,
          status
        }
      );
    }

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });

    logger.info(`Order ${orderId} status updated to ${status} by ${userRole} ${userId}`);

  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Cancel order (customers only, within certain time window)
router.patch('/:orderId/cancel', [
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        driver: {
          include: {
            user: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    if (order.customerId !== userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Check if order can be cancelled
    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({
        error: 'Order cannot be cancelled'
      });
    }

    // Check time window (e.g., can't cancel if driver already picked up)
    if (['PICKED_UP', 'IN_TRANSIT'].includes(order.status)) {
      return res.status(400).json({
        error: 'Order cannot be cancelled after pickup'
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'CANCELLED',
        notes: reason || 'Cancelled by customer'
      }
    });

    // Restore product stock
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId }
    });

    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });

      // Log inventory restoration
      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          type: 'ADJUSTMENT',
          quantity: item.quantity,
          reason: `Order cancellation: ${order.orderNumber}`,
          previousQty: 0,
          newQty: 0
        }
      });
    }

    // Notify driver if assigned
    if (order.driverId && io) {
      io.to(`user:${order.driverId}`).emit('order:cancelled', {
        orderId,
        reason: reason || 'Cancelled by customer',
        orderNumber: order.orderNumber
      });

      // Send push notification to driver
      const driverPushTokens = await prisma.pushToken.findMany({
        where: {
          userId: order.driver?.userId,
          isActive: true
        }
      });

      for (const pushToken of driverPushTokens) {
        await sendPushNotification(
          pushToken.token,
          'Order Cancelled',
          `Order ${order.orderNumber} has been cancelled by the customer`,
          {
            type: 'order_cancelled',
            orderId
          }
        );
      }
    }

    res.json({
      message: 'Order cancelled successfully'
    });

    logger.info(`Order ${orderId} cancelled by customer ${userId}`);

  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Helper function to get status messages
function getStatusMessage(status: string): string {
  const messages = {
    PENDING: 'Your order has been placed and is being processed',
    CONFIRMED: 'Your order has been confirmed',
    PREPARING: 'Your order is being prepared',
    READY_FOR_PICKUP: 'Your order is ready for pickup',
    ASSIGNED: 'A driver has been assigned to your order',
    ACCEPTED: 'Your driver has accepted the order',
    PICKED_UP: 'Your order has been picked up and is on the way',
    IN_TRANSIT: 'Your order is in transit',
    DELIVERED: 'Your order has been delivered! Enjoy your purchase!',
    CANCELLED: 'Your order has been cancelled'
  };

  return messages[status as keyof typeof messages] || `Order status updated to ${status}`;
}

export default router;
