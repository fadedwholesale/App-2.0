// Simple WebSocket service for real-time sync
// Minimal implementation to avoid import issues

export class SimpleWebSocketService {
  private ws: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  connect(token?: string) {
    try {
      // Use a WebSocket URL that might work, or fall back to simulation
      const wsUrl = 'ws://localhost:3001';
      console.log('🔌 Attempting WebSocket connection:', wsUrl);

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.reconnectAttempts = 0;
          this.emit('connected', { token });
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.emit('disconnected', {});
          this.attemptReconnect(token);
        };

        this.ws.onerror = (error) => {
          console.warn('🔌 WebSocket error (falling back to simulation):', error);
          this.simulateConnection(token);
        };

      } catch (wsError) {
        console.warn('WebSocket not available, using simulation mode');
        this.simulateConnection(token);
      }

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.simulateConnection(token);
    }
  }

  private simulateConnection(token?: string) {
    console.log('🔌 WebSocket simulation mode enabled for:', token);
    setTimeout(() => {
      this.emit('connected', { token, simulated: true });
    }, 100);
  }

  private attemptReconnect(token?: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`🔌 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect(token);
      }, 2000 * this.reconnectAttempts);
    } else {
      console.log('🔌 Max reconnection attempts reached, using simulation mode');
      this.simulateConnection(token);
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
