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
  private newOrderCallbacks: ((order: Order) => void)[] = [];
  private orderUpdatedCallbacks: ((order: Order) => void)[] = [];
  private orderAssignedCallbacks: ((order: Order) => void)[] = [];
  private orderDeliveredCallbacks: ((order: Order) => void)[] = [];
  private driverStatusUpdatedCallbacks: ((driver: Driver) => void)[] = [];
  private driverLocationUpdatedCallbacks: ((data: { driver_id: string; location: any }) => void)[] = [];
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
      console.log('🔗 Admin connected to real-time server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionCallbacks(true);
      
      // Connect as admin
      this.connect();
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Admin disconnected from real-time server');
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
    this.socket.on('new_order', (order: Order) => {
      console.log('📦 New order received:', order);
      this.notifyNewOrderCallbacks(order);
    });

    this.socket.on('order_updated', (order: Order) => {
      console.log('📦 Order updated:', order);
      this.notifyOrderUpdatedCallbacks(order);
    });

    this.socket.on('order_assigned', (order: Order) => {
      console.log('🚗 Order assigned to driver:', order);
      this.notifyOrderAssignedCallbacks(order);
    });

    this.socket.on('order_delivered', (order: Order) => {
      console.log('✅ Order delivered:', order);
      this.notifyOrderDeliveredCallbacks(order);
    });

    // Driver events
    this.socket.on('driver_status_updated', (driver: Driver) => {
      console.log('🚗 Driver status updated:', driver);
      this.notifyDriverStatusUpdatedCallbacks(driver);
    });

    this.socket.on('driver_location_updated', (data: { driver_id: string; location: any }) => {
      console.log('📍 Driver location updated:', data);
      this.notifyDriverLocationUpdatedCallbacks(data);
    });
  }

  // Connection management
  connect() {
    if (this.socket && this.isConnected) {
      this.socket.emit('admin:connect');
      console.log('👨‍💼 Admin connected to real-time system');
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
  onNewOrder(callback: (order: Order) => void) {
    this.newOrderCallbacks.push(callback);
  }

  onOrderUpdated(callback: (order: Order) => void) {
    this.orderUpdatedCallbacks.push(callback);
  }

  onOrderAssigned(callback: (order: Order) => void) {
    this.orderAssignedCallbacks.push(callback);
  }

  onOrderDelivered(callback: (order: Order) => void) {
    this.orderDeliveredCallbacks.push(callback);
  }

  onDriverStatusUpdated(callback: (driver: Driver) => void) {
    this.driverStatusUpdatedCallbacks.push(callback);
  }

  onDriverLocationUpdated(callback: (data: { driver_id: string; location: any }) => void) {
    this.driverLocationUpdatedCallbacks.push(callback);
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
  }

  // Notify callbacks
  private notifyNewOrderCallbacks(order: Order) {
    this.newOrderCallbacks.forEach(callback => callback(order));
  }

  private notifyOrderUpdatedCallbacks(order: Order) {
    this.orderUpdatedCallbacks.forEach(callback => callback(order));
  }

  private notifyOrderAssignedCallbacks(order: Order) {
    this.orderAssignedCallbacks.forEach(callback => callback(order));
  }

  private notifyOrderDeliveredCallbacks(order: Order) {
    this.orderDeliveredCallbacks.forEach(callback => callback(order));
  }

  private notifyDriverStatusUpdatedCallbacks(driver: Driver) {
    this.driverStatusUpdatedCallbacks.forEach(callback => callback(driver));
  }

  private notifyDriverLocationUpdatedCallbacks(data: { driver_id: string; location: any }) {
    this.driverLocationUpdatedCallbacks.forEach(callback => callback(data));
  }

  private notifyConnectionCallbacks(connected: boolean) {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  // API methods
  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  async getPendingOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch pending orders:', error);
      throw error;
    }
  }

  async getDrivers(): Promise<Driver[]> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      throw error;
    }
  }

  async getAvailableDrivers(): Promise<Driver[]> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('is_online', true)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch available drivers:', error);
      throw error;
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  async assignOrderToDriver(orderId: string, driverId: string): Promise<Order> {
    try {
      const response = await fetch(`http://localhost:3006/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'assigned',
          driver_id: driverId 
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('📦 Order assigned to driver:', result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to assign order to driver:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
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

  async createProduct(productData: {
    name: string;
    category: string;
    price: number;
    stock: number;
    thc: string;
    cbd: string;
    supplier: string;
  }): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      console.log('🆕 Product created:', data);
      return data;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      console.log('✏️ Product updated:', data);
      return data;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  }

  async createDriver(driverData: {
    name: string;
    email: string;
    phone: string;
  }): Promise<Driver> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .insert({
          ...driverData,
          is_online: false,
          is_available: false
        })
        .select()
        .single();

      if (error) throw error;
      console.log('🆕 Driver created:', data);
      return data;
    } catch (error) {
      console.error('Failed to create driver:', error);
      throw error;
    }
  }

  async updateDriver(driverId: string, updates: Partial<Driver>): Promise<Driver> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', driverId)
        .select()
        .single();

      if (error) throw error;
      console.log('✏️ Driver updated:', data);
      return data;
    } catch (error) {
      console.error('Failed to update driver:', error);
      throw error;
    }
  }

  // Cleanup
  removeAllListeners() {
    this.newOrderCallbacks = [];
    this.orderUpdatedCallbacks = [];
    this.orderAssignedCallbacks = [];
    this.orderDeliveredCallbacks = [];
    this.driverStatusUpdatedCallbacks = [];
    this.driverLocationUpdatedCallbacks = [];
    this.connectionCallbacks = [];
  }
}

// Create singleton instance
export const realTimeService = new RealTimeService();
export default realTimeService;
