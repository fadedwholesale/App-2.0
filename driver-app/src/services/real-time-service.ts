import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';

export interface Order {
  id: string;
  user_id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  items: any[];
  total: number;
  status: 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  driver_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_online: boolean;
  is_available: boolean;
  current_location: any;
  created_at: string;
  updated_at: string;
}

class RealTimeService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentDriverId: string | null = null;

  // Event callbacks
  private orderAssignedCallbacks: ((order: Order) => void)[] = [];
  private orderAcceptedCallbacks: ((order: Order) => void)[] = [];
  private orderCompletedCallbacks: ((order: Order) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      this.socket = io('http://localhost:3006', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔗 Driver connected to real-time server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionCallbacks(true);
      
      // Reconnect driver if we have a driver ID
      if (this.currentDriverId) {
        this.connect(this.currentDriverId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Driver disconnected from real-time server');
      this.isConnected = false;
      this.notifyConnectionCallbacks(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Order events
    this.socket.on('order_assigned', (order: Order) => {
      console.log('📦 Order assigned to driver:', order);
      this.notifyOrderAssignedCallbacks(order);
    });

    this.socket.on('order_accepted', (order: Order) => {
      console.log('✅ Order accepted:', order);
      this.notifyOrderAcceptedCallbacks(order);
    });

    this.socket.on('order_completed', (order: Order) => {
      console.log('🎉 Order completed:', order);
      this.notifyOrderCompletedCallbacks(order);
    });
  }

  // Connection management
  connect(driverId: string) {
    this.currentDriverId = driverId;
    if (this.socket && this.isConnected) {
      this.socket.emit('driver:connect', { driver_id: driverId });
      console.log(`🚗 Driver ${driverId} connected to real-time system`);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentDriverId = null;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Event listeners
  onOrderAssigned(callback: (order: Order) => void) {
    this.orderAssignedCallbacks.push(callback);
  }

  onOrderAccepted(callback: (order: Order) => void) {
    this.orderAcceptedCallbacks.push(callback);
  }

  onOrderCompleted(callback: (order: Order) => void) {
    this.orderCompletedCallbacks.push(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
  }

  // Notify callbacks
  private notifyOrderAssignedCallbacks(order: Order) {
    this.orderAssignedCallbacks.forEach(callback => callback(order));
  }

  private notifyOrderAcceptedCallbacks(order: Order) {
    this.orderAcceptedCallbacks.forEach(callback => callback(order));
  }

  private notifyOrderCompletedCallbacks(order: Order) {
    this.orderCompletedCallbacks.forEach(callback => callback(order));
  }

  private notifyConnectionCallbacks(connected: boolean) {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  // Driver actions
  updateLocation(driverId: string, location: { lat: number; lng: number }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver:location_update', {
        driver_id: driverId,
        location
      });
    }
  }

  acceptOrder(orderId: string, driverId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver:accept_order', {
        order_id: orderId,
        driver_id: driverId
      });
    }
  }

  completeOrder(orderId: string, driverId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('driver:complete_order', {
        order_id: orderId,
        driver_id: driverId
      });
    }
  }

  // API methods
  async updateDriverStatus(driverId: string, status: { is_online: boolean; is_available: boolean; current_location?: any }) {
    try {
      const response = await fetch(`http://localhost:3006/api/drivers/${driverId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('🚗 Driver status updated:', result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to update driver status:', error);
      throw error;
    }
  }

  async getAvailableOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch available orders:', error);
      throw error;
    }
  }

  async getDriverOrders(driverId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch driver orders:', error);
      throw error;
    }
  }

  async getDriver(driverId: string): Promise<Driver | null> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch driver:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      const response = await fetch(`http://localhost:3006/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('📦 Order status updated:', result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  }

  // Cleanup
  removeAllListeners() {
    this.orderAssignedCallbacks = [];
    this.orderAcceptedCallbacks = [];
    this.orderCompletedCallbacks = [];
    this.connectionCallbacks = [];
  }
}

// Create singleton instance
export const realTimeService = new RealTimeService();
export default realTimeService;
