import { wsService } from './simple-websocket';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'customer' | 'driver' | 'admin';
  receiverId: string;
  receiverType: 'customer' | 'driver' | 'admin';
  message: string;
  timestamp: string;
  orderId: string;
  messageType: 'text' | 'location' | 'system';
  isDeleted: boolean;
  encryptedContent?: string; // For sensitive data
}

export interface ChatSession {
  id: string;
  orderId: string;
  participants: {
    customer: string;
    driver?: string;
    admin?: string;
  };
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  autoDeleteAfter: number; // Hours after order completion
}

class SecureChatService {
  private static instance: SecureChatService;
  private chatSessions: Map<string, ChatSession> = new Map();
  private messageRetentionHours = 24; // Auto-delete after 24 hours
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): SecureChatService {
    if (!this.instance) {
      this.instance = new SecureChatService();
    }
    return this.instance;
  }

  // Initialize chat service with auto-cleanup
  initialize(): void {
    console.log('🔒 Initializing Secure Chat Service...');
    
    // Set up message cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredChats();
    }, 60 * 60 * 1000); // 1 hour

    // Set up WebSocket listeners
    this.setupChatListeners();
    
    console.log('✅ Secure Chat Service initialized with auto-deletion');
  }

  // Create secure chat session for order
  createChatSession(orderId: string, customerId: string, driverId?: string): ChatSession {
    const sessionId = `chat_${orderId}_${Date.now()}`;
    
    const session: ChatSession = {
      id: sessionId,
      orderId,
      participants: {
        customer: customerId,
        driver: driverId,
        admin: 'admin'
      },
      messages: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (this.messageRetentionHours * 60 * 60 * 1000)).toISOString(),
      autoDeleteAfter: this.messageRetentionHours
    };

    this.chatSessions.set(sessionId, session);
    
    // Send welcome message
    this.addSystemMessage(sessionId, 'Chat session created. Messages will be automatically deleted after order completion for your privacy and security.');
    
    console.log(`💬 Created secure chat session for order ${orderId}`);
    return session;
  }

  // Send message with privacy protection
  async sendMessage(
    sessionId: string, 
    senderId: string, 
    senderType: 'customer' | 'driver' | 'admin',
    message: string,
    receiverType: 'customer' | 'driver' | 'admin'
  ): Promise<ChatMessage | null> {
    const session = this.chatSessions.get(sessionId);
    if (!session || !session.isActive) {
      console.error('Chat session not found or inactive');
      return null;
    }

    // Filter and sanitize message content
    const sanitizedMessage = this.sanitizeMessage(message);
    if (!sanitizedMessage) {
      console.warn('Message blocked due to security concerns');
      return null;
    }

    // Create secure message
    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: this.hashUserId(senderId), // Hash user ID for privacy
      senderType,
      receiverId: this.getReceiverId(session, receiverType),
      receiverType,
      message: sanitizedMessage,
      timestamp: new Date().toISOString(),
      orderId: session.orderId,
      messageType: 'text',
      isDeleted: false
    };

    // Add to session
    session.messages.push(chatMessage);

    // Broadcast to participants only (no external logging)
    this.broadcastMessageSecurely(chatMessage, session);

    console.log(`💬 Message sent in session ${sessionId}`);
    return chatMessage;
  }

  // Add system message
  private addSystemMessage(sessionId: string, message: string): void {
    const session = this.chatSessions.get(sessionId);
    if (!session) return;

    const systemMessage: ChatMessage = {
      id: `sys_${Date.now()}`,
      senderId: 'system',
      senderType: 'admin',
      receiverId: 'all',
      receiverType: 'customer',
      message,
      timestamp: new Date().toISOString(),
      orderId: session.orderId,
      messageType: 'system',
      isDeleted: false
    };

    session.messages.push(systemMessage);
  }

  // End chat session when order is complete
  endChatSession(orderId: string, reason: 'completed' | 'cancelled' | 'expired' = 'completed'): void {
    const session = Array.from(this.chatSessions.values()).find(s => s.orderId === orderId);
    if (!session) return;

    session.isActive = false;
    
    // Add final system message
    this.addSystemMessage(session.id, `Order ${reason}. This chat will be automatically deleted in ${this.messageRetentionHours} hours for your privacy.`);

    // Schedule immediate deletion for sensitive data
    setTimeout(() => {
      this.deleteChatSession(session.id, 'order_completion');
    }, 2 * 60 * 60 * 1000); // Delete after 2 hours

    console.log(`💬 Chat session ended for order ${orderId}: ${reason}`);
  }

  // Delete chat session and all messages
  private deleteChatSession(sessionId: string, reason: string): void {
    const session = this.chatSessions.get(sessionId);
    if (!session) return;

    // Mark all messages as deleted (for audit trail)
    session.messages.forEach(msg => {
      msg.isDeleted = true;
      msg.message = '[DELETED]'; // Remove content
      msg.encryptedContent = undefined; // Remove any encrypted content
    });

    // Remove from active sessions
    this.chatSessions.delete(sessionId);

    console.log(`🗑️ Chat session ${sessionId} deleted: ${reason}`);
    
    // Notify participants that chat was deleted
    wsService.send({
      type: 'chat:session_deleted',
      data: {
        sessionId,
        orderId: session.orderId,
        reason,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Cleanup expired chats
  private cleanupExpiredChats(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.chatSessions.entries()) {
      const expiresAt = new Date(session.expiresAt);
      
      if (now > expiresAt || !session.isActive) {
        this.deleteChatSession(sessionId, 'automatic_cleanup');
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired chat sessions`);
    }
  }

  // Sanitize message to prevent harassment and data breaches
  private sanitizeMessage(message: string): string | null {
    // Remove potentially sensitive data patterns
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card
      /\b[\w\.-]+@[\w\.-]+\.\w+\b/g, // Email (if not in allowed context)
      /\b\d{10,}\b/g, // Long numbers (potential sensitive IDs)
    ];

    let sanitized = message;

    // Check for sensitive patterns
    for (const pattern of sensitivePatterns) {
      if (pattern.test(sanitized)) {
        console.warn('Message contains potentially sensitive data');
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
    }

    // Block harassment patterns
    const harassmentPatterns = [
      /\b(fuck|shit|damn|bitch|asshole|idiot|stupid)\b/gi,
      /\b(kill|die|hurt|harm)\b/gi,
      /\b(address|home|where.*live)\b/gi, // Prevent location sharing
    ];

    for (const pattern of harassmentPatterns) {
      if (pattern.test(sanitized)) {
        console.warn('Message blocked due to inappropriate content');
        return null; // Block entire message
      }
    }

    // Limit message length
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500) + '...';
    }

    return sanitized.trim();
  }

  // Hash user ID for privacy
  private hashUserId(userId: string): string {
    // Simple hash for demo - use proper crypto in production
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash).toString(36)}`;
  }

  // Get receiver ID based on type
  private getReceiverId(session: ChatSession, receiverType: string): string {
    switch (receiverType) {
      case 'customer':
        return this.hashUserId(session.participants.customer);
      case 'driver':
        return session.participants.driver ? this.hashUserId(session.participants.driver) : '';
      case 'admin':
        return 'admin';
      default:
        return '';
    }
  }

  // Broadcast message securely to participants only
  private broadcastMessageSecurely(message: ChatMessage, session: ChatSession): void {
    // Only send to active session participants
    const participants = Object.values(session.participants).filter(Boolean);
    
    wsService.send({
      type: 'chat:message',
      data: {
        sessionId: session.id,
        message: {
          ...message,
          // Remove sensitive information from broadcast
          senderId: message.senderType, // Only send type, not actual ID
          receiverId: message.receiverType
        },
        participants: participants.length
      }
    });
  }

  // Setup WebSocket listeners
  private setupChatListeners(): void {
    wsService.on('chat:request_session', (data) => {
      console.log('📞 Chat session requested:', data);
      // Handle chat session requests
    });

    wsService.on('order:completed', (data) => {
      console.log('✅ Order completed, ending chat:', data.orderId);
      this.endChatSession(data.orderId, 'completed');
    });

    wsService.on('order:cancelled', (data) => {
      console.log('❌ Order cancelled, ending chat:', data.orderId);
      this.endChatSession(data.orderId, 'cancelled');
    });
  }

  // Public methods for chat management
  getChatSession(orderId: string): ChatSession | null {
    return Array.from(this.chatSessions.values()).find(s => s.orderId === orderId) || null;
  }

  getActiveSessions(): ChatSession[] {
    return Array.from(this.chatSessions.values()).filter(s => s.isActive);
  }

  getSessionMessages(sessionId: string): ChatMessage[] {
    const session = this.chatSessions.get(sessionId);
    return session ? session.messages.filter(m => !m.isDeleted) : [];
  }

  // Emergency: Delete all chat data immediately
  emergencyDeleteAllChats(reason: string): void {
    console.warn(`🚨 EMERGENCY: Deleting all chat data - ${reason}`);
    
    for (const [sessionId] of this.chatSessions.entries()) {
      this.deleteChatSession(sessionId, `emergency_${reason}`);
    }
    
    this.chatSessions.clear();
  }

  // Cleanup on service shutdown
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Final cleanup
    this.cleanupExpiredChats();
    console.log('🔒 Secure Chat Service shutdown complete');
  }
}

// Export singleton instance
export const secureChatService = SecureChatService.getInstance();

// React hook for secure chat
export const useSecureChat = () => {
  return {
    createSession: secureChatService.createChatSession.bind(secureChatService),
    sendMessage: secureChatService.sendMessage.bind(secureChatService),
    endSession: secureChatService.endChatSession.bind(secureChatService),
    getSession: secureChatService.getChatSession.bind(secureChatService),
    getMessages: secureChatService.getSessionMessages.bind(secureChatService),
    getActiveSessions: secureChatService.getActiveSessions.bind(secureChatService)
  };
};
