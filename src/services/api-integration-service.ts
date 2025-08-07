// ===== API INTEGRATION SERVICE =====

import { useCannabisDeliveryStore } from './cannabis-delivery-store';
import type { 
  Product, 
  Customer, 
  Order, 
  Driver, 
  ActiveDelivery, 
  Notification 
} from './cannabis-delivery-store';

// ===== API CONFIGURATION =====

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ===== HTTP CLIENT =====

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// ===== API SERVICE =====

export class CannabisDeliveryApi {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient(API_BASE_URL);
  }

  // Initialize with auth token
  initialize(token?: string) {
    if (token) {
      this.client.setToken(token);
    }
  }

  // ===== AUTHENTICATION =====
  
  async login(email: string, password: string) {
    const response = await this.client.post<{ user: any; token: string }>('/auth/login', {
      email,
      password,
    });

    if (response.success && response.data) {
      this.client.setToken(response.data.token);
      const store = useCannabisDeliveryStore.getState();
      store.setUser({
        ...response.data.user,
        isAuthenticated: true,
        token: response.data.token,
      });
    }

    return response;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    dateOfBirth: string;
  }) {
    const response = await this.client.post<{ user: any; token: string }>('/auth/register', userData);

    if (response.success && response.data) {
      this.client.setToken(response.data.token);
      const store = useCannabisDeliveryStore.getState();
      store.setUser({
        ...response.data.user,
        isAuthenticated: true,
        token: response.data.token,
      });
    }

    return response;
  }

  async logout() {
    await this.client.post('/auth/logout');
    this.client.setToken('');
    const store = useCannabisDeliveryStore.getState();
    store.logout();
  }

  async refreshToken() {
    const response = await this.client.post<{ token: string }>('/auth/refresh');
    
    if (response.success && response.data) {
      this.client.setToken(response.data.token);
      const store = useCannabisDeliveryStore.getState();
      store.updateProfile({ token: response.data.token });
    }

    return response;
  }

  // ===== ORDERS =====

  async createOrder(orderData: any) {
    const response = await this.client.post<Order>('/orders', orderData);
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.addOrder(response.data);
    }

    return response;
  }

  async getOrders() {
    const response = await this.client.get<Order[]>('/orders');
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.setOrders(response.data);
    }

    return response;
  }
}

// ===== WEBSOCKET SERVICE =====

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  connect(token?: string) {
    try {
      const wsUrl = token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        this.reconnectAttempts = 0;
        
        const store = useCannabisDeliveryStore.getState();
        store.setConnectionStatus('connected');
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Send authentication if token provided
        if (token) {
          this.send({
            type: 'auth',
            token,
          });
        }
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
        this.stopHeartbeat();
        
        const store = useCannabisDeliveryStore.getState();
        store.setConnectionStatus('disconnected');
        
        // Attempt to reconnect
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        const store = useCannabisDeliveryStore.getState();
        store.setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      const store = useCannabisDeliveryStore.getState();
      store.setConnectionStatus('disconnected');
    }
  }

  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  // Event listener system
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
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

  private handleMessage(message: any) {
    const store = useCannabisDeliveryStore.getState();

    switch (message.type) {
      case 'order_update':
        store.updateOrder(message.data.id, message.data);
        store.addNotification({
          type: 'order',
          title: 'Order Updated',
          message: `Order ${message.data.orderId} status changed to ${message.data.status}`,
          priority: 'medium',
          orderId: message.data.orderId,
        });
        this.emit('order_update', message.data);
        break;

      case 'order_placed':
        this.emit('order_placed', message.data);
        break;

      case 'driver_accept_order':
        this.emit('driver_accept_order', message.data);
        break;

      case 'order_status_update':
        this.emit('order_status_update', message.data);
        break;

      case 'driver_location_update':
        this.emit('driver_location_update', message.data);
        break;

      case 'notification':
        store.addNotification(message.data);
        this.emit('notification', message.data);
        break;

      case 'heartbeat':
        // Respond to heartbeat
        this.send({ type: 'heartbeat_ack' });
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      const store = useCannabisDeliveryStore.getState();
      store.setConnectionStatus('reconnecting');
      
      setTimeout(() => {
        console.log(`🔌 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        const user = store.user;
        this.connect(user?.token || user?.email);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('🔌 Max reconnection attempts reached');
      const store = useCannabisDeliveryStore.getState();
      store.setConnectionStatus('disconnected');
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'heartbeat' });
    }, 30000); // 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// ===== SERVICE INSTANCES =====

export const apiService = new CannabisDeliveryApi();
export const wsService = new WebSocketService();

// ===== EXPORT DEFAULT =====

export default {
  apiService,
  wsService,
};
