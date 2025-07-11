// ===== READY-TO-USE STORE-INTEGRATED COMPONENTS =====

import React, { useState, useEffect } from 'react';
import { 
  useCannabisDeliveryStore,
  useProducts,
  useCart,
  useOrders,
  useAuth,
  useDelivery,
  useNotifications,
  useOrderTracking,
  useDriverTracking
} from './cannabis-delivery-store';
import { apiService, wsService } from './api-integration-service';

// ===== NOTIFICATION SYSTEM =====

export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">
                          {notification.type === 'order' ? '📦' :
                           notification.type === 'delivery' ? '🚚' :
                           notification.type === 'system' ? '⚙️' : '🎯'}
                        </span>
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                        <div className="flex space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-emerald-600 hover:text-emerald-700"
                            >
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== LIVE ORDER TRACKER =====

export const LiveOrderTracker: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { orderProgress } = useOrderTracking(orderId);

  if (!orderProgress) {
    return <div>Order not found</div>;
  }

  const { order, delivery, progress, status, estimatedTime, driver } = orderProgress;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return '🔄';
      case 'preparing': return '👩‍🍳';
      case 'en-route': return '🚚';
      case 'delivered': return '✅';
      default: return '📦';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'preparing': return 'text-blue-600 bg-blue-100';
      case 'en-route': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Order {orderId}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
          {getStatusIcon(status)} {status.toUpperCase()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Order Details */}
      {order && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-1">
              <span className="text-gray-700">{item.quantity}x {item.name}</span>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Driver Info */}
      {driver && delivery?.status === 'en-route' && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-2">Your Driver</h4>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {driver.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{driver.name}</p>
              <p className="text-sm text-gray-600">{driver.vehicle}</p>
              <p className="text-sm text-gray-600">⭐ {driver.rating} rating</p>
            </div>
          </div>
          {estimatedTime && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                🕒 Estimated arrival: <strong>{estimatedTime}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===== SMART CART WIDGET =====

export const SmartCartWidget: React.FC = () => {
  const { items, total, itemCount, removeFromCart, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  if (itemCount === 0) {
    return (
      <button className="fixed bottom-4 right-4 bg-gray-300 text-gray-500 p-4 rounded-full shadow-lg cursor-not-allowed">
        🛒 <span className="ml-2">0</span>
      </button>
    );
  }

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-colors z-40"
      >
        🛒 <span className="ml-2 font-bold">{itemCount}</span>
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          {itemCount}
        </div>
      </button>

      {/* Cart Slideout */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Your Cart</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600">{itemCount} items • ${total.toFixed(2)}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-2xl">🌿</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-300"
                      >
                        −
                      </button>
                      <span className="font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white hover:bg-emerald-700"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-xl text-emerald-600">${total.toFixed(2)}</span>
              </div>
              <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ===== PRODUCT SEARCH WITH FILTERS =====

export const SmartProductSearch: React.FC = () => {
  const { 
    products, 
    filteredProducts, 
    categories, 
    selectedCategory, 
    searchTerm,
    setSelectedCategory,
    setSearchTerm 
  } = useProducts();
  
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);

  const sortedProducts = React.useMemo(() => {
    let sorted = [...filteredProducts];
    
    // Apply price filter
    sorted = sorted.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    
    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'thc':
        sorted.sort((a, b) => parseFloat(b.thc) - parseFloat(a.thc));
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return sorted;
  }, [filteredProducts, priceRange, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      {/* Category Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Filters and Sort */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <span>🔧</span>
          <span>Filters</span>
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="name">Sort by Name</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="thc">Highest THC</option>
        </select>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {sortedProducts.length} products found
      </div>
    </div>
  );
};

// ===== LIVE DRIVER DASHBOARD =====

export const LiveDriverDashboard: React.FC = () => {
  const { drivers, activeDeliveries, updateDriver, assignDriver } = useDelivery();
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  const onlineDrivers = drivers.filter(d => d.online);
  const availableDrivers = drivers.filter(d => d.online && d.status === 'available');
  const busyDrivers = drivers.filter(d => d.online && d.status === 'delivering');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Live Driver Dashboard</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{availableDrivers.length} Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>{busyDrivers.length} Delivering</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>{drivers.length - onlineDrivers.length} Offline</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedDriver === driver.id 
                ? 'border-emerald-500 bg-emerald-50' 
                : 'border-gray-200 hover:border-gray-300'
            } ${!driver.online ? 'opacity-50' : ''}`}
            onClick={() => setSelectedDriver(driver.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                  driver.online 
                    ? driver.status === 'available' ? 'bg-green-500' : 'bg-blue-500'
                    : 'bg-gray-400'
                }`}>
                  {driver.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{driver.name}</h4>
                  <p className="text-sm text-gray-600">{driver.vehicle}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                driver.online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  driver.status === 'available' ? 'text-green-600' :
                  driver.status === 'delivering' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {driver.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Today's Orders:</span>
                <span className="font-medium">{driver.ordersToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rating:</span>
                <span className="font-medium">⭐ {driver.rating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Load:</span>
                <span className="font-medium">{driver.currentLoad}/{driver.maxLoad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Battery:</span>
                <span className={`font-medium ${
                  driver.batteryLevel > 50 ? 'text-green-600' :
                  driver.batteryLevel > 20 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  🔋 {driver.batteryLevel}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Update:</span>
                <span className="text-xs text-gray-500">{driver.lastUpdate}</span>
              </div>
            </div>

            {driver.online && driver.currentLoad < driver.maxLoad && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Here you could open a modal to assign an order
                    alert(`Assign order to ${driver.name}`);
                  }}
                  className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Assign Order
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== ANALYTICS WIDGET =====

export const AnalyticsWidget: React.FC = () => {
  const store = useCannabisDeliveryStore();
  const analytics = store.getAnalytics();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100">Total Revenue</p>
            <p className="text-2xl font-bold">${analytics.totalRevenue.toFixed(0)}</p>
          </div>
          <span className="text-3xl">💰</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Avg Order Value</p>
            <p className="text-2xl font-bold">${analytics.avgOrderValue.toFixed(0)}</p>
          </div>
          <span className="text-3xl">📊</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100">Total Customers</p>
            <p className="text-2xl font-bold">{analytics.customerStats.total}</p>
          </div>
          <span className="text-3xl">👥</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100">Retention Rate</p>
            <p className="text-2xl font-bold">{(analytics.customerStats.retention * 100).toFixed(0)}%</p>
          </div>
          <span className="text-3xl">🔄</span>
        </div>
      </div>
    </div>
  );
};

// ===== CONNECTION STATUS INDICATOR =====

export const ConnectionStatusIndicator: React.FC = () => {
  const { connectionStatus } = useCannabisDeliveryStore();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: 'Connected',
          icon: '🟢'
        };
      case 'reconnecting':
        return {
          color: 'bg-yellow-500',
          text: 'Reconnecting...',
          icon: '🟡'
        };
      case 'disconnected':
        return {
          color: 'bg-red-500',
          text: 'Disconnected',
          icon: '🔴'
        };
      default:
        return {
          color: 'bg-gray-500',
          text: 'Unknown',
          icon: '⚪'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${config.color} ${
        connectionStatus === 'reconnecting' ? 'animate-pulse' : ''
      }`}></div>
      <span className="text-gray-600">{config.text}</span>
    </div>
  );
};

// ===== EXPORT ALL COMPONENTS =====

export default {
  NotificationCenter,
  LiveOrderTracker,
  SmartCartWidget,
  SmartProductSearch,
  LiveDriverDashboard,
  AnalyticsWidget,
  ConnectionStatusIndicator,
};

// ===== USAGE EXAMPLES =====

/*
// Example: Add to your main app
const App = () => {
  return (
    <CannabisDeliveryProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <h1>Faded Skies</h1>
          <div className="flex items-center space-x-4">
            <ConnectionStatusIndicator />
            <NotificationCenter />
          </div>
        </header>
        
        <main className="container mx-auto p-4">
          <SmartProductSearch />
          <AnalyticsWidget />
        </main>
        
        <SmartCartWidget />
      </div>
    </CannabisDeliveryProvider>
  );
};

// Example: Order tracking page
const OrderTrackingPage = ({ orderId }) => {
  return (
    <div className="container mx-auto p-4">
      <LiveOrderTracker orderId={orderId} />
    </div>
  );
};

// Example: Admin dashboard
const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <AnalyticsWidget />
      <LiveDriverDashboard />
    </div>
  );
};
*/