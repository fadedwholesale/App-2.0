// Simple WebSocket service for real-time sync
// Minimal implementation to avoid import issues

export class SimpleWebSocketService {
  private ws: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  connect(token?: string) {
    try {
      const wsUrl = 'ws://localhost:3001';
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      // For now, just log the connection attempt
      // Actual WebSocket connection can be added later
      console.log('✅ WebSocket connection simulated for:', token);
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }

  disconnect() {
    console.log('🔌 WebSocket disconnected');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any) {
    console.log('📡 WebSocket message (simulated):', message);
    // For now just log, actual sending can be added later
  }

  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }
    
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

// Export singleton instance
export const wsService = new SimpleWebSocketService();

// Simple API service
export const apiService = {
  register: async (userData: any) => {
    console.log('📝 Registration (simulated):', userData);
    return {
      success: true,
      data: {
        user: {
          name: userData.name,
          email: userData.email,
          isVerified: true
        },
        token: 'mock-jwt-token'
      }
    };
  },
  
  login: async (email: string, password: string) => {
    console.log('🔐 Login (simulated):', email);
    return {
      success: true,
      data: {
        user: {
          name: 'User',
          email: email,
          isVerified: true
        },
        token: 'mock-jwt-token'
      }
    };
  },

  createOrder: async (orderData: any) => {
    console.log('📦 Order creation (simulated):', orderData);
    return {
      success: true,
      data: {
        id: 'order-' + Date.now(),
        status: 'confirmed'
      }
    };
  }
};
