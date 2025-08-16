// Simple WebSocket service for real-time sync
// Minimal implementation to avoid import issues

export class SimpleWebSocketService {
  public ws: WebSocket | null = null; // Made public for testing
  public eventListeners: Map<string, Function[]> = new Map(); // Made public for testing
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('📡 WebSocket message sent:', message.type);
    } else {
      console.log('📡 WebSocket message (simulated):', message.type);
      // In simulation mode, emit some responses for testing
      this.simulateResponse(message);
    }
  }

  private simulateResponse(message: any) {
    // Simulate realistic responses based on message type
    setTimeout(() => {
      switch (message.type) {
        case 'customer:order_placed':
          this.emit('order_placed', message.data);
          break;
        case 'admin:order_status_update':
          this.emit('order_status_update', message.data);
          break;
        case 'admin:assign_driver':
          this.emit('driver_assigned', message.data);
          break;
        case 'driver:accept_order':
          this.emit('driver_accept_order', message.data);
          break;
        case 'driver:pickup_complete':
          this.emit('pickup_complete', message.data);
          break;
        case 'driver:location_update':
          this.emit('driver_location_update', message.data);
          break;
        case 'admin:send_message':
        this.emit('admin_message', message.data);
        break;

      // Production GPS Tracking Events
      case 'driver:location_broadcast':
        this.emit('driver_location_broadcast', message.data);
        break;

      case 'admin:geofence_created':
        this.emit('geofence_created', message.data);
        break;

      case 'admin:geofence_alert':
        this.emit('geofence_alert', message.data);
        break;

      case 'admin:emergency_stop':
        this.emit('emergency_stop', message.data);
        break;

      case 'driver:arrival_notification':
        this.emit('driver_arrival', message.data);
        break;

      case 'customer:delivery_eta_update':
        this.emit('delivery_eta_update', message.data);
        break;

      // Driver Pickup and Delivery Notifications
      case 'admin:notify_driver_pickup':
        this.emit('driver_pickup_notification', message.data);
        break;

      case 'driver:confirm_pickup':
        this.emit('pickup_confirmed', message.data);
        break;

      case 'driver:start_delivery':
        this.emit('delivery_started', message.data);
        break;

      case 'driver:delivery_complete':
        this.emit('delivery_completed', message.data);
        break;
        case 'driver:send_message':
          this.emit('driver_message', message.data);
          break;
        case 'admin:geofence_alert':
          this.emit('geofence_alert', message.data);
          break;
        case 'admin:product_added':
          this.emit('product_added', message.data);
          break;
        case 'driver:status_update':
          this.emit('driver_status_update', message.data);
          break;
        case 'driver:online':
          this.emit('driver_online', message.data);
          break;
        case 'driver:offline':
          this.emit('driver_offline', message.data);
          break;
        case 'admin:auto_assign_order':
          this.emit('order_auto_assigned', message.data);
          break;
        case 'admin:product_updated':
          this.emit('product_updated', message.data);
          break;
        case 'admin:product_deleted':
          this.emit('product_deleted', message.data);
          break;
      }
    }, 100);
  }

  private handleMessage(message: any) {
    console.log('📨 WebSocket message received:', message.type);

    switch (message.type) {
      case 'order_placed':
        this.emit('order_placed', message.data);
        break;
      case 'order_status_update':
        this.emit('order_status_update', message.data);
        break;
      case 'driver_assigned':
        this.emit('driver_assigned', message.data);
        break;
      case 'driver_accept_order':
        this.emit('driver_accept_order', message.data);
        break;
      case 'pickup_complete':
        this.emit('pickup_complete', message.data);
        break;
      case 'driver_location_update':
        this.emit('driver_location_update', message.data);
        break;
      case 'admin_message':
        this.emit('admin_message', message.data);
        break;
      case 'driver_message':
        this.emit('driver_message', message.data);
        break;
      case 'geofence_alert':
        this.emit('geofence_alert', message.data);
        break;
      case 'product_added':
        this.emit('product_added', message.data);
        break;
      case 'product_updated':
        this.emit('product_updated', message.data);
        break;
      case 'product_deleted':
        this.emit('product_deleted', message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
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

// Add global test functions for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testRealTimeSync = () => {
    console.log('🧪 Testing Real-Time Sync...');

    // Test order placement flow
    wsService.send({
      type: 'customer:order_placed',
      data: {
        orderId: '#TEST001',
        customerId: 'test@user.com',
        customerName: 'Test User',
        total: 99.99,
        items: [{ name: 'Test Product', quantity: 1, price: 99.99 }]
      }
    });

    // Test admin approval
    setTimeout(() => {
      wsService.send({
        type: 'admin:order_status_update',
        data: {
          orderId: '#TEST001',
          status: 'confirmed',
          message: 'Order confirmed and ready for pickup'
        }
      });
    }, 1000);

    // Test driver acceptance
    setTimeout(() => {
      wsService.send({
        type: 'driver:accept_order',
        data: {
          orderId: '#TEST001',
          driverId: 'driver123',
          driverName: 'Test Driver',
          vehicle: 'White Tesla Model 3',
          estimatedArrival: '15-20 minutes'
        }
      });
    }, 2000);

    console.log('🧪 Real-time sync test sequence started');
  };

  // Test product synchronization
  (window as any).testProductSync = () => {
    console.log('🧪 Testing Product Real-Time Sync...');

    // Test adding a new product
    wsService.send({
      type: 'admin:product_added',
      data: {
        product: {
          id: Date.now(),
          name: 'Test Product - Live Update',
          category: 'flower',
          price: 35.00,
          originalPrice: null,
          thc: '22.1%',
          cbd: '0.5%',
          strain: 'Hybrid',
          rating: 4.8,
          reviewCount: 0,
          imageUrl: 'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=400',
          description: 'This is a test product added via real-time sync!',
          effects: ['Happy', 'Relaxed'],
          labTested: true,
          inStock: true,
          featured: false
        },
        timestamp: new Date().toISOString()
      }
    });

    // Test updating a product after 2 seconds
    setTimeout(() => {
      wsService.send({
        type: 'admin:product_updated',
        data: {
          id: 1,
          updates: {
            price: 50.00,
            name: 'Purple Haze Live Resin Cartridge - UPDATED!',
            featured: true
          },
          timestamp: new Date().toISOString()
        }
      });
    }, 2000);

    // Test deleting a product after 4 seconds
    setTimeout(() => {
      wsService.send({
        type: 'admin:product_deleted',
        data: {
          id: 4,
          timestamp: new Date().toISOString()
        }
      });
    }, 4000);

    console.log('🧪 Product sync test sequence started - watch both Admin and User apps!');
  };

  (window as any).checkWebSocketStatus = () => {
    console.log('🔍 WebSocket Status:', {
      connected: wsService.ws?.readyState === WebSocket.OPEN,
      readyState: wsService.ws?.readyState,
      url: wsService.ws?.url,
      listeners: wsService.eventListeners.size
    });
  };

  console.log('🧪 Test functions available:');
  console.log('- testRealTimeSync() - Test complete real-time order flow');
  console.log('- testProductSync() - Test real-time product synchronization');
  console.log('- checkWebSocketStatus() - Check connection status');
}

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
