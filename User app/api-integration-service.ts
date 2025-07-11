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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.fadedskies.com/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://ws.fadedskies.com';

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

  // ===== PRODUCTS =====

  async getProducts() {
    const response = await this.client.get<Product[]>('/products');
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.setProducts(response.data);
    }

    return response;
  }

  async createProduct(productData: Omit<Product, 'id'>) {
    const response = await this.client.post<Product>('/products', productData);
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.addProduct(response.data);
    }

    return response;
  }

  async updateProduct(id: number, updates: Partial<Product>) {
    const response = await this.client.put<Product>(`/products/${id}`, updates);
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.updateProduct(id, response.data);
    }

    return response;
  }

  async deleteProduct(id: number) {
    const response = await this.client.delete(`/products/${id}`);
    
    if (response.success) {
      const store = useCannabisDeliveryStore.getState();
      store.deleteProduct(id);
    }

    return response;
  }

  // ===== CUSTOMERS =====

  async getCustomers() {
    const response = await this.client.get<Customer[]>('/customers');
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.setCustomers(response.data);
    }

    return response;
  }

  async createCustomer(customerData: Omit<Customer, 'id'>) {
    const response = await this.client.post<Customer>('/customers', customerData);
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.addCustomer(response.data);
    }

    return response;
  }

  async updateCustomer(id: number, updates: Partial<Customer>) {
    const response = await this.client.put<Customer>(`/customers/${id}`, updates);
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.updateCustomer(id, response.data);
    }

    return response;
  }

  // ===== ORDERS =====

  async getOrders() {
    const response = await this.client.get<Order[]>('/orders');
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.setOrders(response.data);
    }

    return response;
  }

  async createOrder(orderData: Omit<Order, 'id' | 'orderId'>) {
    const response = await this.client.post<Order>('/orders', orderData);
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.addOrder(response.data);
    }

    return response;
  }

  async updateOrder(id: number, updates: Partial<Order>) {
    const response = await this.client.put<Order>(`/orders/${id}`, updates);
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.updateOrder(id, response.data);
    }

    return response;
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    const response = await this.client.patch(`/orders/${orderId}/status`, { status });
    
    if (response.success) {
      const store = useCannabisDeliveryStore.getState();
      store.updateOrderStatus(orderId, status);
    }

    return response;
  }

  // ===== DRIVERS =====

  async getDrivers() {
    const response = await this.client.get<Driver[]>('/drivers');
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.setDrivers(response.data);
    }

    return response;
  }

  async updateDriver(id: number, updates: Partial<Driver>) {
    const response = await this.client.put<Driver>(`/drivers/${id}`, updates);
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.updateDriver(id, response.data);
    }

    return response;
  }

  async updateDriverLocation(id: number, location: { lat: number; lng: number }) {
    const response = await this.client.patch(`/drivers/${id}/location`, location);
    return response;
  }

  // ===== DELIVERIES =====

  async getActiveDeliveries() {
    const response = await this.client.get<ActiveDelivery[]>('/deliveries/active');
    
    if (response.success && response.data) {
      const store = useCannabisDeliveryStore.getState();
      store.setActiveDeliveries(response.data);
    }

    return response;
  }

  async assignDriver(orderId: string, driverId: number) {
    const response = await this.client.post(`/deliveries/${orderId}/assign`, { driverId });
    
    if (response.success) {
      const store = useCannabisDeliveryStore.getState();
      store.assignDriver(orderId, driverId);
    }

    return response;
  }

  async updateDeliveryProgress(orderId: string, progress: number) {
    const response = await this.client.patch(`/deliveries/${orderId}/progress`, { progress });
    
    if (response.success) {
      const store = useCannabisDeliveryStore.getState();
      store.updateDeliveryProgress(orderId, progress);
    }

    return response;
  }

  // ===== NOTIFICATIONS =====

  async getNotifications() {
    const response = await this.client.get<Notification[]>('/notifications');
    return response;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.patch(`/notifications/${id}/read`);
    
    if (response.success) {
      const store = useCannabisDeliveryStore.getState();
      store.markAsRead(id);
    }

    return response;
  }

  // ===== FILE UPLOAD =====

  async uploadFile(file: File, type: 'product' | 'id' | 'avatar') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.client['token']}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Upload failed',
        };
      }

      return {
        success: true,
        data: data.url,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload error',
      };
    }
  }

  // ===== ANALYTICS =====

  async getAnalytics(dateRange: string = '7d') {
    const response = await this.client.get(`/analytics?range=${dateRange}`);
    return response;
  }

  async exportData(type: 'orders' | 'customers' | 'products' | 'full') {
    const response = await this.client.get(`/export/${type}`);
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

  connect(token?: string) {
    try {
      const wsUrl = token ? `${WS_URL}?token=${token}` : WS_URL;
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
        break;

      case 'delivery_update':
        store.updateDeliveryProgress(message.data.orderId, message.data.progress);
        if (message.data.status) {
          store.updateDeliveryStatus(message.data.orderId, message.data.status);
        }
        break;

      case 'driver_location':
        store.updateDriver(message.data.driverId, {
          currentLocation: message.data.location,
          lastUpdate: new Date().toLocaleTimeString(),
        });
        break;

      case 'notification':
        store.addNotification(message.data);
        break;

      case 'product_update':
        store.updateProduct(message.data.id, message.data);
        break;

      case 'inventory_alert':
        store.addNotification({
          type: 'system',
          title: 'Inventory Alert',
          message: `${message.data.productName} is running low (${message.data.stock} left)`,
          priority: 'high',
        });
        break;

      case 'driver_status':
        store.updateDriver(message.data.driverId, {
          status: message.data.status,
          online: message.data.online,
        });
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
        this.connect(user?.token);
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

  // Public methods for specific actions
  subscribeToOrder(orderId: string) {
    this.send({
      type: 'subscribe',
      channel: 'order',
      orderId,
    });
  }

  subscribeToDriver(driverId: number) {
    this.send({
      type: 'subscribe',
      channel: 'driver',
      driverId,
    });
  }

  subscribeToDeliveries() {
    this.send({
      type: 'subscribe',
      channel: 'deliveries',
    });
  }

  updateDriverLocation(lat: number, lng: number) {
    this.send({
      type: 'driver_location_update',
      data: { lat, lng },
    });
  }

  sendDriverMessage(driverId: number, message: string) {
    this.send({
      type: 'driver_message',
      driverId,
      message,
    });
  }
}

// ===== SERVICE INSTANCES =====

export const apiService = new CannabisDeliveryApi();
export const wsService = new WebSocketService();

// ===== INTEGRATION HOOKS =====

export const useApiService = () => {
  return apiService;
};

export const useWebSocketService = () => {
  return wsService;
};

// ===== AUTO-SYNC HOOK =====

export const useAutoSync = (enabled: boolean = true) => {
  const store = useCannabisDeliveryStore();

  React.useEffect(() => {
    if (!enabled) return;

    const syncInterval = setInterval(async () => {
      try {
        await Promise.all([
          apiService.getProducts(),
          apiService.getOrders(),
          apiService.getActiveDeliveries(),
          apiService.getDrivers(),
        ]);
        
        store.updateLastUpdated();
      } catch (error) {
        console.error('Auto-sync failed:', error);
        store.setError('Sync failed');
      }
    }, 60000); // Sync every minute

    return () => clearInterval(syncInterval);
  }, [enabled, store]);
};

// ===== INITIALIZATION HELPER =====

export const initializeServices = async () => {
  const store = useCannabisDeliveryStore.getState();
  
  // Initialize API with token if available
  if (store.user?.token) {
    apiService.initialize(store.user.token);
  }

  // Connect WebSocket
  wsService.connect(store.user?.token);

  // Load initial data
  try {
    await Promise.all([
      apiService.getProducts(),
      apiService.getCustomers(),
      apiService.getOrders(),
      apiService.getDrivers(),
      apiService.getActiveDeliveries(),
    ]);

    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    store.setError('Failed to load initial data');
  }
};

// ===== CLEANUP HELPER =====

export const cleanupServices = () => {
  wsService.disconnect();
  console.log('🧹 Services cleaned up');
};

// ===== ERROR HANDLING =====

export const handleApiError = (error: any, context: string) => {
  const store = useCannabisDeliveryStore.getState();
  
  console.error(`API Error in ${context}:`, error);
  
  let errorMessage = 'An unexpected error occurred';
  
  if (error.response?.status === 401) {
    errorMessage = 'Authentication required';
    store.logout();
  } else if (error.response?.status === 403) {
    errorMessage = 'Access denied';
  } else if (error.response?.status === 404) {
    errorMessage = 'Resource not found';
  } else if (error.response?.status >= 500) {
    errorMessage = 'Server error - please try again later';
  } else if (error.message) {
    errorMessage = error.message;
  }

  store.setError(errorMessage);
  
  // Add error notification
  store.addNotification({
    type: 'system',
    title: 'Error',
    message: errorMessage,
    priority: 'high',
  });

  // Clear error after 5 seconds
  setTimeout(() => {
    store.setError(null);
  }, 5000);
};

// ===== EXPORT DEFAULT =====

export default {
  apiService,
  wsService,
  initializeServices,
  cleanupServices,
  handleApiError,
};