import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';

// Create a new Expo SDK client
const expo = new Expo();

export interface PushNotificationData {
  type: string;
  orderId?: string;
  driverId?: string;
  customerId?: string;
  [key: string]: any;
}

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: PushNotificationData
): Promise<boolean> {
  try {
    // Check that the push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
      logger.error(`Push token ${pushToken} is not a valid Expo push token`);
      return false;
    }

    // Construct the message
    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: data || {},
      badge: 1,
      priority: 'high'
    };

    // Send the notification
    const chunks = expo.chunkPushNotifications([message]);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error('Error sending push notification chunk:', error);
      }
    }

    // Handle tickets and errors
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        logger.error(`Push notification error: ${ticket.message}`);
        
        // If the error is due to an invalid token, mark it as inactive
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await prisma.pushToken.updateMany({
            where: { token: pushToken },
            data: { isActive: false }
          });
        }
        
        return false;
      }
    }

    logger.info(`Push notification sent successfully to ${pushToken}`);
    return true;

  } catch (error) {
    logger.error('Error sending push notification:', error);
    return false;
  }
}

export async function sendBulkPushNotifications(
  recipients: Array<{ token: string; title: string; body: string; data?: PushNotificationData }>,
  batchSize: number = 100
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let failedCount = 0;

  // Process in batches to avoid rate limits
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const messages: ExpoPushMessage[] = batch
      .filter(recipient => Expo.isExpoPushToken(recipient.token))
      .map(recipient => ({
        to: recipient.token,
        sound: 'default',
        title: recipient.title,
        body: recipient.body,
        data: recipient.data || {},
        badge: 1,
        priority: 'high'
      }));

    if (messages.length === 0) {
      failedCount += batch.length;
      continue;
    }

    try {
      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          logger.error('Error sending bulk push notification chunk:', error);
          failedCount += chunk.length;
        }
      }

      // Process tickets
      for (let j = 0; j < tickets.length; j++) {
        const ticket = tickets[j];
        const originalMessage = messages[j];

        if (ticket.status === 'ok') {
          successCount++;
        } else {
          failedCount++;
          logger.error(`Bulk push notification error: ${ticket.message}`);
          
          // Handle invalid tokens
          if (ticket.details?.error === 'DeviceNotRegistered') {
            await prisma.pushToken.updateMany({
              where: { token: originalMessage.to as string },
              data: { isActive: false }
            });
          }
        }
      }

    } catch (error) {
      logger.error('Error in bulk push notification batch:', error);
      failedCount += batch.length;
    }

    // Add delay between batches to respect rate limits
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  logger.info(`Bulk push notifications completed: ${successCount} success, ${failedCount} failed`);
  
  return { success: successCount, failed: failedCount };
}

export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: PushNotificationData
): Promise<boolean> {
  try {
    // Get all active push tokens for the user
    const pushTokens = await prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    if (pushTokens.length === 0) {
      logger.warn(`No active push tokens found for user ${userId}`);
      return false;
    }

    // Save notification to database
    await prisma.notification.create({
      data: {
        userId,
        title,
        message: body,
        type: data?.type || 'SYSTEM',
        data: data ? JSON.stringify(data) : null
      }
    });

    // Send to all user's devices
    let sentSuccessfully = false;
    
    for (const pushToken of pushTokens) {
      const success = await sendPushNotification(pushToken.token, title, body, data);
      if (success) {
        sentSuccessfully = true;
      }
    }

    return sentSuccessfully;

  } catch (error) {
    logger.error('Error sending notification to user:', error);
    return false;
  }
}

export async function sendNotificationToRole(
  role: 'CUSTOMER' | 'DRIVER' | 'ADMIN',
  title: string,
  body: string,
  data?: PushNotificationData
): Promise<{ success: number; failed: number }> {
  try {
    // Get all users with the specified role and their push tokens
    const users = await prisma.user.findMany({
      where: {
        role,
        isActive: true
      },
      include: {
        pushTokens: {
          where: { isActive: true }
        }
      }
    });

    // Prepare bulk notifications
    const recipients: Array<{
      token: string;
      title: string;
      body: string;
      data?: PushNotificationData;
    }> = [];

    for (const user of users) {
      // Save notification to database for each user
      await prisma.notification.create({
        data: {
          userId: user.id,
          title,
          message: body,
          type: data?.type || 'SYSTEM',
          data: data ? JSON.stringify(data) : null
        }
      });

      // Add push tokens to recipients list
      for (const pushToken of user.pushTokens) {
        recipients.push({
          token: pushToken.token,
          title,
          body,
          data
        });
      }
    }

    // Send bulk notifications
    const result = await sendBulkPushNotifications(recipients);
    
    logger.info(`Sent notifications to ${role}: ${result.success} success, ${result.failed} failed`);
    
    return result;

  } catch (error) {
    logger.error('Error sending notification to role:', error);
    return { success: 0, failed: 0 };
  }
}

export async function sendOrderNotification(
  orderId: string,
  type: 'new_order' | 'status_update' | 'assignment' | 'cancellation',
  customTitle?: string,
  customBody?: string
): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            pushTokens: {
              where: { isActive: true }
            }
          }
        },
        driver: {
          include: {
            user: {
              include: {
                pushTokens: {
                  where: { isActive: true }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      logger.error(`Order ${orderId} not found for notification`);
      return;
    }

    const notificationData: PushNotificationData = {
      type: 'order_notification',
      orderId,
      orderNumber: order.orderNumber,
      notificationType: type
    };

    let title = customTitle;
    let body = customBody;

    // Generate default messages if not provided
    if (!title || !body) {
      switch (type) {
        case 'new_order':
          title = 'New Order Available!';
          body = `Order ${order.orderNumber} - $${order.total.toFixed(2)}`;
          break;
        case 'status_update':
          title = 'Order Update';
          body = `Your order ${order.orderNumber} status has been updated`;
          break;
        case 'assignment':
          title = 'Order Assigned';
          body = `You have been assigned order ${order.orderNumber}`;
          break;
        case 'cancellation':
          title = 'Order Cancelled';
          body = `Order ${order.orderNumber} has been cancelled`;
          break;
      }
    }

    // Send to customer if applicable
    if (['status_update', 'assignment'].includes(type)) {
      for (const pushToken of order.customer.pushTokens) {
        await sendPushNotification(pushToken.token, title!, body!, notificationData);
      }
    }

    // Send to driver if applicable
    if (['assignment', 'cancellation'].includes(type) && order.driver) {
      for (const pushToken of order.driver.user.pushTokens) {
        await sendPushNotification(pushToken.token, title!, body!, notificationData);
      }
    }

    // Send to all drivers for new orders
    if (type === 'new_order') {
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
          await sendPushNotification(pushToken.token, title!, body!, notificationData);
        }
      }
    }

    logger.info(`Order notification sent: ${type} for order ${orderId}`);

  } catch (error) {
    logger.error('Error sending order notification:', error);
  }
}

export async function sendEarningsNotification(
  driverId: string,
  amount: number,
  type: 'withdrawal_completed' | 'earnings_available' | 'payment_processed'
): Promise<void> {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
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

    if (!driver) {
      logger.error(`Driver ${driverId} not found for earnings notification`);
      return;
    }

    let title: string;
    let body: string;

    switch (type) {
      case 'withdrawal_completed':
        title = 'Withdrawal Completed';
        body = `Your withdrawal of $${amount.toFixed(2)} has been processed`;
        break;
      case 'earnings_available':
        title = 'Earnings Available';
        body = `You have $${amount.toFixed(2)} available for withdrawal`;
        break;
      case 'payment_processed':
        title = 'Payment Received';
        body = `You earned $${amount.toFixed(2)} from your recent delivery`;
        break;
    }

    const notificationData: PushNotificationData = {
      type: 'earnings_notification',
      driverId,
      amount,
      notificationType: type
    };

    for (const pushToken of driver.user.pushTokens) {
      await sendPushNotification(pushToken.token, title, body, notificationData);
    }

    logger.info(`Earnings notification sent: ${type} for driver ${driverId}`);

  } catch (error) {
    logger.error('Error sending earnings notification:', error);
  }
}

export async function cleanupInactiveTokens(): Promise<number> {
  try {
    const result = await prisma.pushToken.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
        }
      }
    });

    logger.info(`Cleaned up ${result.count} inactive push tokens`);
    return result.count;

  } catch (error) {
    logger.error('Error cleaning up inactive tokens:', error);
    return 0;
  }
}
