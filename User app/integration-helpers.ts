// ===== INTEGRATION HELPERS FOR EXISTING COMPONENTS =====

import React, { useEffect, useCallback } from 'react';
import { 
  useCannabisDeliveryStore,
  useProducts,
  useCart,
  useOrders,
  useAuth,
  useDelivery,
  useNotifications,
  useApp,
  apiService,
  wsService,
  initializeServices
} from './cannabis-delivery-store';
import { apiService as api } from './api-integration-service';

// ===== MIGRATION HELPERS =====

// Convert local state to store state for FadedSkiesApp component
export const useFadedSkiesAppIntegration = () => {
  const auth = useAuth();
  const cart = useCart();
  const products = useProducts();
  const orders = useOrders();
  const notifications = useNotifications();
  const app = useApp();

  // Initialize services when component mounts
  useEffect(() => {
    initializeServices();
    return () => {
      // Cleanup on unmount
      wsService.disconnect();
    };
  }, []);

  // Auto-connect WebSocket when user logs in
  useEffect(() => {
    if (auth.isAuthenticated && auth.user?.token) {
      wsService.connect(auth.user.token);
      api.initialize(auth.user.token);
    } else {
      wsService.disconnect();
    }
  }, [auth.isAuthenticated, auth.user?.token]);

  return {
    // Auth state and actions
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    currentCustomer: auth.currentCustomer,
    login: auth.login,
    logout: auth.logout,
    register: auth.register,
    
    // Cart state and actions
    cart: cart.items,
    cartTotal: cart.total,
    cartCount: cart.itemCount,
    addToCart: cart.addToCart,
    updateQuantity: cart.updateQuantity,
    clearCart: cart.clearCart,
    
    // Products state and actions
    products: products.filteredProducts,
    allProducts: products.products,
    selectedCategory: products.selectedCategory,
    searchTerm: products.searchTerm,
    setSelectedCategory: products.setSelectedCategory,
    setSearchTerm: products.setSearchTerm,
    
    // Orders
    orders: orders.orders,
    placeOrder: orders.placeOrder,
    
    // Notifications
    notifications: notifications.notifications,
    unreadCount: notifications.unreadCount,
    addNotification: notifications.addNotification,
    markAsRead: notifications.markAsRead,
    
    // App state
    isLoading: app.isLoading,
    error: app.error,
    setError: app.setError,
  };
};

// Convert local state to store state for Admin component
export const useAdminIntegration = () => {
  const products = useProducts();
  const orders = useOrders();
  const delivery = useDelivery();
  const auth = useAuth();
  const app = useApp();
  const store = useCannabisDeliveryStore();

  // Initialize admin services
  useEffect(() => {
    if (auth.user?.role === 'admin') {
      initializeServices();
      wsService.subscribeToDeliveries();
    }
  }, [auth.user?.role]);

  // Auto-sync for admin
  useEffect(() => {
    if (auth.user?.role === 'admin') {
      const interval = setInterval(async () => {
        await Promise.all([
          api.getProducts(),
          api.getOrders(),
          api.getActiveDeliveries(),
          api.getDrivers(),
        ]);
      }, 30000); // Sync every 30 seconds for admin

      return () => clearInterval(interval);
    }
  }, [auth.user?.role]);

  return {
    // Current view management
    currentView: app.currentView,
    setCurrentView: app.setCurrentView,
    
    // Products management
    products: products.products,
    addProduct: products.addProduct,
    updateProduct: products.updateProduct,
    deleteProduct: products.deleteProduct,
    
    // Orders management
    orders: orders.orders,
    activeOrders: orders.activeOrders,
    completedOrders: orders.completedOrders,
    addOrder: orders.addOrder,
    updateOrder: orders.updateOrder,
    deleteOrder: orders.deleteOrder,
    updateOrderStatus: orders.updateOrderStatus,
    
    // Delivery management
    drivers: delivery.drivers,
    activeDeliveries: delivery.activeDeliveries,
    updateDriver: delivery.updateDriver,
    updateDeliveryProgress: delivery.updateDeliveryProgress,
    assignDriver: delivery.assignDriver,
    updateDeliveryStatus: delivery.updateDeliveryStatus,
    deliverySettings: delivery.deliverySettings,
    toggleDeliverySettings: delivery.toggleDeliverySettings,
    
    // Customers
    customers: store.customers,
    addCustomer: store.addCustomer,
    updateCustomer: store.updateCustomer,
    deleteCustomer: store.deleteCustomer,
    
    // Analytics
    getAnalytics: app.getAnalytics,
    
    // App state
    isLoading: app.isLoading,
    error: app.error,
    setError: app.setError,
    isLiveTrackingEnabled: app.isLiveTrackingEnabled,
    toggleLiveTracking: app.toggleLiveTracking,
    connectionStatus: app.connectionStatus,
  };
};

// ===== REAL-TIME HOOKS =====

// Hook for real-time order tracking
export const useOrderTracking = (orderId?: string) => {
  const orders = useOrders();
  const delivery = useDelivery();
  const notifications = useNotifications();

  useEffect(() => {
    if (orderId) {
      wsService.subscribeToOrder(orderId);
    }
  }, [orderId]);

  const getOrderProgress = useCallback(() => {
    if (!orderId) return null;
    
    const activeDelivery = delivery.activeDeliveries.find(d => d.orderId === orderId);
    const order = orders.orders.find(o => o.orderId === orderId);
    
    return {
      order,
      delivery: activeDelivery,
      progress: activeDelivery?.progress || 0,
      status: activeDelivery?.status || order?.status || 'unknown',
      estimatedTime: activeDelivery?.estimatedTime,
      driver: delivery.drivers.find(d => d.id === activeDelivery?.driverId),
    };
  }, [orderId, orders.orders, delivery.activeDeliveries, delivery.drivers]);

  return {
    orderProgress: getOrderProgress(),
    updateProgress: delivery.updateDeliveryProgress,
  };
};

// Hook for driver real-time updates
export const useDriverTracking = (driverId?: number) => {
  const delivery = useDelivery();

  useEffect(() => {
    if (driverId) {
      wsService.subscribeToDriver(driverId);
    }
  }, [driverId]);

  const driver = driverId ? delivery.drivers.find(d => d.id === driverId) : null;
  const driverDeliveries = delivery.activeDeliveries.filter(d => d.driverId === driverId);

  return {
    driver,
    deliveries: driverDeliveries,
    updateDriver: delivery.updateDriver,
    sendMessage: (message: string) => {
      if (driverId) {
        wsService.sendDriverMessage(driverId, message);
      }
    },
  };
};

// Hook for live analytics
export const useLiveAnalytics = () => {
  const app = useApp();
  const [analytics, setAnalytics] = React.useState(() => app.getAnalytics());

  useEffect(() => {
    const updateAnalytics = () => {
      setAnalytics(app.getAnalytics());
    };

    // Update analytics every 30 seconds
    const interval = setInterval(updateAnalytics, 30000);
    
    // Update immediately
    updateAnalytics();

    return () => clearInterval(interval);
  }, [app]);

  return analytics;
};

// ===== COMPONENT WRAPPERS =====

// HOC to provide store integration to any component
export const withStoreIntegration = <T extends object>(
  Component: React.ComponentType<T>
) => {
  return React.forwardRef<any, T>((props, ref) => {
    const store = useCannabisDeliveryStore();
    
    return (
      <Component
        {...props}
        ref={ref}
        store={store}
      />
    );
  });
};

// Provider component for store context
export const CannabisDeliveryProvider: React.FC<{
  children: React.ReactNode;
  autoSync?: boolean;
}> = ({ children, autoSync = true }) => {
  const app = useApp();

  useEffect(() => {
    // Initialize services
    initializeServices();

    // Set up auto-sync if enabled
    if (autoSync) {
      const interval = setInterval(() => {
        app.syncData();
      }, 60000); // Sync every minute

      return () => clearInterval(interval);
    }
  }, [autoSync, app]);

  return <>{children}</>;
};

// ===== MIGRATION UTILITIES =====

// Helper to migrate existing product data
export const migrateProductData = (existingProducts: any[]) => {
  const store = useCannabisDeliveryStore.getState();
  
  const migratedProducts = existingProducts.map(product => ({
    ...product,
    // Add any missing fields with defaults
    stock: product.stock || 0,
    supplier: product.supplier || 'Unknown',
    status: product.status || 'active',
    dateAdded: product.dateAdded || new Date().toISOString().split('T')[0],
    strainType: product.strainType || undefined,
    batchNumber: product.batchNumber || undefined,
    harvestDate: product.harvestDate || undefined,
    labResults: product.labResults || undefined,
  }));

  store.setProducts(migratedProducts);
  return migratedProducts;
};

// Helper to migrate existing order data
export const migrateOrderData = (existingOrders: any[]) => {
  const store = useCannabisDeliveryStore.getState();
  
  const migratedOrders = existingOrders.map(order => ({
    ...order,
    // Ensure all required fields exist
    paymentStatus: order.paymentStatus || 'pending',
    notes: order.notes || '',
    estimatedDelivery: order.estimatedDelivery || '30-45 minutes',
  }));

  store.setOrders(migratedOrders);
  return migratedOrders;
};

// Helper to migrate existing customer data
export const migrateCustomerData = (existingCustomers: any[]) => {
  const store = useCannabisDeliveryStore.getState();
  
  const migratedCustomers = existingCustomers.map(customer => ({
    ...customer,
    // Add missing fields
    preferences: customer.preferences || [],
    loyaltyPoints: customer.loyaltyPoints || 0,
    age: customer.age || undefined,
    idVerified: customer.idVerified || false,
  }));

  store.setCustomers(migratedCustomers);
  return migratedCustomers;
};

// ===== TESTING UTILITIES =====

// Mock data generator for testing
export const generateMockData = () => {
  const store = useCannabisDeliveryStore.getState();

  // Mock products
  const mockProducts = [
    {
      id: 1,
      name: 'Premium Blue Dream Flower',
      category: 'Flower',
      price: 45.00,
      originalPrice: null,
      thc: '18.5%',
      cbd: '0.2%',
      strain: 'Hybrid',
      rating: 4.8,
      reviewCount: 124,
      imageUrl: 'https://example.com/blue-dream.jpg',
      description: 'Premium indoor-grown Blue Dream with sweet berry notes.',
      effects: ['Creative', 'Energetic', 'Happy'],
      labTested: true,
      inStock: true,
      featured: true,
      stock: 50,
      supplier: 'Green Valley Farms',
      status: 'active' as const,
      dateAdded: '2025-01-01',
      strainType: 'hybrid' as const,
    },
    {
      id: 2,
      name: 'Midnight Mint Gummies',
      category: 'Edibles',
      price: 28.00,
      originalPrice: 35.00,
      thc: '10mg each',
      cbd: '2mg each',
      strain: 'Indica',
      rating: 4.6,
      reviewCount: 89,
      imageUrl: 'https://example.com/gummies.jpg',
      description: 'Delicious mint-flavored gummies perfect for relaxation.',
      effects: ['Relaxed', 'Sleepy', 'Pain Relief'],
      labTested: true,
      inStock: true,
      featured: false,
      stock: 75,
      supplier: 'Sweet Relief Co.',
      status: 'active' as const,
      dateAdded: '2025-01-05',
    },
  ];

  // Mock customers
  const mockCustomers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, Austin, TX 78701',
      dateJoined: '2024-12-01',
      totalOrders: 5,
      totalSpent: 250.00,
      status: 'verified' as const,
      lastOrder: '2025-01-10',
      preferences: ['Flower', 'Edibles'],
      loyaltyPoints: 125,
    },
  ];

  // Mock drivers
  const mockDrivers = [
    {
      id: 1,
      name: 'Mike Johnson',
      phone: '+1 (555) 987-6543',
      vehicle: 'Honda Civic - ABC123',
      status: 'available' as const,
      ordersToday: 8,
      rating: 4.9,
      online: true,
      currentLocation: 'Downtown Austin',
      batteryLevel: 85,
      lastUpdate: '2 mins ago',
      currentLoad: 1,
      maxLoad: 3,
      efficiency: 0.95,
      zone: 'central' as const,
    },
  ];

  // Set mock data
  store.setProducts(mockProducts);
  store.setCustomers(mockCustomers);
  store.setDrivers(mockDrivers);

  console.log('✅ Mock data generated and loaded');
};

// Reset store for testing
export const resetStoreForTesting = () => {
  const store = useCannabisDeliveryStore.getState();
  store.resetStore();
  console.log('🧹 Store reset for testing');
};

// ===== PERFORMANCE OPTIMIZATION =====

// Memoized selectors for performance
export const useOptimizedProducts = () => {
  const products = useProducts();
  
  return React.useMemo(() => ({
    featuredProducts: products.products.filter(p => p.featured),
    inStockProducts: products.products.filter(p => p.inStock),
    lowStockProducts: products.products.filter(p => p.stock < 10),
    categoryCounts: products.categories.reduce((acc, category) => {
      acc[category] = products.products.filter(p => 
        category === 'All' || p.category === category
      ).length;
      return acc;
    }, {} as Record<string, number>),
  }), [products.products, products.categories]);
};

export const useOptimizedOrders = () => {
  const orders = useOrders();
  
  return React.useMemo(() => ({
    todaysOrders: orders.orders.filter(o => 
      o.orderDate === new Date().toISOString().split('T')[0]
    ),
    recentOrders: orders.orders.slice(0, 10),
    ordersByStatus: orders.orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalRevenue: orders.orders.reduce((sum, o) => sum + o.total, 0),
  }), [orders.orders]);
};

// ===== ERROR BOUNDARY INTEGRATION =====

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class StoreErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Store Error Boundary caught an error:', error, errorInfo);
    
    // Report to store
    const store = useCannabisDeliveryStore.getState();
    store.setError(`Application error: ${error.message}`);
    store.addNotification({
      type: 'system',
      title: 'Application Error',
      message: 'An unexpected error occurred. Please refresh the page.',
      priority: 'high',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              Please refresh the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ===== EXPORT ALL =====

export default {
  useFadedSkiesAppIntegration,
  useAdminIntegration,
  useOrderTracking,
  useDriverTracking,
  useLiveAnalytics,
  withStoreIntegration,
  CannabisDeliveryProvider,
  StoreErrorBoundary,
  migrateProductData,
  migrateOrderData,
  migrateCustomerData,
  generateMockData,
  resetStoreForTesting,
  useOptimizedProducts,
  useOptimizedOrders,
};

// ===== USAGE EXAMPLES =====

/*
// Example 1: Migrating FadedSkiesApp component
import { useFadedSkiesAppIntegration } from './integration-helpers';

const FadedSkiesApp = () => {
  const {
    isAuthenticated,
    user,
    cart,
    cartTotal,
    addToCart,
    products,
    login,
    logout,
    // ... other props
  } = useFadedSkiesAppIntegration();

  // Replace all local useState calls with the props from the hook
  // The component logic remains the same, but state comes from the store
  
  return (
    // Your existing JSX
  );
};

// Example 2: Migrating Admin component
import { useAdminIntegration } from './integration-helpers';

const AdminDashboard = () => {
  const {
    currentView,
    setCurrentView,
    products,
    orders,
    drivers,
    activeDeliveries,
    addProduct,
    updateProduct,
    // ... other props
  } = useAdminIntegration();

  // Replace all local useState calls with the props from the hook
  
  return (
    // Your existing JSX
  );
};

// Example 3: Adding real-time tracking
import { useOrderTracking } from './integration-helpers';

const OrderTrackingComponent = ({ orderId }) => {
  const { orderProgress, updateProgress } = useOrderTracking(orderId);

  return (
    <div>
      <h3>Order Status: {orderProgress?.status}</h3>
      <div>Progress: {orderProgress?.progress}%</div>
      {orderProgress?.driver && (
        <div>Driver: {orderProgress.driver.name}</div>
      )}
    </div>
  );
};

// Example 4: App setup with provider
import { CannabisDeliveryProvider, StoreErrorBoundary } from './integration-helpers';

const App = () => {
  return (
    <StoreErrorBoundary>
      <CannabisDeliveryProvider autoSync={true}>
        <FadedSkiesApp />
      </CannabisDeliveryProvider>
    </StoreErrorBoundary>
  );
};
*/