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

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  thc: string;
  cbd: string;
  supplier: string;
  status: string;
}

class RealTimeService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event callbacks
  private orderUpdateCallbacks: ((order: Order) => void)[] = [];
  private orderAssignedCallbacks: ((order: Order) => void)[] = [];
  private orderDeliveredCallbacks: ((order: Order) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      this.socket = io('http://192.168.1.151:3006', {
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
      console.log('🔗 User connected to real-time server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionCallbacks(true);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 User disconnected from real-time server');
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
    this.socket.on('order_updated', (order: Order) => {
      console.log('📦 Order updated:', order);
      this.notifyOrderUpdateCallbacks(order);
    });

    this.socket.on('order_assigned', (order: Order) => {
      console.log('🚗 Order assigned to driver:', order);
      this.notifyOrderAssignedCallbacks(order);
    });

    this.socket.on('order_delivered', (order: Order) => {
      console.log('✅ Order delivered:', order);
      this.notifyOrderDeliveredCallbacks(order);
    });
  }

  // Connection management
  connect(userId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('user:connect', { user_id: userId });
      console.log(`👤 User ${userId} connected to real-time system`);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Event listeners
  onOrderUpdate(callback: (order: Order) => void) {
    this.orderUpdateCallbacks.push(callback);
  }

  onOrderAssigned(callback: (order: Order) => void) {
    this.orderAssignedCallbacks.push(callback);
  }

  onOrderDelivered(callback: (order: Order) => void) {
    this.orderDeliveredCallbacks.push(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
  }

  // Notify callbacks
  private notifyOrderUpdateCallbacks(order: Order) {
    this.orderUpdateCallbacks.forEach(callback => callback(order));
  }

  private notifyOrderAssignedCallbacks(order: Order) {
    this.orderAssignedCallbacks.forEach(callback => callback(order));
  }

  private notifyOrderDeliveredCallbacks(order: Order) {
    this.orderDeliveredCallbacks.forEach(callback => callback(order));
  }

  private notifyConnectionCallbacks(connected: boolean) {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  // API methods
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch('http://192.168.1.151:3006/api/products');
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  async createOrder(orderData: {
    user_id: string;
    customer_name: string;
    customer_phone: string;
    address: string;
    items: any[];
    total: number;
  }): Promise<Order> {
    try {
      const response = await fetch('http://192.168.1.151:3006/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('📦 Order created successfully:', result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  async getOrders(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  }

  // Cleanup
  removeAllListeners() {
    this.orderUpdateCallbacks = [];
    this.orderAssignedCallbacks = [];
    this.orderDeliveredCallbacks = [];
    this.connectionCallbacks = [];
  }
}

// Create singleton instance
export const realTimeService = new RealTimeService();
export default realTimeService;
