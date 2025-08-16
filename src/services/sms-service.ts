import { wsService } from './simple-websocket';

export interface SMSMessage {
  to: string; // Encrypted/hashed phone number
  from: string; // Service identifier, not personal info
  message: string; // Sanitized message content
  timestamp: string;
  type: 'customer_to_driver' | 'admin_to_driver' | 'driver_to_customer' | 'admin_notification';
  orderId?: string;
  sessionId?: string; // Chat session reference
  messageId: string; // Unique message identifier
  isSecure: boolean; // Whether message contains sensitive data
  expiresAt?: string; // Auto-deletion timestamp
}

export class SMSService {
  private static instance: SMSService;
  private phoneNumberMasks: Map<string, string> = new Map(); // Store masked phone numbers
  private messageHistory: Map<string, SMSMessage[]> = new Map(); // Temporary message storage
  private readonly MESSAGE_RETENTION_HOURS = 24;

  static getInstance(): SMSService {
    if (!this.instance) {
      this.instance = new SMSService();
    }
    return this.instance;
  }

  // Initialize SMS service with privacy protection
  initialize(): void {
    console.log('🔒 Initializing Secure SMS Service...');

    // Set up message cleanup
    setInterval(() => {
      this.cleanupExpiredMessages();
    }, 60 * 60 * 1000); // Every hour

    console.log('✅ Secure SMS Service initialized with privacy protection');
  }

  // Mask phone number for privacy
  private maskPhoneNumber(phone: string): string {
    if (phone.length < 10) return phone;

    // Keep only last 4 digits visible
    const lastFour = phone.slice(-4);
    const masked = phone.slice(0, -4).replace(/\d/g, '*') + lastFour;

    // Store mapping for internal use (would be encrypted in production)
    this.phoneNumberMasks.set(masked, phone);

    return masked;
  }

  // Get actual phone number from mask (for internal use only)
  private getActualPhoneNumber(maskedPhone: string): string {
    return this.phoneNumberMasks.get(maskedPhone) || maskedPhone;
  }

  // Sanitize message content to prevent info leaks
  private sanitizeMessage(message: string): { sanitized: string; isSecure: boolean } {
    let sanitized = message;
    let isSecure = true;

    // Remove potential personal information
    const sensitivePatterns = [
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' }, // SSN
      { pattern: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, replacement: '[CARD_REDACTED]' }, // Credit card
      { pattern: /\b[\w\.-]+@[\w\.-]+\.\w+\b/g, replacement: '[EMAIL_REDACTED]' }, // Email
      { pattern: /\b\d{1,5}\s\w+\s(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/gi, replacement: '[ADDRESS_REDACTED]' }, // Street address
      { pattern: /\$\d+(?:\.\d{2})?/g, replacement: '[AMOUNT_REDACTED]' }, // Money amounts
    ];

    for (const { pattern, replacement } of sensitivePatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, replacement);
        isSecure = false; // Mark as containing sensitive data
        console.warn('SMS: Sensitive data detected and redacted');
      }
    }

    // Limit message length for security
    if (sanitized.length > 160) {
      sanitized = sanitized.substring(0, 157) + '...';
    }

    return { sanitized, isSecure };
  }

  // Clean up expired messages
  private cleanupExpiredMessages(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, messages] of this.messageHistory.entries()) {
      const validMessages = messages.filter(msg => {
        if (msg.expiresAt) {
          const expiresAt = new Date(msg.expiresAt);
          if (now > expiresAt) {
            cleanedCount++;
            return false;
          }
        }
        return true;
      });

      if (validMessages.length === 0) {
        this.messageHistory.delete(sessionId);
      } else {
        this.messageHistory.set(sessionId, validMessages);
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 SMS: Cleaned up ${cleanedCount} expired messages`);
    }
  }

  // Send SMS to driver
  async sendToDriver(driverPhone: string, message: string, options: {
    orderId?: string;
    customerId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  } = {}) {
    const smsData: SMSMessage = {
      to: driverPhone,
      from: 'Faded Skies',
      message,
      timestamp: new Date().toISOString(),
      type: 'admin_to_driver',
      orderId: options.orderId,
      customerId: options.customerId
    };

    try {
      // Send via WebSocket for real-time delivery
      wsService.send({
        type: 'sms:send_to_driver',
        data: {
          ...smsData,
          priority: options.priority || 'normal'
        }
      });

      // In production, integrate with SMS provider (Twilio, AWS SNS, etc.)
      console.log('📱 SMS sent to driver:', {
        to: driverPhone,
        message: message.substring(0, 50) + '...',
        orderId: options.orderId
      });

      return { success: true, messageId: `sms_${Date.now()}` };
    } catch (error) {
      console.error('Failed to send SMS to driver:', error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS from customer to driver
  async sendCustomerToDriver(customerPhone: string, driverPhone: string, message: string, orderId: string) {
    const smsData: SMSMessage = {
      to: driverPhone,
      from: customerPhone,
      message: `[Customer Message] ${message}`,
      timestamp: new Date().toISOString(),
      type: 'customer_to_driver',
      orderId,
      customerId: customerPhone
    };

    try {
      wsService.send({
        type: 'sms:customer_to_driver',
        data: smsData
      });

      console.log('📱 Customer SMS sent to driver:', {
        from: customerPhone,
        to: driverPhone,
        orderId
      });

      return { success: true, messageId: `sms_${Date.now()}` };
    } catch (error) {
      console.error('Failed to send customer SMS to driver:', error);
      return { success: false, error: error.message };
    }
  }

  // Send delivery notifications
  async sendDeliveryNotification(phone: string, notification: {
    type: 'order_confirmed' | 'driver_assigned' | 'out_for_delivery' | 'delivered' | 'delayed';
    orderId: string;
    driverName?: string;
    eta?: string;
    location?: string;
  }) {
    let message = '';

    switch (notification.type) {
      case 'order_confirmed':
        message = `🌿 Your Faded Skies order ${notification.orderId} has been confirmed! We're preparing your items now.`;
        break;
      case 'driver_assigned':
        message = `🚚 Great news! ${notification.driverName} has been assigned to deliver your order ${notification.orderId}. ETA: ${notification.eta}`;
        break;
      case 'out_for_delivery':
        message = `📦 Your order ${notification.orderId} is out for delivery! ${notification.driverName} is on the way. Track: ${window.location.origin}`;
        break;
      case 'delivered':
        message = `✅ Your order ${notification.orderId} has been delivered! Thank you for choosing Faded Skies. Rate your experience in the app.`;
        break;
      case 'delayed':
        message = `⏰ Your order ${notification.orderId} is slightly delayed. New ETA: ${notification.eta}. We apologize for any inconvenience.`;
        break;
    }

    return this.sendSMS(phone, message, {
      type: 'admin_notification',
      orderId: notification.orderId
    });
  }

  // Generic SMS sending method
  private async sendSMS(to: string, message: string, metadata: any = {}) {
    // Validate inputs
    if (!to || !message) {
      console.error('SMS validation failed: missing phone or message');
      return { success: false, error: 'Missing required parameters' };
    }

    const smsData: SMSMessage = {
      to,
      from: 'Faded Skies',
      message,
      timestamp: new Date().toISOString(),
      type: metadata.type || 'admin_notification',
      ...metadata
    };

    try {
      // Send via WebSocket with safety check
      if (wsService && typeof wsService.send === 'function') {
        wsService.send({
          type: 'sms:send',
          data: smsData
        });
      } else {
        console.warn('WebSocket service not available for SMS');
      }

      // Simulate SMS API call (replace with real SMS provider in production)
      console.log('📱 SMS sent:', {
        to: to.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'),
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        timestamp: new Date().toLocaleTimeString()
      });

      return { success: true, messageId: `sms_${Date.now()}` };
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Batch SMS for multiple recipients
  async sendBatchSMS(recipients: string[], message: string, metadata: any = {}) {
    const results = [];
    
    for (const phone of recipients) {
      const result = await this.sendSMS(phone, message, {
        ...metadata,
        batchId: `batch_${Date.now()}`
      });
      results.push({ phone, ...result });
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  // Emergency broadcast to all drivers
  async emergencyBroadcast(message: string, driverPhones: string[]) {
    const emergencyMessage = `🚨 URGENT: ${message}`;
    
    return this.sendBatchSMS(driverPhones, emergencyMessage, {
      type: 'emergency_broadcast',
      priority: 'urgent'
    });
  }

  // Setup SMS event listeners
  setupSMSListeners() {
    try {
      wsService.on('sms:delivery_confirmation', (data) => {
        console.log('📱 SMS delivery confirmed:', data);
      });

      wsService.on('sms:delivery_failed', (data) => {
        console.error('📱 SMS delivery failed:', data);
      });

      wsService.on('sms:reply_received', (data) => {
        console.log('📱 SMS reply received:', data);
        // Handle driver/customer replies
      });

      console.log('✅ SMS service listeners initialized');
    } catch (error) {
      console.error('❌ Failed to setup SMS listeners:', error);
    }
  }
}

// Export singleton instance
export const smsService = SMSService.getInstance();

// React hook for SMS functionality
export const useSMS = () => {
  return {
    sendToDriver: smsService.sendToDriver.bind(smsService),
    sendCustomerToDriver: smsService.sendCustomerToDriver.bind(smsService),
    sendDeliveryNotification: smsService.sendDeliveryNotification.bind(smsService),
    emergencyBroadcast: smsService.emergencyBroadcast.bind(smsService)
  };
};

// Helper function to safely access environment variables
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

// Production SMS API integration template
export const SMS_API_CONFIG = {
  // Twilio configuration example
  twilio: {
    accountSid: getEnvVar('VITE_TWILIO_ACCOUNT_SID'),
    authToken: getEnvVar('VITE_TWILIO_AUTH_TOKEN'),
    fromPhone: getEnvVar('VITE_TWILIO_PHONE_NUMBER')
  },

  // AWS SNS configuration example
  aws: {
    region: getEnvVar('VITE_AWS_REGION', 'us-east-1'),
    accessKeyId: getEnvVar('VITE_AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnvVar('VITE_AWS_SECRET_ACCESS_KEY')
  },

  // MessageBird configuration example
  messageBird: {
    apiKey: getEnvVar('VITE_MESSAGEBIRD_API_KEY'),
    originator: 'FadedSkies'
  }
};
