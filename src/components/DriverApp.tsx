import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  User, 
  Settings, 
  Bell, 
  Battery,
  Wifi,
  Signal,
  Car,
  Package,
  Star,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Camera,
  Upload,
  X,
  Plus,
  Minus,
  Home,
  Target,
  Route,
  Truck,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Calendar,
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  Power,
  PowerOff,
  Timer,
  TrendingUp,
  Award,
  Users
} from 'lucide-react';

// TypeScript interfaces
interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: string[];
  total: number;
  distance: number;
  estimatedTime: number;
  paymentMethod: string;
  specialInstructions?: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  timestamp: string;
  lat: number;
  lng: number;
  customerImage?: string;
  tip?: number;
  zone: string;
  mileagePayment: number;
  basePay: number;
  totalDriverPay: number;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  totalDeliveries: number;
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
  };
  isOnline: boolean;
  currentLocation: {
    lat: number;
    lng: number;
  };
  earnings: {
    today: number;
    week: number;
    month: number;
    todayMileage: number;
    todayBase: number;
    todayTips: number;
    totalMilesDriven: number;
    pending: number;
  };
  schedule: {
    isScheduled: boolean;
    startTime?: string;
    endTime?: string;
  };
  payoutSettings: {
    method: 'instant' | 'daily' | 'three_day';
    primaryAccount: string;
    instantFee: number;
  };
}

const Toast = React.memo(({ showToast, toastMessage, type = 'success' }: { 
  showToast: boolean; 
  toastMessage: string; 
  type?: 'success' | 'error' | 'warning' | 'info';
}) => {
  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
    info: 'bg-blue-600'
  }[type];

  const icon = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertTriangle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Bell className="w-5 h-5" />
  }[type];

  return showToast ? (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300">
      <div className={`${bgColor} text-white px-6 py-4 rounded-2xl shadow-xl border border-white/20 flex items-center space-x-3`}>
        {icon}
        <span className="font-semibold">{toastMessage}</span>
      </div>
    </div>
  ) : null;
});

const OrderCard = React.memo(({ order, onAccept, onDecline, onViewDetails, isActive = false }: {
  order: Order;
  onAccept: (order: Order) => void;
  onDecline: (order: Order) => void;
  onViewDetails: (order: Order) => void;
  isActive?: boolean;
}) => {
  const priorityColors = {
    normal: 'border-gray-200 bg-white',
    high: 'border-amber-300 bg-amber-50',
    urgent: 'border-red-300 bg-red-50'
  };

  const priorityText = {
    normal: '',
    high: '⚡ High Priority',
    urgent: '🚨 URGENT'
  };

  return (
    <div className={`rounded-3xl p-6 shadow-lg border-2 transition-all duration-300 ${
      isActive ? 'border-blue-400 bg-blue-50 shadow-xl' : priorityColors[order.priority]
    } hover:shadow-xl`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{order.customerName[0]}</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{order.customerName}</h3>
              <p className="text-gray-600 text-sm">{order.id}</p>
            </div>
          </div>
          
          {order.priority !== 'normal' && (
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
              order.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
            }`}>
              {priorityText[order.priority]}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-black text-green-600">${order.totalDriverPay.toFixed(2)}</div>
          <div className="text-xs text-gray-600 space-y-0.5">
            <div>Base: ${order.basePay.toFixed(2)}</div>
            <div>Mileage: ${order.mileagePayment.toFixed(2)} ({order.distance}mi)</div>
            {order.tip && <div>Tip: ${order.tip.toFixed(2)}</div>}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900">{order.address}</p>
            <p className="text-sm text-gray-600">{order.zone} • {order.distance}mi • ~{order.estimatedTime}min</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-700">{order.items.length} items: {order.items.slice(0, 2).join(', ')}{order.items.length > 2 ? '...' : ''}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <CreditCard className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <p className="text-sm text-gray-700">{order.paymentMethod}</p>
        </div>
      </div>

      {order.specialInstructions && (
        <div className="bg-blue-50 rounded-xl p-3 mb-4">
          <p className="text-sm text-blue-800 font-medium">📝 {order.specialInstructions}</p>
        </div>
      )}

      {order.status === 'assigned' ? (
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => onDecline(order)}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => onAccept(order)}
            className="flex-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-2xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Accept</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onViewDetails(order)}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Eye className="w-5 h-5" />
          <span>View Details</span>
        </button>
      )}
    </div>
  );
});

const FadedSkiesDriverApp = () => {
  const [currentView, setCurrentView] = useState<string>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    licenseNumber: ''
  });

  const [driver, setDriver] = useState<Driver>({
    id: 'driver_001',
    name: 'Marcus Chen',
    phone: '(512) 555-0123',
    email: 'marcus@example.com',
    rating: 4.8,
    totalDeliveries: 1247,
    vehicle: {
      make: 'Toyota',
      model: 'Prius',
      year: 2022,
      color: 'Blue',
      licensePlate: 'ABC789'
    },
    isOnline: false,
    currentLocation: {
      lat: 30.2672,
      lng: -97.7431
    },
    earnings: {
      today: 156.50,
      week: 892.30,
      month: 3420.75,
      todayMileage: 64.50,
      todayBase: 72.00,
      todayTips: 20.00,
      totalMilesDriven: 129,
      pending: 156.50
    },
    schedule: {
      isScheduled: false
    },
    payoutSettings: {
      method: 'three_day',
      primaryAccount: 'Chase Bank ••••4567',
      instantFee: 0.50
    }
  });

  const [availableOrders, setAvailableOrders] = useState<Order[]>([
    {
      id: '#FS2025003',
      customerName: 'Sarah Johnson',
      customerPhone: '(512) 555-0456',
      address: '789 Oak Street, Austin, TX 78701',
      items: ['Purple Haze Cart', 'Indica Gummies'],
      total: 89.50,
      distance: 2.3,
      estimatedTime: 8,
      paymentMethod: 'Apple Pay',
      priority: 'normal',
      status: 'assigned',
      timestamp: new Date().toISOString(),
      lat: 30.2849,
      lng: -97.7341,
      zone: 'Downtown',
      tip: 15.00,
      basePay: 6.00,
      mileagePayment: 1.15,
      totalDriverPay: 22.15
    }
  ]);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);

  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const showToastMessage = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const toggleOnlineStatus = useCallback(() => {
    setDriver(prev => ({
      ...prev,
      isOnline: !prev.isOnline
    }));
    
    showToastMessage(
      driver.isOnline ? 'You are now offline' : 'You are now online and ready for deliveries!',
      driver.isOnline ? 'warning' : 'success'
    );
  }, [driver.isOnline, showToastMessage]);

  const acceptOrder = useCallback((order: Order) => {
    setActiveOrder({ ...order, status: 'accepted' });
    setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
    showToastMessage(`Order ${order.id} accepted!`, 'success');
    setTimeout(() => setCurrentView('active-delivery'), 500);
  }, [showToastMessage]);

  const declineOrder = useCallback((order: Order) => {
    setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
    showToastMessage(`Order ${order.id} declined`, 'info');
  }, [showToastMessage]);

  const updateOrderStatus = useCallback((status: Order['status']) => {
    if (!activeOrder) return;
    
    const updatedOrder = { ...activeOrder, status };
    setActiveOrder(updatedOrder);
    
    const statusMessages = {
      picked_up: 'Order picked up! En route to customer.',
      in_transit: 'Delivery in progress',
      delivered: 'Order delivered successfully!',
      cancelled: 'Order was cancelled'
    };
    
    if (status === 'delivered') {
      setCompletedOrders(prev => [updatedOrder, ...prev]);
      setActiveOrder(null);
      
      const driverEarnings = updatedOrder.totalDriverPay;
      const mileageEarnings = updatedOrder.mileagePayment;
      const baseEarnings = updatedOrder.basePay;
      const tipEarnings = updatedOrder.tip || 0;
      
      setDriver(prev => ({
        ...prev,
        earnings: {
          ...prev.earnings,
          today: prev.earnings.today + driverEarnings,
          todayMileage: prev.earnings.todayMileage + mileageEarnings,
          todayBase: prev.earnings.todayBase + baseEarnings,
          todayTips: prev.earnings.todayTips + tipEarnings,
          totalMilesDriven: prev.earnings.totalMilesDriven + updatedOrder.distance,
          pending: prev.earnings.pending + driverEarnings
        }
      }));
      setCurrentView('home');
    }
    
    showToastMessage(statusMessages[status] || 'Status updated', 'success');
  }, [activeOrder, showToastMessage]);

  const handleAuthSubmit = useCallback(() => {
    if (authMode === 'login') {
      if (authForm.email && authForm.password) {
        setIsAuthenticated(true);
        setCurrentView('home');
        showToastMessage('Welcome back!', 'success');
      } else {
        showToastMessage('Please enter email and password', 'error');
      }
    } else if (authMode === 'signup') {
      if (authForm.name && authForm.email && authForm.password && authForm.licenseNumber) {
        setIsAuthenticated(true);
        setCurrentView('home');
        showToastMessage('Account created successfully!', 'success');
      } else {
        showToastMessage('Please fill in all required fields', 'error');
      }
    }
  }, [authMode, authForm, showToastMessage]);

  const quickLogin = useCallback(() => {
    setAuthForm({
      email: 'marcus@driver.com',
      password: 'demo123',
      confirmPassword: '',
      name: 'Marcus Chen',
      phone: '',
      licenseNumber: ''
    });
    setIsAuthenticated(true);
    setCurrentView('home');
    showToastMessage('Demo login successful!', 'success');
  }, [showToastMessage]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentView('auth');
    setDriver(prev => ({ ...prev, isOnline: false }));
    setActiveOrder(null);
    showToastMessage('Logged out successfully', 'info');
  }, [showToastMessage]);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <Toast showToast={showToast} toastMessage={toastMessage} type={toastType} />
      
      {!isAuthenticated ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Truck className="text-white w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {authMode === 'login' ? 'Driver Portal' : 
                 authMode === 'signup' ? 'Join Our Fleet' : 
                 'Reset Password'}
              </h1>
              <p className="text-gray-600 font-medium">
                {authMode === 'login' ? 'Sign in to start driving' : 
                 authMode === 'signup' ? 'Become a Faded Skies driver' : 
                 'Enter your email to reset password'}
              </p>
            </div>

            <div className="space-y-5">
              {authMode === 'signup' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
                      placeholder="(555) 123-4567"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Driver's License Number</label>
                    <input
                      type="text"
                      value={authForm.licenseNumber}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
                      placeholder="License number"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>

              {authMode !== 'forgot' && (
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={authForm.password}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
                      placeholder="Enter your password"
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleAuthSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {authMode === 'login' ? 'Sign In' : 
                 authMode === 'signup' ? 'Apply to Drive' : 
                 'Send Reset Link'}
              </button>
            </div>

            {authMode === 'login' && (
              <div className="mt-6 space-y-3">
                <div className="text-xs text-gray-500 text-center bg-gray-50 p-4 rounded-xl">
                  <strong>Demo Mode:</strong> Test the driver app functionality
                </div>
                <button
                  type="button"
                  onClick={quickLogin}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all"
                >
                  🚚 Quick Demo Login
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Status Bar */}
          <div className="bg-black text-white px-4 py-1 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">9:41 AM</span>
            </div>
            <div className="flex items-center space-x-1">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-4 h-3" />
            </div>
          </div>

          {/* Header */}
          <div className={`${driver.isOnline ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white px-6 py-4 shadow-xl transition-all duration-500`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Truck className="text-white w-6 h-6" />
                </div>
                <div>
                  <div className="text-xl font-black tracking-tight">Faded Skies</div>
                  <div className="text-xs text-green-100 font-semibold">Driver Portal</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {driver.isOnline && (
                  <div className="flex items-center space-x-1 text-xs bg-green-700/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="font-semibold">ONLINE</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={toggleOnlineStatus}
                  className={`p-3 rounded-xl transition-all shadow-lg ${
                    driver.isOnline 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {driver.isOnline ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {currentView === 'home' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-black text-green-600">${driver.earnings.today.toFixed(2)}</div>
                      <div className="text-xs text-gray-600 font-semibold">Today</div>
                      <div className="text-xs text-gray-500 mt-1">{driver.earnings.totalMilesDriven} miles</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <div className="text-2xl font-black text-gray-900">{driver.rating}</div>
                      </div>
                      <div className="text-xs text-gray-600 font-semibold">Rating</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="text-center">
                      <div className="text-2xl font-black text-blue-600">{driver.totalDeliveries}</div>
                      <div className="text-xs text-gray-600 font-semibold">Deliveries</div>
                    </div>
                  </div>
                </div>

                {/* Active Order Status */}
                {activeOrder && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 mb-6 border border-blue-200 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-xl text-blue-900">Active Delivery</h3>
                      <button
                        type="button"
                        onClick={() => setCurrentView('active-delivery')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{activeOrder.customerName[0]}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-blue-900">{activeOrder.customerName}</h4>
                        <p className="text-blue-700 text-sm">{activeOrder.address}</p>
                        <p className="text-blue-600 text-xs font-semibold">{activeOrder.status.replace('_', ' ').toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-blue-900">${activeOrder.totalDriverPay.toFixed(2)}</div>
                        <div className="text-xs text-blue-600">Driver Pay</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Available Orders */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl text-gray-900">
                      Available Orders ({availableOrders.length})
                    </h3>
                    <button type="button" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>

                  {!driver.isOnline ? (
                    <div className="text-center py-16">
                      <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <PowerOff className="w-16 h-16 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">You're Offline</h3>
                      <p className="text-gray-600 mb-8 text-lg">Go online to start receiving delivery requests</p>
                      <button
                        type="button"
                        onClick={toggleOnlineStatus}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                      >
                        🚚 Go Online
                      </button>
                    </div>
                  ) : availableOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-12 h-12 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Waiting for Orders...</h3>
                      <p className="text-gray-600">New deliveries will appear here automatically</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableOrders.map(order => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onAccept={acceptOrder}
                          onDecline={declineOrder}
                          onViewDetails={(order) => alert(`Order details: ${order.id}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentView === 'active-delivery' && activeOrder && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-b-3xl shadow-xl">
                <h1 className="text-3xl font-bold">Active Delivery</h1>
                <p className="text-blue-100 text-lg">{activeOrder.id} • ${activeOrder.totalDriverPay.toFixed(2)} earnings</p>
              </div>

              <div className="p-6">
                {/* Order Status */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl text-gray-900">Delivery Progress</h3>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      activeOrder.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      activeOrder.status === 'picked_up' ? 'bg-amber-100 text-amber-800' :
                      activeOrder.status === 'in_transit' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activeOrder.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {[
                      { status: 'accepted', label: 'Order Accepted', icon: '✅' },
                      { status: 'picked_up', label: 'Order Picked Up', icon: '📦' },
                      { status: 'in_transit', label: 'En Route to Customer', icon: '🚗' },
                      { status: 'delivered', label: 'Delivered', icon: '🏠' }
                    ].map((step, index) => {
                      const isCompleted = ['accepted', 'picked_up', 'in_transit', 'delivered'].indexOf(activeOrder.status) >= index;
                      const isCurrent = ['accepted', 'picked_up', 'in_transit', 'delivered'][index] === activeOrder.status;
                      
                      return (
                        <div key={step.status} className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                            isCompleted 
                              ? 'bg-green-500 text-white' 
                              : isCurrent 
                                ? 'bg-blue-500 text-white animate-pulse' 
                                : 'bg-gray-200 text-gray-500'
                          }`}>
                            {step.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-bold ${
                              isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {step.label}
                            </h4>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {activeOrder.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus('picked_up')}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-2xl font-bold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg col-span-2"
                      >
                        📦 Mark as Picked Up
                      </button>
                    )}
                    
                    {activeOrder.status === 'picked_up' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus('in_transit')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg col-span-2"
                      >
                        🚗 Start Delivery
                      </button>
                    )}
                    
                    {activeOrder.status === 'in_transit' && (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus('delivered')}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-2xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg col-span-2"
                      >
                        ✅ Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Customer Information</h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{activeOrder.customerName[0]}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900">{activeOrder.customerName}</h4>
                      <p className="text-gray-600">{activeOrder.customerPhone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">{activeOrder.address}</p>
                        <p className="text-sm text-gray-600">{activeOrder.distance}mi • ~{activeOrder.estimatedTime}min</p>
                      </div>
                    </div>
                    
                    {activeOrder.specialInstructions && (
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-sm text-blue-800 font-medium">📝 {activeOrder.specialInstructions}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => window.open(`tel:${activeOrder.customerPhone}`)}
                      className="bg-green-600 text-white py-3 rounded-2xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Phone className="w-5 h-5" />
                      <span>Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert('Message sent to customer')}
                      className="bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-4 flex justify-around shadow-xl">
            {[
              { id: 'home', icon: Home, label: 'Home' },
              { id: 'active-delivery', icon: Route, label: 'Delivery', disabled: !activeOrder },
              { id: 'earnings', icon: DollarSign, label: 'Earnings' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => !item.disabled && setCurrentView(item.id)}
                disabled={item.disabled}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  currentView === item.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : item.disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-semibold">{item.label}</span>
                {item.id === 'active-delivery' && activeOrder && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FadedSkiesDriverApp;
