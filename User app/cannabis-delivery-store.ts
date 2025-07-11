import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

// ===== TYPES & INTERFACES =====

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
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
  stock: number;
  supplier: string;
  status: 'active' | 'low_stock' | 'inactive' | 'coming_soon';
  dateAdded: string;
  strainType?: 'indica' | 'sativa' | 'hybrid' | 'cbd';
  batchNumber?: string;
  harvestDate?: string;
  labResults?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateJoined: string;
  totalOrders: number;
  totalSpent: number;
  status: 'verified' | 'pending_verification';
  lastOrder: string | null;
  preferences: string[];
  loyaltyPoints: number;
  age?: number;
  idVerified?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  orderId: string;
  customerId: number;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'processing' | 'en-route' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderDate: string;
  deliveryDate: string | null;
  address: string;
  notes: string;
  estimatedDelivery?: string;
  driverId?: number | null;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  status: 'available' | 'delivering' | 'offline';
  ordersToday: number;
  rating: number;
  online: boolean;
  currentLocation: string;
  batteryLevel: number;
  lastUpdate: string;
  currentLoad: number;
  maxLoad: number;
  efficiency: number;
  zone: 'central' | 'east' | 'west' | 'south' | 'north';
}

export interface ActiveDelivery {
  orderId: string;
  customer: string;
  address: string;
  estimatedTime: string;
  progress: number;
  status: 'pending' | 'preparing' | 'en-route' | 'delivered';
  priority: 'normal' | 'high' | 'urgent';
  driverId: number | null;
  route: string;
  alternateRoutes: string[];
  specialInstructions: string;
  deliveryWindow: string;
  issues: string[];
  zone: string;
  orderTime: number;
  autoAssigned: boolean;
}

export interface Notification {
  id: string;
  type: 'order' | 'delivery' | 'system' | 'promotion';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  userId?: number;
  orderId?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'driver';
  isAuthenticated: boolean;
  token?: string;
  preferences?: Record<string, any>;
}

// ===== STORE INTERFACES =====

interface ProductStore {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  searchTerm: string;
  filteredProducts: Product[];
  
  // Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: number, updates: Partial<Product>) => void;
  deleteProduct: (id: number) => void;
  setSelectedCategory: (category: string) => void;
  setSearchTerm: (term: string) => void;
  updateProductStock: (productId: number, quantity: number) => void;
  toggleProductFeatured: (id: number) => void;
}

interface CustomerStore {
  customers: Customer[];
  currentCustomer: Customer | null;
  
  // Actions
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: number, updates: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;
  setCurrentCustomer: (customer: Customer | null) => void;
  updateCustomerStats: (customerId: number, orderTotal: number) => void;
}

interface OrderStore {
  orders: Order[];
  activeOrders: Order[];
  completedOrders: Order[];
  
  // Actions
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Omit<Order, 'id'>) => void;
  updateOrder: (id: number, updates: Partial<Order>) => void;
  deleteOrder: (id: number) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getOrdersByCustomer: (customerId: number) => Order[];
  getOrdersByStatus: (status: Order['status']) => Order[];
}

interface CartStore {
  items: CartItem[];
  total: number;
  itemCount: number;
  
  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  applyDiscount: (discountCode: string) => boolean;
}

interface DeliveryStore {
  drivers: Driver[];
  activeDeliveries: ActiveDelivery[];
  deliverySettings: {
    autoAssign: boolean;
    routeOptimization: boolean;
    priorityEscalation: boolean;
    trackingEnabled: boolean;
  };
  
  // Actions
  setDrivers: (drivers: Driver[]) => void;
  updateDriver: (id: number, updates: Partial<Driver>) => void;
  setActiveDeliveries: (deliveries: ActiveDelivery[]) => void;
  updateDeliveryProgress: (orderId: string, progress: number) => void;
  assignDriver: (orderId: string, driverId: number) => void;
  updateDeliveryStatus: (orderId: string, status: ActiveDelivery['status']) => void;
  addDeliveryIssue: (orderId: string, issue: string) => void;
  resolveDeliveryIssue: (orderId: string, issueIndex: number) => void;
  toggleDeliverySettings: (setting: keyof DeliveryStore['deliverySettings']) => void;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  settings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<NotificationStore['settings']>) => void;
}

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  updateProfile: (updates: Partial<AuthUser>) => void;
  setUser: (user: AuthUser | null) => void;
}

interface AppStore {
  // UI State
  currentView: string;
  isLoading: boolean;
  error: string | null;
  modals: {
    productModal: boolean;
    orderModal: boolean;
    customerModal: boolean;
    trackingModal: boolean;
    profileModal: boolean;
  };
  
  // Real-time state
  isLiveTrackingEnabled: boolean;
  lastUpdated: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  
  // Actions
  setCurrentView: (view: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleModal: (modal: keyof AppStore['modals']) => void;
  toggleLiveTracking: () => void;
  updateLastUpdated: () => void;
  setConnectionStatus: (status: AppStore['connectionStatus']) => void;
}

// ===== MAIN STORE =====

interface CannabisDeliveryStore extends 
  ProductStore,
  CustomerStore, 
  OrderStore,
  CartStore,
  DeliveryStore,
  NotificationStore,
  AuthStore,
  AppStore {
  
  // Cross-store actions
  placeOrder: (customerData: Partial<Customer>, deliveryAddress?: string) => Promise<Order | null>;
  syncData: () => Promise<void>;
  resetStore: () => void;
  
  // Analytics helpers
  getAnalytics: () => {
    totalRevenue: number;
    avgOrderValue: number;
    topProducts: Product[];
    customerStats: any;
    driverPerformance: any;
  };
}

// ===== STORE IMPLEMENTATION =====

export const useCannabisDeliveryStore = create<CannabisDeliveryStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ===== PRODUCT STATE =====
        products: [],
        categories: ['All', 'Flower', 'Edibles', 'Concentrates', 'Pre-Rolls', 'CBD Products'],
        selectedCategory: 'All',
        searchTerm: '',
        filteredProducts: [],

        // ===== CUSTOMER STATE =====
        customers: [],
        currentCustomer: null,

        // ===== ORDER STATE =====
        orders: [],
        activeOrders: [],
        completedOrders: [],

        // ===== CART STATE =====
        items: [],
        total: 0,
        itemCount: 0,

        // ===== DELIVERY STATE =====
        drivers: [],
        activeDeliveries: [],
        deliverySettings: {
          autoAssign: true,
          routeOptimization: true,
          priorityEscalation: true,
          trackingEnabled: true,
        },

        // ===== NOTIFICATION STATE =====
        notifications: [],
        unreadCount: 0,
        settings: {
          email: true,
          push: true,
          sms: false,
          orderUpdates: true,
          promotions: true,
        },

        // ===== AUTH STATE =====
        user: null,
        isAuthenticated: false,
        isLoading: false,

        // ===== APP STATE =====
        currentView: 'dashboard',
        error: null,
        modals: {
          productModal: false,
          orderModal: false,
          customerModal: false,
          trackingModal: false,
          profileModal: false,
        },
        isLiveTrackingEnabled: false,
        lastUpdated: Date.now(),
        connectionStatus: 'connected',

        // ===== PRODUCT ACTIONS =====
        setProducts: (products) => set((state) => {
          const filtered = products.filter(p => 
            (state.selectedCategory === 'All' || p.category === state.selectedCategory) &&
            p.name.toLowerCase().includes(state.searchTerm.toLowerCase())
          );
          return { products, filteredProducts: filtered };
        }),

        addProduct: (productData) => set((state) => {
          const newProduct: Product = {
            ...productData,
            id: Math.max(...state.products.map(p => p.id), 0) + 1,
          };
          const products = [...state.products, newProduct];
          return { 
            products,
            filteredProducts: products.filter(p => 
              (state.selectedCategory === 'All' || p.category === state.selectedCategory) &&
              p.name.toLowerCase().includes(state.searchTerm.toLowerCase())
            )
          };
        }),

        updateProduct: (id, updates) => set((state) => {
          const products = state.products.map(p => p.id === id ? { ...p, ...updates } : p);
          return { 
            products,
            filteredProducts: products.filter(p => 
              (state.selectedCategory === 'All' || p.category === state.selectedCategory) &&
              p.name.toLowerCase().includes(state.searchTerm.toLowerCase())
            )
          };
        }),

        deleteProduct: (id) => set((state) => {
          const products = state.products.filter(p => p.id !== id);
          return { 
            products,
            filteredProducts: products.filter(p => 
              (state.selectedCategory === 'All' || p.category === state.selectedCategory) &&
              p.name.toLowerCase().includes(state.searchTerm.toLowerCase())
            )
          };
        }),

        setSelectedCategory: (category) => set((state) => {
          const filtered = state.products.filter(p => 
            (category === 'All' || p.category === category) &&
            p.name.toLowerCase().includes(state.searchTerm.toLowerCase())
          );
          return { selectedCategory: category, filteredProducts: filtered };
        }),

        setSearchTerm: (term) => set((state) => {
          const filtered = state.products.filter(p => 
            (state.selectedCategory === 'All' || p.category === state.selectedCategory) &&
            p.name.toLowerCase().includes(term.toLowerCase())
          );
          return { searchTerm: term, filteredProducts: filtered };
        }),

        updateProductStock: (productId, quantity) => set((state) => ({
          products: state.products.map(p => 
            p.id === productId ? { ...p, stock: Math.max(0, p.stock - quantity) } : p
          )
        })),

        toggleProductFeatured: (id) => set((state) => ({
          products: state.products.map(p => 
            p.id === id ? { ...p, featured: !p.featured } : p
          )
        })),

        // ===== CUSTOMER ACTIONS =====
        setCustomers: (customers) => set({ customers }),

        addCustomer: (customerData) => set((state) => ({
          customers: [...state.customers, {
            ...customerData,
            id: Math.max(...state.customers.map(c => c.id), 0) + 1,
          }]
        })),

        updateCustomer: (id, updates) => set((state) => ({
          customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
        })),

        deleteCustomer: (id) => set((state) => ({
          customers: state.customers.filter(c => c.id !== id),
          orders: state.orders.filter(o => o.customerId !== id)
        })),

        setCurrentCustomer: (customer) => set({ currentCustomer: customer }),

        updateCustomerStats: (customerId, orderTotal) => set((state) => ({
          customers: state.customers.map(c => 
            c.id === customerId ? {
              ...c,
              totalOrders: c.totalOrders + 1,
              totalSpent: c.totalSpent + orderTotal,
              loyaltyPoints: c.loyaltyPoints + Math.floor(orderTotal),
              lastOrder: new Date().toISOString().split('T')[0]
            } : c
          )
        })),

        // ===== ORDER ACTIONS =====
        setOrders: (orders) => set((state) => ({
          orders,
          activeOrders: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled'),
          completedOrders: orders.filter(o => o.status === 'delivered' || o.status === 'cancelled')
        })),

        addOrder: (orderData) => set((state) => {
          const newOrder: Order = {
            ...orderData,
            id: Math.max(...state.orders.map(o => o.id), 0) + 1,
          };
          const orders = [...state.orders, newOrder];
          return {
            orders,
            activeOrders: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled'),
            completedOrders: orders.filter(o => o.status === 'delivered' || o.status === 'cancelled')
          };
        }),

        updateOrder: (id, updates) => set((state) => {
          const orders = state.orders.map(o => o.id === id ? { ...o, ...updates } : o);
          return {
            orders,
            activeOrders: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled'),
            completedOrders: orders.filter(o => o.status === 'delivered' || o.status === 'cancelled')
          };
        }),

        deleteOrder: (id) => set((state) => {
          const orders = state.orders.filter(o => o.id !== id);
          return {
            orders,
            activeOrders: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled'),
            completedOrders: orders.filter(o => o.status === 'delivered' || o.status === 'cancelled')
          };
        }),

        updateOrderStatus: (orderId, status) => set((state) => {
          const orders = state.orders.map(o => 
            o.orderId === orderId ? { 
              ...o, 
              status,
              deliveryDate: status === 'delivered' ? new Date().toISOString().split('T')[0] : o.deliveryDate
            } : o
          );
          return {
            orders,
            activeOrders: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled'),
            completedOrders: orders.filter(o => o.status === 'delivered' || o.status === 'cancelled')
          };
        }),

        getOrdersByCustomer: (customerId) => {
          return get().orders.filter(o => o.customerId === customerId);
        },

        getOrdersByStatus: (status) => {
          return get().orders.filter(o => o.status === status);
        },

        // ===== CART ACTIONS =====
        addToCart: (product, quantity = 1) => set((state) => {
          if (!product.inStock) return state;

          const existingItem = state.items.find(item => item.id === product.id);
          let newItems;

          if (existingItem) {
            newItems = state.items.map(item =>
              item.id === product.id 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            newItems = [...state.items, { ...product, quantity }];
          }

          const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

          return { items: newItems, total, itemCount };
        }),

        removeFromCart: (productId) => set((state) => {
          const newItems = state.items.filter(item => item.id !== productId);
          const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

          return { items: newItems, total, itemCount };
        }),

        updateQuantity: (productId, quantity) => set((state) => {
          if (quantity <= 0) {
            return get().removeFromCart(productId);
          }

          const newItems = state.items.map(item =>
            item.id === productId ? { ...item, quantity } : item
          );

          const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

          return { items: newItems, total, itemCount };
        }),

        clearCart: () => set({ items: [], total: 0, itemCount: 0 }),

        applyDiscount: (discountCode) => {
          // Simulate discount validation
          const validCodes = ['FIRST20', 'SAVE10', 'LOYALTY15'];
          return validCodes.includes(discountCode.toUpperCase());
        },

        // ===== DELIVERY ACTIONS =====
        setDrivers: (drivers) => set({ drivers }),

        updateDriver: (id, updates) => set((state) => ({
          drivers: state.drivers.map(d => d.id === id ? { ...d, ...updates } : d)
        })),

        setActiveDeliveries: (deliveries) => set({ activeDeliveries: deliveries }),

        updateDeliveryProgress: (orderId, progress) => set((state) => ({
          activeDeliveries: state.activeDeliveries.map(d =>
            d.orderId === orderId ? { ...d, progress: Math.min(100, Math.max(0, progress)) } : d
          )
        })),

        assignDriver: (orderId, driverId) => set((state) => ({
          activeDeliveries: state.activeDeliveries.map(d =>
            d.orderId === orderId ? { ...d, driverId, status: 'en-route' } : d
          ),
          drivers: state.drivers.map(driver =>
            driver.id === driverId ? { ...driver, currentLoad: driver.currentLoad + 1 } : driver
          )
        })),

        updateDeliveryStatus: (orderId, status) => set((state) => ({
          activeDeliveries: state.activeDeliveries.map(d =>
            d.orderId === orderId ? { ...d, status } : d
          )
        })),

        addDeliveryIssue: (orderId, issue) => set((state) => ({
          activeDeliveries: state.activeDeliveries.map(d =>
            d.orderId === orderId ? { ...d, issues: [...d.issues, issue] } : d
          )
        })),

        resolveDeliveryIssue: (orderId, issueIndex) => set((state) => ({
          activeDeliveries: state.activeDeliveries.map(d =>
            d.orderId === orderId ? {
              ...d,
              issues: d.issues.filter((_, i) => i !== issueIndex)
            } : d
          )
        })),

        toggleDeliverySettings: (setting) => set((state) => ({
          deliverySettings: {
            ...state.deliverySettings,
            [setting]: !state.deliverySettings[setting]
          }
        })),

        // ===== NOTIFICATION ACTIONS =====
        addNotification: (notificationData) => set((state) => {
          const notification: Notification = {
            ...notificationData,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            read: false,
          };

          return {
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          };
        }),

        markAsRead: (id) => set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        })),

        markAllAsRead: () => set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        })),

        deleteNotification: (id) => set((state) => {
          const notification = state.notifications.find(n => n.id === id);
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: notification && !notification.read ? state.unreadCount - 1 : state.unreadCount
          };
        }),

        clearAllNotifications: () => set({
          notifications: [],
          unreadCount: 0
        }),

        updateSettings: (newSettings) => set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),

        // ===== AUTH ACTIONS =====
        login: async (email, password) => {
          set({ isLoading: true, error: null });
          
          try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock successful login
            const user: AuthUser = {
              id: 1,
              name: email === 'admin@fadedskies.com' ? 'Admin User' : 'Demo User',
              email,
              role: email.includes('admin') ? 'admin' : 'customer',
              isAuthenticated: true,
              token: `token-${Date.now()}`,
            };

            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              currentCustomer: user.role === 'customer' ? {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: '',
                address: '',
                dateJoined: new Date().toISOString().split('T')[0],
                totalOrders: 0,
                totalSpent: 0,
                status: 'verified',
                lastOrder: null,
                preferences: [],
                loyaltyPoints: 0,
              } : null
            });

            return true;
          } catch (error) {
            set({ isLoading: false, error: 'Login failed' });
            return false;
          }
        },

        logout: () => set({
          user: null,
          isAuthenticated: false,
          currentCustomer: null,
          items: [],
          total: 0,
          itemCount: 0,
        }),

        register: async (userData) => {
          set({ isLoading: true, error: null });
          
          try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const user: AuthUser = {
              id: Date.now(),
              name: userData.name,
              email: userData.email,
              role: 'customer',
              isAuthenticated: true,
              token: `token-${Date.now()}`,
            };

            set({ user, isAuthenticated: true, isLoading: false });
            return true;
          } catch (error) {
            set({ isLoading: false, error: 'Registration failed' });
            return false;
          }
        },

        updateProfile: (updates) => set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),

        setUser: (user) => set({ user, isAuthenticated: !!user }),

        // ===== APP ACTIONS =====
        setCurrentView: (view) => set({ currentView: view }),

        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => set({ error }),

        toggleModal: (modal) => set((state) => ({
          modals: {
            ...state.modals,
            [modal]: !state.modals[modal]
          }
        })),

        toggleLiveTracking: () => set((state) => ({
          isLiveTrackingEnabled: !state.isLiveTrackingEnabled
        })),

        updateLastUpdated: () => set({ lastUpdated: Date.now() }),

        setConnectionStatus: (status) => set({ connectionStatus: status }),

        // ===== CROSS-STORE ACTIONS =====
        placeOrder: async (customerData, deliveryAddress) => {
          const state = get();
          
          if (state.items.length === 0) {
            throw new Error('Cart is empty');
          }

          try {
            set({ isLoading: true });

            // Create order
            const orderId = `#FS${Date.now()}`;
            const order: Order = {
              id: Math.max(...state.orders.map(o => o.id), 0) + 1,
              orderId,
              customerId: state.currentCustomer?.id || 1,
              customerName: state.currentCustomer?.name || 'Guest',
              items: state.items.map(item => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price
              })),
              total: state.total,
              status: 'processing',
              paymentStatus: 'paid',
              orderDate: new Date().toISOString().split('T')[0],
              deliveryDate: null,
              address: deliveryAddress || state.currentCustomer?.address || '',
              notes: '',
            };

            // Add order
            get().addOrder(order);

            // Update product stock
            state.items.forEach(item => {
              get().updateProductStock(item.id, item.quantity);
            });

            // Update customer stats
            if (state.currentCustomer) {
              get().updateCustomerStats(state.currentCustomer.id, state.total);
            }

            // Clear cart
            get().clearCart();

            // Add notification
            get().addNotification({
              type: 'order',
              title: 'Order Placed Successfully',
              message: `Your order ${orderId} has been placed and is being prepared.`,
              priority: 'medium',
              orderId
            });

            set({ isLoading: false });
            return order;

          } catch (error) {
            set({ isLoading: false, error: 'Failed to place order' });
            return null;
          }
        },

        syncData: async () => {
          set({ connectionStatus: 'reconnecting' });
          
          try {
            // Simulate API sync
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            get().updateLastUpdated();
            set({ connectionStatus: 'connected' });
            
            // Add sync notification
            get().addNotification({
              type: 'system',
              title: 'Data Synchronized',
              message: 'All data has been synced successfully.',
              priority: 'low'
            });

          } catch (error) {
            set({ connectionStatus: 'disconnected', error: 'Sync failed' });
          }
        },

        resetStore: () => set({
          products: [],
          customers: [],
          orders: [],
          items: [],
          drivers: [],
          activeDeliveries: [],
          notifications: [],
          user: null,
          isAuthenticated: false,
          currentCustomer: null,
          currentView: 'dashboard',
          total: 0,
          itemCount: 0,
          isLoading: false,
          error: null,
        }),

        // ===== ANALYTICS =====
        getAnalytics: () => {
          const state = get();
          
          const totalRevenue = state.orders.reduce((sum, o) => sum + o.total, 0);
          const avgOrderValue = state.orders.length > 0 ? totalRevenue / state.orders.length : 0;
          
          // Top products by sales
          const productSales = state.products.map(product => {
            const sales = state.orders.reduce((sum, order) => {
              const item = order.items.find(i => i.productId === product.id);
              return sum + (item ? item.quantity : 0);
            }, 0);
            return { ...product, sales };
          }).sort((a, b) => b.sales - a.sales);

          const customerStats = {
            total: state.customers.length,
            verified: state.customers.filter(c => c.status === 'verified').length,
            avgOrderValue: state.customers.length > 0 ? 
              state.customers.reduce((sum, c) => sum + c.totalSpent, 0) / state.customers.length : 0,
            retention: state.customers.length > 0 ?
              state.customers.filter(c => c.totalOrders > 1).length / state.customers.length : 0
          };

          const driverPerformance = state.drivers.map(driver => ({
            ...driver,
            efficiency: driver.efficiency,
            ordersCompleted: driver.ordersToday,
            rating: driver.rating
          })).sort((a, b) => b.efficiency - a.efficiency);

          return {
            totalRevenue,
            avgOrderValue,
            topProducts: productSales.slice(0, 10),
            customerStats,
            driverPerformance
          };
        }
      }),
      {
        name: 'cannabis-delivery-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist only essential data
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          currentCustomer: state.currentCustomer,
          items: state.items,
          total: state.total,
          itemCount: state.itemCount,
          deliverySettings: state.deliverySettings,
          settings: state.settings,
        }),
      }
    )
  )
);

// ===== HOOKS FOR SPECIFIC SLICES =====

export const useProducts = () => {
  const store = useCannabisDeliveryStore();
  return {
    products: store.products,
    filteredProducts: store.filteredProducts,
    categories: store.categories,
    selectedCategory: store.selectedCategory,
    searchTerm: store.searchTerm,
    setProducts: store.setProducts,
    addProduct: store.addProduct,
    updateProduct: store.updateProduct,
    deleteProduct: store.deleteProduct,
    setSelectedCategory: store.setSelectedCategory,
    setSearchTerm: store.setSearchTerm,
    toggleProductFeatured: store.toggleProductFeatured,
  };
};

export const useCart = () => {
  const store = useCannabisDeliveryStore();
  return {
    items: store.items,
    total: store.total,
    itemCount: store.itemCount,
    addToCart: store.addToCart,
    removeFromCart: store.removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    applyDiscount: store.applyDiscount,
  };
};

export const useOrders = () => {
  const store = useCannabisDeliveryStore();
  return {
    orders: store.orders,
    activeOrders: store.activeOrders,
    completedOrders: store.completedOrders,
    addOrder: store.addOrder,
    updateOrder: store.updateOrder,
    deleteOrder: store.deleteOrder,
    updateOrderStatus: store.updateOrderStatus,
    getOrdersByCustomer: store.getOrdersByCustomer,
    getOrdersByStatus: store.getOrdersByStatus,
    placeOrder: store.placeOrder,
  };
};

export const useAuth = () => {
  const store = useCannabisDeliveryStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    currentCustomer: store.currentCustomer,
    login: store.login,
    logout: store.logout,
    register: store.register,
    updateProfile: store.updateProfile,
    setUser: store.setUser,
  };
};

export const useDelivery = () => {
  const store = useCannabisDeliveryStore();
  return {
    drivers: store.drivers,
    activeDeliveries: store.activeDeliveries,
    deliverySettings: store.deliverySettings,
    setDrivers: store.setDrivers,
    updateDriver: store.updateDriver,
    setActiveDeliveries: store.setActiveDeliveries,
    updateDeliveryProgress: store.updateDeliveryProgress,
    assignDriver: store.assignDriver,
    updateDeliveryStatus: store.updateDeliveryStatus,
    addDeliveryIssue: store.addDeliveryIssue,
    resolveDeliveryIssue: store.resolveDeliveryIssue,
    toggleDeliverySettings: store.toggleDeliverySettings,
  };
};

export const useNotifications = () => {
  const store = useCannabisDeliveryStore();
  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    settings: store.settings,
    addNotification: store.addNotification,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    deleteNotification: store.deleteNotification,
    clearAllNotifications: store.clearAllNotifications,
    updateSettings: store.updateSettings,
  };
};

export const useApp = () => {
  const store = useCannabisDeliveryStore();
  return {
    currentView: store.currentView,
    isLoading: store.isLoading,
    error: store.error,
    modals: store.modals,
    isLiveTrackingEnabled: store.isLiveTrackingEnabled,
    connectionStatus: store.connectionStatus,
    setCurrentView: store.setCurrentView,
    setLoading: store.setLoading,
    setError: store.setError,
    toggleModal: store.toggleModal,
    toggleLiveTracking: store.toggleLiveTracking,
    syncData: store.syncData,
    resetStore: store.resetStore,
    getAnalytics: store.getAnalytics,
  };
};

// ===== REAL-TIME SUBSCRIPTION HELPERS =====

export const subscribeToOrderUpdates = (callback: (orders: Order[]) => void) => {
  return useCannabisDeliveryStore.subscribe(
    (state) => state.orders,
    callback
  );
};

export const subscribeToDeliveryUpdates = (callback: (deliveries: ActiveDelivery[]) => void) => {
  return useCannabisDeliveryStore.subscribe(
    (state) => state.activeDeliveries,
    callback
  );
};

export const subscribeToNotifications = (callback: (notifications: Notification[]) => void) => {
  return useCannabisDeliveryStore.subscribe(
    (state) => state.notifications,
    callback
  );
};

// ===== INITIALIZATION HELPER =====

export const initializeStore = async (initialData?: Partial<CannabisDeliveryStore>) => {
  const store = useCannabisDeliveryStore.getState();
  
  if (initialData) {
    if (initialData.products) store.setProducts(initialData.products);
    if (initialData.customers) store.setCustomers(initialData.customers);
    if (initialData.orders) store.setOrders(initialData.orders);
    if (initialData.drivers) store.setDrivers(initialData.drivers);
    if (initialData.activeDeliveries) store.setActiveDeliveries(initialData.activeDeliveries);
  }

  // Start real-time sync
  store.syncData();
  
  // Set up periodic sync every 30 seconds
  setInterval(() => {
    if (store.connectionStatus === 'connected') {
      store.syncData();
    }
  }, 30000);
};

export default useCannabisDeliveryStore;