import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { wsService } from './simple-websocket';

// ===== TYPES & INTERFACES =====

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  thc: string;
  cbd: string;
  strain: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  description: string;
  effects: string[];
  labTested: boolean;
  inStock: boolean;
  featured: boolean;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
  status: 'active' | 'inactive' | 'suspended';
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  joinDate: string;
  preferences: {
    categories: string[];
    brands: string[];
    priceRange: { min: number; max: number };
  };
}

export interface Order {
  id: number;
  orderId: string;
  customer: string;
  customerEmail: string;
  items: string[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  date: string;
  time: string;
  deliveryAddress: string;
  paymentMethod: string;
  estimatedDelivery: string;
  driver?: string;
  notes?: string;
  priority: 'low' | 'normal' | 'high';
  location?: string;
}

export interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
  };
  status: 'online' | 'offline' | 'busy' | 'break';
  rating: number;
  completedDeliveries: number;
  currentLocation: string;
  lastUpdate: string;
  earnings: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  online: boolean;
}

export interface ActiveDelivery {
  id: string;
  orderId: string;
  driverId: number;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: string[];
  total: number;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  estimatedArrival: string;
  currentLocation: { lat: number; lng: number };
  route: Array<{ lat: number; lng: number }>;
  progress: number;
  startTime: string;
  notes?: string;
}

export interface Notification {
  id: string;
  type: 'order' | 'driver' | 'system' | 'payment' | 'delivery';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  orderId?: string;
  driverId?: number;
  customerId?: number;
  actionRequired?: boolean;
}

interface CannabisDeliveryState {
  // Products
  products: Product[];
  
  // Customers
  customers: Customer[];
  
  // Orders
  orders: Order[];
  
  // Drivers
  drivers: Driver[];
  
  // Active Deliveries
  activeDeliveries: ActiveDelivery[];
  
  // Notifications
  notifications: Notification[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  
  // User State
  user: {
    id?: string;
    email?: string;
    name?: string;
    role?: 'CUSTOMER' | 'DRIVER' | 'ADMIN';
    isAuthenticated: boolean;
    token?: string;
  } | null;

  // GPS and Real-time Tracking State
  driverLocations: Record<string, {
    lat: number;
    lng: number;
    timestamp: string;
    heading?: number;
    speed?: number;
    isOnline: boolean;
  }>;
  geofences: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number;
    active: boolean;
    alertType: 'entry' | 'exit' | 'both';
  }>;
  adminMessages: Array<{
    id: string;
    from: string;
    to: string;
    message: string;
    timestamp: string;
    type: 'admin' | 'driver';
    orderId?: string;
    read: boolean;
  }>;
  activeRoutes: Record<string, {
    orderId: string;
    driverId: string;
    customerLocation: { lat: number; lng: number };
    facilityLocation: { lat: number; lng: number };
    currentRoute: Array<{ lat: number; lng: number }>;
    eta: string;
    status: 'pickup' | 'delivery' | 'completed';
  }>;
  
  // Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: number, updates: Partial<Product>) => void;
  deleteProduct: (id: number) => void;

  // Real-time sync actions
  broadcastProductAdded: (product: Product) => void;
  broadcastProductUpdated: (id: number, updates: Partial<Product>) => void;
  broadcastProductDeleted: (id: number) => void;
  setupRealTimeSync: () => void;

  // Order workflow actions
  placeOrder: (orderData: any) => void;
  processOrder: (orderId: string, status: string) => void;
  assignDriver: (orderId: string, driverId: string) => void;
  updateDriverLocation: (driverId: string, location: { lat: number; lng: number }) => void;
  sendAdminMessage: (driverId: string, message: string) => void;
  sendDriverMessage: (adminId: string, message: string) => void;
  createGeofence: (name: string, coords: { lat: number; lng: number; radius: number }) => void;
  
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: number, updates: Partial<Customer>) => void;
  
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: number, updates: Partial<Order>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  
  setDrivers: (drivers: Driver[]) => void;
  addDriver: (driver: Driver) => void;
  updateDriver: (id: number, updates: Partial<Driver>) => void;
  
  setActiveDeliveries: (deliveries: ActiveDelivery[]) => void;
  updateDeliveryProgress: (orderId: string, progress: number) => void;
  updateDeliveryStatus: (orderId: string, status: ActiveDelivery['status']) => void;
  assignDriver: (orderId: string, driverId: number) => void;
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  updateLastUpdated: () => void;
  
  setUser: (user: CannabisDeliveryState['user']) => void;
  updateProfile: (updates: Partial<NonNullable<CannabisDeliveryState['user']>>) => void;
  logout: () => void;
}

export const useCannabisDeliveryStore = create<CannabisDeliveryState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial State
        products: [],
        customers: [],
        orders: [],
        drivers: [],
        activeDeliveries: [],
        notifications: [],
        isLoading: false,
        error: null,
        lastUpdated: null,
        connectionStatus: 'disconnected',
        user: null,

        // Product Actions
        setProducts: (products) => set({ products }),
        addProduct: (product) => set((state) => ({
          products: [...state.products, product]
        })),
        updateProduct: (id, updates) => set((state) => ({
          products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
        })),
        deleteProduct: (id) => set((state) => ({
          products: state.products.filter(p => p.id !== id)
        })),

        // Real-time sync actions
        broadcastProductAdded: (product) => {
          // First update local state
          set((state) => ({
            products: [...state.products, product],
            lastUpdated: new Date().toISOString()
          }));
          // Then broadcast to other clients
          wsService.send({
            type: 'admin:product_added',
            data: { product, timestamp: new Date().toISOString() }
          });
          console.log('📡 Broadcasting product added:', product.name);
        },

        broadcastProductUpdated: (id, updates) => {
          // First update local state
          set((state) => ({
            products: state.products.map(p => p.id === id ? { ...p, ...updates } : p),
            lastUpdated: new Date().toISOString()
          }));
          // Then broadcast to other clients
          wsService.send({
            type: 'admin:product_updated',
            data: { id, updates, timestamp: new Date().toISOString() }
          });
          console.log('📡 Broadcasting product updated:', id, updates);
        },

        broadcastProductDeleted: (id) => {
          // First update local state
          set((state) => ({
            products: state.products.filter(p => p.id !== id),
            lastUpdated: new Date().toISOString()
          }));
          // Then broadcast to other clients
          wsService.send({
            type: 'admin:product_deleted',
            data: { id, timestamp: new Date().toISOString() }
          });
          console.log('📡 Broadcasting product deleted:', id);
        },

        setupRealTimeSync: () => {
          console.log('🔄 Setting up real-time product sync...');

          // Listen for product events from other clients
          wsService.on('product_added', (data) => {
            console.log('📥 Received product added:', data.product.name);
            set((state) => ({
              products: [...state.products, data.product],
              lastUpdated: data.timestamp,
              notifications: [...state.notifications, {
                id: Date.now(),
                type: 'success',
                title: 'New Product Added',
                message: `${data.product.name} is now available!`,
                priority: 'low',
                timestamp: new Date().toISOString()
              }]
            }));
          });

          wsService.on('product_updated', (data) => {
            console.log('📥 Received product updated:', data.id);
            const product = get().products.find(p => p.id === data.id);
            set((state) => ({
              products: state.products.map(p => p.id === data.id ? { ...p, ...data.updates } : p),
              lastUpdated: data.timestamp,
              notifications: [...state.notifications, {
                id: Date.now(),
                type: 'info',
                title: 'Product Updated',
                message: `${product?.name || 'A product'} has been updated`,
                priority: 'low',
                timestamp: new Date().toISOString()
              }]
            }));
          });

          wsService.on('product_deleted', (data) => {
            console.log('📥 Received product deleted:', data.id);
            const product = get().products.find(p => p.id === data.id);
            set((state) => ({
              products: state.products.filter(p => p.id !== data.id),
              lastUpdated: data.timestamp,
              notifications: [...state.notifications, {
                id: Date.now(),
                type: 'warning',
                title: 'Product Removed',
                message: `${product?.name || 'A product'} is no longer available`,
                priority: 'medium',
                timestamp: new Date().toISOString()
              }]
            }));
          });

          // Connect WebSocket if not already connected
          wsService.connect();
          console.log('✅ Real-time product sync activated');
        },

        // Customer Actions
        setCustomers: (customers) => set({ customers }),
        addCustomer: (customer) => set((state) => ({ 
          customers: [...state.customers, customer] 
        })),
        updateCustomer: (id, updates) => set((state) => ({
          customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
        })),

        // Order Actions
        setOrders: (orders) => set({ orders }),
        addOrder: (order) => set((state) => ({ 
          orders: [order, ...state.orders] 
        })),
        updateOrder: (id, updates) => set((state) => ({
          orders: state.orders.map(o => o.id === id ? { ...o, ...updates } : o)
        })),
        updateOrderStatus: (orderId, status) => set((state) => ({
          orders: state.orders.map(o => o.orderId === orderId ? { ...o, status } : o)
        })),

        // Driver Actions
        setDrivers: (drivers) => set({ drivers }),
        addDriver: (driver) => set((state) => ({ 
          drivers: [...state.drivers, driver] 
        })),
        updateDriver: (id, updates) => set((state) => ({
          drivers: state.drivers.map(d => d.id === id ? { ...d, ...updates } : d)
        })),

        // Delivery Actions
        setActiveDeliveries: (deliveries) => set({ activeDeliveries: deliveries }),
        updateDeliveryProgress: (orderId, progress) => set((state) => ({
          activeDeliveries: state.activeDeliveries.map(d => 
            d.orderId === orderId ? { ...d, progress } : d
          )
        })),
        updateDeliveryStatus: (orderId, status) => set((state) => ({
          activeDeliveries: state.activeDeliveries.map(d => 
            d.orderId === orderId ? { ...d, status } : d
          )
        })),
        assignDriver: (orderId, driverId) => set((state) => ({
          orders: state.orders.map(o => 
            o.orderId === orderId ? { ...o, driver: `Driver ${driverId}`, status: 'assigned' } : o
          )
        })),

        // Notification Actions
        addNotification: (notification) => set((state) => ({
          notifications: [{
            ...notification,
            id: `notif_${Date.now()}_${Math.random()}`,
            timestamp: new Date(),
            isRead: false
          }, ...state.notifications]
        })),
        markAsRead: (id) => set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, isRead: true } : n
          )
        })),
        clearNotifications: () => set({ notifications: [] }),

        // UI Actions
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
        updateLastUpdated: () => set({ lastUpdated: new Date() }),

        // User Actions
        setUser: (user) => set({ user }),
        updateProfile: (updates) => set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),
        logout: () => set({ 
          user: null,
          orders: [],
          notifications: []
        })
      }),
      {
        name: 'cannabis-delivery-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          connectionStatus: state.connectionStatus
        })
      }
    )
  )
);
