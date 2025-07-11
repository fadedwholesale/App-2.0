# Cannabis Delivery State Management Integration Guide

## 🚀 Quick Start

### 1. Installation

```bash
# Install required dependencies
npm install zustand immer
# or
yarn add zustand immer
```

### 2. File Structure

```
src/
├── store/
│   ├── cannabis-delivery-store.ts      # Main state management store
│   ├── api-integration-service.ts      # API client & WebSocket service
│   └── integration-helpers.ts          # Migration helpers & hooks
├── components/
│   ├── FadedSkiesApp.tsx               # Customer app (your existing)
│   └── FadedSkiesAdmin.tsx             # Admin dashboard (your existing)
└── App.tsx                             # Root component
```

### 3. Basic Setup

```typescript
// App.tsx
import React from 'react';
import { CannabisDeliveryProvider, StoreErrorBoundary } from './store/integration-helpers';
import FadedSkiesApp from './components/FadedSkiesApp';

function App() {
  return (
    <StoreErrorBoundary>
      <CannabisDeliveryProvider autoSync={true}>
        <FadedSkiesApp />
      </CannabisDeliveryProvider>
    </StoreErrorBoundary>
  );
}

export default App;
```

---

## 📦 Store Features

### ✅ What's Included

- **Products Management**: Full CRUD operations with categories, search, and inventory tracking
- **Orders Management**: Order lifecycle, status updates, and customer tracking
- **Cart System**: Add/remove items, quantity updates, and checkout process
- **Customer Management**: Customer profiles, order history, and loyalty points
- **Delivery Tracking**: Real-time driver tracking, route optimization, and progress updates
- **Authentication**: Login, registration, and role-based access control
- **Notifications**: Real-time alerts, order updates, and system messages
- **Analytics**: Revenue tracking, customer insights, and performance metrics
- **Real-time Sync**: WebSocket integration for live updates
- **Offline Support**: Local storage persistence and sync when online

### 🔄 Real-time Features

- Live order tracking
- Driver location updates
- Inventory alerts
- Customer notifications
- Admin dashboard updates
- Cross-device synchronization

---

## 🔧 Migration Process

### Step 1: Migrate FadedSkiesApp Component

**Before (using local state):**
```typescript
const FadedSkiesApp = () => {
  const [currentView, setCurrentView] = useState('auth');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  // ... many more useState calls
};
```

**After (using store):**
```typescript
import { useFadedSkiesAppIntegration } from './store/integration-helpers';

const FadedSkiesApp = () => {
  const {
    // Auth state
    isAuthenticated,
    user,
    currentCustomer,
    login,
    logout,
    register,
    
    // Cart state
    cart,
    cartTotal,
    cartCount,
    addToCart,
    updateQuantity,
    clearCart,
    
    // Products state
    products,
    selectedCategory,
    searchTerm,
    setSelectedCategory,
    setSearchTerm,
    
    // Orders
    orders,
    placeOrder,
    
    // Notifications
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    
    // App state
    isLoading,
    error,
    setError,
  } = useFadedSkiesAppIntegration();

  // The rest of your component logic stays the same!
  // Just replace state variables with the ones from the hook
};
```

### Step 2: Migrate Admin Dashboard

**Replace admin state management:**
```typescript
import { useAdminIntegration } from './store/integration-helpers';

const FadedSkiesTrackingAdmin = () => {
  const {
    // View management
    currentView,
    setCurrentView,
    
    // Products
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    
    // Orders
    orders,
    activeOrders,
    completedOrders,
    updateOrderStatus,
    
    // Delivery
    drivers,
    activeDeliveries,
    updateDeliveryProgress,
    assignDriver,
    
    // Analytics
    getAnalytics,
    
    // App state
    isLoading,
    error,
    isLiveTrackingEnabled,
    toggleLiveTracking,
  } = useAdminIntegration();

  // Your existing component logic works with these new props
};
```

### Step 3: Add Real-time Features

**Order tracking with live updates:**
```typescript
import { useOrderTracking } from './store/integration-helpers';

const OrderTrackingModal = ({ orderId }) => {
  const { orderProgress, updateProgress } = useOrderTracking(orderId);

  return (
    <div>
      <h3>Order {orderId}</h3>
      <div>Status: {orderProgress?.status}</div>
      <div>Progress: {orderProgress?.progress}%</div>
      <div>ETA: {orderProgress?.estimatedTime}</div>
      {orderProgress?.driver && (
        <div>Driver: {orderProgress.driver.name}</div>
      )}
    </div>
  );
};
```

**Driver tracking for admins:**
```typescript
import { useDriverTracking } from './store/integration-helpers';

const DriverManagement = ({ driverId }) => {
  const { driver, deliveries, updateDriver, sendMessage } = useDriverTracking(driverId);

  const handleSendMessage = () => {
    sendMessage("Please update your location");
  };

  return (
    <div>
      <h3>{driver?.name}</h3>
      <p>Status: {driver?.status}</p>
      <p>Current deliveries: {deliveries.length}</p>
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
};
```

---

## 🔄 Data Migration

### Migrate Existing Data

```typescript
import { 
  migrateProductData, 
  migrateOrderData, 
  migrateCustomerData 
} from './store/integration-helpers';

// In your app initialization
const initializeApp = async () => {
  // Migrate your existing data
  const existingProducts = [/* your current products */];
  const existingOrders = [/* your current orders */];
  const existingCustomers = [/* your current customers */];

  migrateProductData(existingProducts);
  migrateOrderData(existingOrders);
  migrateCustomerData(existingCustomers);

  console.log('✅ Data migration complete');
};
```

### Generate Test Data

```typescript
import { generateMockData } from './store/integration-helpers';

// For testing/development
const setupTestData = () => {
  generateMockData();
  console.log('✅ Test data loaded');
};
```

---

## 🌐 API Integration

### Setup Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.fadedskies.com/v1
NEXT_PUBLIC_WS_URL=wss://ws.fadedskies.com
```

### Initialize Services

```typescript
import { initializeServices } from './store/api-integration-service';

// In your app startup
useEffect(() => {
  initializeServices();
}, []);
```

### API Service Usage

```typescript
import { apiService } from './store/api-integration-service';

// The store automatically syncs with the API
// But you can also call API methods directly:

const handleCreateProduct = async (productData) => {
  const response = await apiService.createProduct(productData);
  if (response.success) {
    console.log('Product created:', response.data);
  } else {
    console.error('Error:', response.error);
  }
};
```

---

## 📊 Analytics Integration

### Live Analytics Dashboard

```typescript
import { useLiveAnalytics } from './store/integration-helpers';

const AnalyticsDashboard = () => {
  const analytics = useLiveAnalytics();

  return (
    <div>
      <h2>Live Analytics</h2>
      <div>Total Revenue: ${analytics.totalRevenue}</div>
      <div>Avg Order Value: ${analytics.avgOrderValue}</div>
      <div>Top Products:</div>
      {analytics.topProducts.map(product => (
        <div key={product.id}>{product.name} - {product.sales} sold</div>
      ))}
    </div>
  );
};
```

---

## 🚨 Error Handling

### Global Error Boundary

```typescript
import { StoreErrorBoundary } from './store/integration-helpers';

const App = () => {
  return (
    <StoreErrorBoundary>
      {/* Your app components */}
    </StoreErrorBoundary>
  );
};
```

### API Error Handling

```typescript
import { handleApiError } from './store/api-integration-service';

const MyComponent = () => {
  const handleAction = async () => {
    try {
      await apiService.someMethod();
    } catch (error) {
      handleApiError(error, 'MyComponent.handleAction');
    }
  };
};
```

---

## ⚡ Performance Optimization

### Optimized Selectors

```typescript
import { useOptimizedProducts, useOptimizedOrders } from './store/integration-helpers';

const Dashboard = () => {
  const {
    featuredProducts,
    inStockProducts,
    lowStockProducts,
    categoryCounts
  } = useOptimizedProducts();

  const {
    todaysOrders,
    recentOrders,
    ordersByStatus,
    totalRevenue
  } = useOptimizedOrders();

  // These selectors are memoized for performance
};
```

---

## 🧪 Testing

### Test Utilities

```typescript
import { resetStoreForTesting, generateMockData } from './store/integration-helpers';

describe('My Component', () => {
  beforeEach(() => {
    resetStoreForTesting();
    generateMockData();
  });

  it('should work with store data', () => {
    // Your tests
  });
});
```

---

## 📋 Migration Checklist

### ✅ Phase 1: Basic Setup
- [ ] Install dependencies (zustand, immer)
- [ ] Copy store files to your project
- [ ] Wrap app in `CannabisDeliveryProvider`
- [ ] Add `StoreErrorBoundary`
- [ ] Test basic functionality

### ✅ Phase 2: Customer App Migration  
- [ ] Replace `FadedSkiesApp` state with `useFadedSkiesAppIntegration`
- [ ] Update auth flow to use store
- [ ] Update cart functionality
- [ ] Update product browsing
- [ ] Test order placement
- [ ] Test notifications

### ✅ Phase 3: Admin Dashboard Migration
- [ ] Replace admin state with `useAdminIntegration`
- [ ] Update product management
- [ ] Update order management
- [ ] Update customer management
- [ ] Update delivery tracking
- [ ] Test live tracking features

### ✅ Phase 4: Real-time Features
- [ ] Set up WebSocket connection
- [ ] Add order tracking with `useOrderTracking`
- [ ] Add driver tracking with `useDriverTracking`
- [ ] Test real-time notifications
- [ ] Test cross-device sync

### ✅ Phase 5: API Integration
- [ ] Set up environment variables
- [ ] Initialize API services
- [ ] Test API endpoints
- [ ] Set up error handling
- [ ] Test offline/online sync

### ✅ Phase 6: Analytics & Optimization
- [ ] Add analytics dashboard
- [ ] Implement performance optimizations
- [ ] Add monitoring and logging
- [ ] Test with realistic data loads

---

## 🎯 Key Benefits After Migration

### For Developers
- **Centralized State**: All app state in one place
- **Type Safety**: Full TypeScript support
- **Real-time Updates**: Automatic WebSocket sync
- **Error Handling**: Centralized error management
- **Testing**: Built-in test utilities
- **Performance**: Optimized selectors and memoization

### For Users (Customer App)
- **Real-time Updates**: Live order tracking
- **Offline Support**: App works without internet
- **Cross-device Sync**: Cart syncs across devices
- **Faster Performance**: Optimized state updates
- **Better UX**: Instant notifications

### For Admins (Dashboard)
- **Live Tracking**: Real-time delivery monitoring
- **Auto-sync**: Data always up-to-date
- **Better Analytics**: Live performance metrics
- **Improved Efficiency**: Automated workflows
- **Better Communication**: Real-time driver updates

---

## 🤝 Support & Troubleshooting

### Common Issues

**1. Components not updating:**
```typescript
// Make sure you're using the integration hooks
const { products } = useFadedSkiesAppIntegration(); // ✅ Correct
// instead of
const [products, setProducts] = useState([]); // ❌ Old way
```

**2. WebSocket not connecting:**
```typescript
// Check your environment variables
console.log('WS_URL:', process.env.NEXT_PUBLIC_WS_URL);

// Make sure user is authenticated
const { user } = useAuth();
if (user?.token) {
  wsService.connect(user.token);
}
```

**3. Data not persisting:**
```typescript
// The store automatically persists auth and cart data
// Check browser localStorage for 'cannabis-delivery-store'
```

### Debug Tools

```typescript
// Access store state directly for debugging
import { useCannabisDeliveryStore } from './store/cannabis-delivery-store';

const DebugPanel = () => {
  const store = useCannabisDeliveryStore();
  
  return (
    <pre>{JSON.stringify(store, null, 2)}</pre>
  );
};
```

---

## 🎉 You're All Set!

Your cannabis delivery app now has:
- ✅ Centralized state management
- ✅ Real-time synchronization  
- ✅ Offline support
- ✅ Type safety
- ✅ Error handling
- ✅ Performance optimization
- ✅ Analytics tracking
- ✅ Testing utilities

The store handles all the complex state synchronization between your customer app and admin dashboard, providing a seamless experience for both users and administrators.

Happy coding! 🌿📱