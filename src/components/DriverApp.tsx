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

// Import WebSocket service for real-time driver updates
import { wsService } from '../services/api-integration-service';

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

  // Modal states
  const [modals, setModals] = useState({
    editProfile: false,
    editVehicle: false,
    withdrawEarnings: false,
    manageSchedule: false,
    payoutSettings: false,
    changeBankAccount: false,
    settings: false
  });

  // Modal management functions
  const openModal = (modalName: string) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: string) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  const closeAllModals = () => {
    setModals({
      editProfile: false,
      editVehicle: false,
      withdrawEarnings: false,
      manageSchedule: false,
      payoutSettings: false,
      changeBankAccount: false,
      settings: false
    });
  };

  // Handle keyboard events for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const hasOpenModal = Object.values(modals).some(modal => modal);
        if (hasOpenModal) {
          closeAllModals();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modals]);

  // WebSocket connection for real-time driver updates
  useEffect(() => {
    if (isAuthenticated && driver.isOnline) {
      try {
        // Connect WebSocket for driver
        wsService.connect(`driver-${driver.name}`);

        // Send driver online status
        wsService.send({
          type: 'driver:online',
          data: {
            driverId: driver.id,
            location: driver.currentLocation,
            isAvailable: driver.isAvailable
          }
        });

        console.log('✅ Driver WebSocket connected for:', driver.name);

        return () => {
          try {
            // Send driver offline status before disconnecting
            wsService.send({
              type: 'driver:offline',
              data: {
                driverId: driver.id
              }
            });

            wsService.disconnect();
            console.log('🔌 Driver WebSocket disconnected');
          } catch (error) {
            console.warn('WebSocket disconnect error:', error);
          }
        };

      } catch (error) {
        console.error('Driver WebSocket connection failed:', error);
      }
    }
  }, [isAuthenticated, driver.isOnline, driver.id, driver.name, driver.currentLocation, driver.isAvailable]);

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
    const acceptedOrder = { ...order, status: 'accepted', acceptedAt: new Date() };
    setActiveOrder(acceptedOrder);
    setAvailableOrders(prev => prev.filter(o => o.id !== order.id));

    // Send real-time notification to admin and customer
    try {
      wsService.send({
        type: 'driver:accept_order',
        data: {
          orderId: order.id,
          driverId: driver.id,
          driverName: driver.name,
          driverPhone: driver.phone,
          vehicle: `${driver.vehicle?.color} ${driver.vehicle?.make} ${driver.vehicle?.model}`,
          estimatedArrival: '15-20 minutes',
          timestamp: new Date()
        }
      });

      console.log('📡 Order acceptance notification sent:', order.id);
    } catch (error) {
      console.error('Failed to send order acceptance notification:', error);
    }

    showToastMessage(`Order ${order.id} accepted!`, 'success');
    setTimeout(() => setCurrentView('active-delivery'), 500);
  }, [driver.id, driver.name, driver.phone, driver.vehicle, showToastMessage]);

  const declineOrder = useCallback((order: Order) => {
    setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
    showToastMessage(`Order ${order.id} declined`, 'info');
  }, [showToastMessage]);

  const updateOrderStatus = useCallback((status: Order['status']) => {
    if (!activeOrder) return;

    const updatedOrder = { ...activeOrder, status, lastUpdate: new Date() };
    setActiveOrder(updatedOrder);

    const statusMessages = {
      picked_up: 'Order picked up! En route to customer.',
      in_transit: 'Delivery in progress',
      delivered: 'Order delivered successfully!',
      cancelled: 'Order was cancelled'
    };

    // Send real-time status update notification
    try {
      // wsService.send({
      //   type: 'driver:update_order_status',
      //   data: {
      //     orderId: activeOrder.id,
      //     driverId: driver.id,
      //     driverName: driver.name,
      //     status: status,
      //     timestamp: new Date(),
      //     location: driver.currentLocation,
      //     message: statusMessages[status] || `Order status updated to ${status}`,
      //     notes: status === 'delivered' ? 'Package delivered successfully' : undefined
      //   }
      // });

      console.log('📡 Order status update notification sent (disabled):', status);
    } catch (error) {
      console.error('Failed to send status update notification:', error);
    }

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
  }, [activeOrder, driver.id, driver.name, driver.currentLocation, showToastMessage]);

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

  // Base Modal Component
  const Modal = ({ isOpen, onClose, title, children, size = 'md' }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }) => {
    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

          <div className={`inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full sm:p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Edit Profile Modal
  const EditProfileModal = () => {
    const [profileData, setProfileData] = useState({
      name: driver.name,
      phone: driver.phone,
      email: driver.email
    });

    const handleSave = () => {
      setDriver(prev => ({
        ...prev,
        name: profileData.name,
        phone: profileData.phone,
        email: profileData.email
      }));
      closeModal('editProfile');
      showToastMessage('Profile updated successfully!', 'success');
    };

    return (
      <Modal
        isOpen={modals.editProfile}
        onClose={() => closeModal('editProfile')}
        title="Edit Profile Information"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your.email@example.com"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => closeModal('editProfile')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Edit Vehicle Modal
  const EditVehicleModal = () => {
    const [vehicleData, setVehicleData] = useState({
      make: driver.vehicle.make,
      model: driver.vehicle.model,
      year: driver.vehicle.year,
      color: driver.vehicle.color,
      licensePlate: driver.vehicle.licensePlate
    });

    const handleSave = () => {
      setDriver(prev => ({
        ...prev,
        vehicle: {
          ...vehicleData
        }
      }));
      closeModal('editVehicle');
      showToastMessage('Vehicle information updated!', 'success');
    };

    return (
      <Modal
        isOpen={modals.editVehicle}
        onClose={() => closeModal('editVehicle')}
        title="Update Vehicle Information"
        size="md"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Make</label>
              <input
                type="text"
                value={vehicleData.make}
                onChange={(e) => setVehicleData({...vehicleData, make: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Toyota"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
              <input
                type="text"
                value={vehicleData.model}
                onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Prius"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
              <input
                type="number"
                value={vehicleData.year}
                onChange={(e) => setVehicleData({...vehicleData, year: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2022"
                min="1990"
                max="2025"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
              <input
                type="text"
                value={vehicleData.color}
                onChange={(e) => setVehicleData({...vehicleData, color: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">License Plate</label>
            <input
              type="text"
              value={vehicleData.licensePlate}
              onChange={(e) => setVehicleData({...vehicleData, licensePlate: e.target.value.toUpperCase()})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ABC123"
              maxLength={8}
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => closeModal('editVehicle')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Withdraw Earnings Modal
  const WithdrawEarningsModal = () => {
    const [withdrawData, setWithdrawData] = useState({
      amount: driver.earnings.pending.toString(),
      method: driver.payoutSettings.method,
      bankAccount: driver.payoutSettings.primaryAccount
    });

    const calculateFee = () => {
      const amount = parseFloat(withdrawData.amount) || 0;
      if (withdrawData.method === 'instant') {
        return Math.max(driver.payoutSettings.instantFee, amount * 0.01);
      }
      return 0;
    };

    const handleWithdraw = () => {
      const amount = parseFloat(withdrawData.amount) || 0;
      const fee = calculateFee();
      const netAmount = amount - fee;

      setDriver(prev => ({
        ...prev,
        earnings: {
          ...prev.earnings,
          pending: prev.earnings.pending - amount
        },
        payoutSettings: {
          ...prev.payoutSettings,
          method: withdrawData.method as 'instant' | 'daily' | 'three_day'
        }
      }));

      closeModal('withdrawEarnings');

      const timeframe = withdrawData.method === 'instant' ? 'instantly' :
                       withdrawData.method === 'daily' ? 'within 1 business day' :
                       'within 3 business days';

      showToastMessage(`$${netAmount.toFixed(2)} withdrawal initiated! Funds will arrive ${timeframe}.`, 'success');
    };

    return (
      <Modal
        isOpen={modals.withdrawEarnings}
        onClose={() => closeModal('withdrawEarnings')}
        title="Withdraw Earnings"
        size="md"
      >
        <div className="space-y-6">
          {/* Available Balance */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="text-lg font-bold text-green-800 mb-2">Available Balance</h4>
            <p className="text-3xl font-black text-green-600">${driver.earnings.pending.toFixed(2)}</p>
          </div>

          {/* Withdrawal Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Withdrawal Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={withdrawData.amount}
                onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                max={driver.earnings.pending}
              />
            </div>
          </div>

          {/* Payout Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payout Method</label>
            <div className="space-y-3">
              {[
                { value: 'instant', label: 'Instant Payout', desc: 'Get funds immediately', fee: `$${driver.payoutSettings.instantFee} fee` },
                { value: 'daily', label: 'Daily Payout', desc: 'Next business day', fee: 'No fee' },
                { value: 'three_day', label: 'Standard Payout', desc: 'Within 3 business days', fee: 'No fee' }
              ].map((method) => (
                <label key={method.value} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                  withdrawData.method === method.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="payoutMethod"
                    value={method.value}
                    checked={withdrawData.method === method.value}
                    onChange={(e) => setWithdrawData({...withdrawData, method: e.target.value})}
                    className="w-4 h-4 text-blue-600 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{method.label}</span>
                      <span className="text-sm text-gray-600">{method.fee}</span>
                    </div>
                    <p className="text-sm text-gray-600">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Bank Account */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Account</label>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">{withdrawData.bankAccount}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Withdrawal Amount:</span>
              <span className="font-semibold">${parseFloat(withdrawData.amount || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fee:</span>
              <span className="font-semibold">${calculateFee().toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="font-bold text-gray-900">Net Amount:</span>
              <span className="font-bold text-green-600">${(parseFloat(withdrawData.amount || '0') - calculateFee()).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => closeModal('withdrawEarnings')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={!withdrawData.amount || parseFloat(withdrawData.amount) <= 0 || parseFloat(withdrawData.amount) > driver.earnings.pending}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Withdraw Funds
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Schedule Management Modal
  const ScheduleModal = () => {
    const [scheduleData, setScheduleData] = useState({
      isScheduled: driver.schedule.isScheduled,
      startTime: driver.schedule.startTime || '09:00',
      endTime: driver.schedule.endTime || '17:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });

    const handleSave = () => {
      setDriver(prev => ({
        ...prev,
        schedule: {
          isScheduled: scheduleData.isScheduled,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime
        }
      }));
      closeModal('manageSchedule');
      showToastMessage('Schedule updated successfully!', 'success');
    };

    return (
      <Modal
        isOpen={modals.manageSchedule}
        onClose={() => closeModal('manageSchedule')}
        title="Manage Schedule"
        size="md"
      >
        <div className="space-y-6">
          {/* Schedule Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <h4 className="font-semibold text-blue-900">Enable Scheduled Hours</h4>
              <p className="text-sm text-blue-700">Set specific times when you're available</p>
            </div>
            <div
              onClick={() => setScheduleData({...scheduleData, isScheduled: !scheduleData.isScheduled})}
              className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                scheduleData.isScheduled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                scheduleData.isScheduled ? 'translate-x-7' : 'translate-x-1'
              }`}></div>
            </div>
          </div>

          {scheduleData.isScheduled && (
            <>
              {/* Time Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={scheduleData.startTime}
                    onChange={(e) => setScheduleData({...scheduleData, startTime: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={scheduleData.endTime}
                    onChange={(e) => setScheduleData({...scheduleData, endTime: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Days Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Available Days</label>
                <div className="grid grid-cols-1 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <label key={day} className="flex items-center p-3 border border-gray-200 rounded-xl hover:border-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleData.days.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setScheduleData({...scheduleData, days: [...scheduleData.days, day]});
                          } else {
                            setScheduleData({...scheduleData, days: scheduleData.days.filter(d => d !== day)});
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded mr-3"
                      />
                      <span className="font-medium text-gray-900">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => closeModal('manageSchedule')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Save Schedule
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Payout Settings Modal
  const PayoutSettingsModal = () => {
    const [payoutData, setPayoutData] = useState({
      defaultMethod: driver.payoutSettings.method,
      primaryAccount: driver.payoutSettings.primaryAccount,
      instantFeeEnabled: true,
      autoWithdraw: false,
      minimumThreshold: '50.00'
    });

    const handleSave = () => {
      setDriver(prev => ({
        ...prev,
        payoutSettings: {
          ...prev.payoutSettings,
          method: payoutData.defaultMethod as 'instant' | 'daily' | 'three_day'
        }
      }));
      closeModal('payoutSettings');
      showToastMessage('Payout settings updated successfully!', 'success');
    };

    return (
      <Modal
        isOpen={modals.payoutSettings}
        onClose={() => closeModal('payoutSettings')}
        title="Payout Settings"
        size="md"
      >
        <div className="space-y-6">
          {/* Current Bank Account */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-lg font-bold text-blue-800 mb-3">Primary Bank Account</h4>
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">{payoutData.primaryAccount}</p>
                <p className="text-sm text-blue-700">Primary payout destination</p>
              </div>
            </div>
            <button
              onClick={() => openModal('changeBankAccount')}
              className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Change Bank Account
            </button>
          </div>

          {/* Default Payout Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Default Payout Method</label>
            <div className="space-y-3">
              {[
                {
                  value: 'instant',
                  title: 'Instant Payout',
                  desc: 'Get funds immediately',
                  fee: `$${driver.payoutSettings.instantFee} fee per transaction`,
                  icon: '⚡'
                },
                {
                  value: 'daily',
                  title: 'Daily Payout',
                  desc: 'Next business day',
                  fee: 'No fees',
                  icon: '📅'
                },
                {
                  value: 'three_day',
                  title: 'Standard Payout',
                  desc: 'Within 3 business days',
                  fee: 'No fees',
                  icon: '🏦'
                }
              ].map((method) => (
                <label key={method.value} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                  payoutData.defaultMethod === method.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="defaultMethod"
                    value={method.value}
                    checked={payoutData.defaultMethod === method.value}
                    onChange={(e) => setPayoutData({...payoutData, defaultMethod: e.target.value})}
                    className="w-4 h-4 text-blue-600 mr-4"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{method.title}</span>
                        <span className="text-sm text-gray-600">{method.fee}</span>
                      </div>
                      <p className="text-sm text-gray-600">{method.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Auto-Withdraw Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Auto-Withdraw Settings</h4>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="font-medium text-gray-700">Enable Auto-Withdraw</label>
                <p className="text-sm text-gray-600">Automatically withdraw when threshold is reached</p>
              </div>
              <div
                onClick={() => setPayoutData({...payoutData, autoWithdraw: !payoutData.autoWithdraw})}
                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                  payoutData.autoWithdraw ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  payoutData.autoWithdraw ? 'translate-x-7' : 'translate-x-1'
                }`}></div>
              </div>
            </div>

            {payoutData.autoWithdraw && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Threshold</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={payoutData.minimumThreshold}
                    onChange={(e) => setPayoutData({...payoutData, minimumThreshold: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50.00"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Auto-withdraw when earnings reach ${payoutData.minimumThreshold}
                </p>
              </div>
            )}
          </div>

          {/* Tax Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="text-lg font-bold text-yellow-800 mb-2">Tax Information</h4>
            <p className="text-sm text-yellow-700 mb-3">
              We'll send you a 1099 form at the end of the year for tax purposes.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-yellow-800">Year-to-date earnings:</span>
                <span className="font-semibold text-yellow-900">$12,450.75</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-800">Tax documents:</span>
                <button className="text-yellow-600 hover:text-yellow-700 font-medium">
                  Download 1099
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => closeModal('payoutSettings')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Change Bank Account Modal
  const ChangeBankAccountModal = () => {
    const [bankData, setBankData] = useState({
      accountType: 'checking',
      bankName: '',
      routingNumber: '',
      accountNumber: '',
      confirmAccountNumber: '',
      accountHolderName: driver.name,
      bankAddress: '',
      swiftCode: ''
    });

    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    const validateStep1 = () => {
      const newErrors: {[key: string]: string} = {};

      if (!bankData.bankName.trim()) {
        newErrors.bankName = 'Bank name is required';
      }

      if (!bankData.routingNumber.trim()) {
        newErrors.routingNumber = 'Routing number is required';
      } else if (bankData.routingNumber.length !== 9) {
        newErrors.routingNumber = 'Routing number must be 9 digits';
      }

      if (!bankData.accountNumber.trim()) {
        newErrors.accountNumber = 'Account number is required';
      } else if (bankData.accountNumber.length < 4) {
        newErrors.accountNumber = 'Account number too short';
      }

      if (bankData.accountNumber !== bankData.confirmAccountNumber) {
        newErrors.confirmAccountNumber = 'Account numbers do not match';
      }

      if (!bankData.accountHolderName.trim()) {
        newErrors.accountHolderName = 'Account holder name is required';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
      if (validateStep1()) {
        setStep(2);
      }
    };

    const handleSave = () => {
      // Mask account number for display
      const maskedAccount = `••••${bankData.accountNumber.slice(-4)}`;
      const bankDisplay = `${bankData.bankName} ${maskedAccount}`;

      setDriver(prev => ({
        ...prev,
        payoutSettings: {
          ...prev.payoutSettings,
          primaryAccount: bankDisplay
        }
      }));

      closeModal('changeBankAccount');
      closeModal('payoutSettings'); // Also close the parent modal
      showToastMessage('Bank account updated successfully!', 'success');
    };

    const resetModal = () => {
      setStep(1);
      setErrors({});
      setBankData({
        accountType: 'checking',
        bankName: '',
        routingNumber: '',
        accountNumber: '',
        confirmAccountNumber: '',
        accountHolderName: driver.name,
        bankAddress: '',
        swiftCode: ''
      });
    };

    const handleClose = () => {
      resetModal();
      closeModal('changeBankAccount');
    };

    return (
      <Modal
        isOpen={modals.changeBankAccount}
        onClose={handleClose}
        title={`Change Bank Account - Step ${step} of 2`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mb-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Secure Bank Information</h4>
                    <p className="text-sm text-yellow-700">
                      Your banking information is encrypted and secure. We use bank-level security to protect your data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['checking', 'savings'].map((type) => (
                    <label key={type} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                      bankData.accountType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="accountType"
                        value={type}
                        checked={bankData.accountType === type}
                        onChange={(e) => setBankData({...bankData, accountType: e.target.value})}
                        className="w-4 h-4 text-blue-600 mr-3"
                      />
                      <span className="font-medium text-gray-900 capitalize">{type} Account</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={bankData.bankName}
                  onChange={(e) => setBankData({...bankData, bankName: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.bankName ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="e.g., Chase Bank, Wells Fargo, Bank of America"
                />
                {errors.bankName && <p className="text-red-600 text-sm mt-1">{errors.bankName}</p>}
              </div>

              {/* Routing Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Routing Number</label>
                <input
                  type="text"
                  value={bankData.routingNumber}
                  onChange={(e) => setBankData({...bankData, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9)})}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.routingNumber ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="9-digit routing number"
                  maxLength={9}
                />
                {errors.routingNumber && <p className="text-red-600 text-sm mt-1">{errors.routingNumber}</p>}
                <p className="text-xs text-gray-500 mt-1">Found on the bottom left of your checks</p>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  value={bankData.accountNumber}
                  onChange={(e) => setBankData({...bankData, accountNumber: e.target.value.replace(/\D/g, '')})}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.accountNumber ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Account number"
                />
                {errors.accountNumber && <p className="text-red-600 text-sm mt-1">{errors.accountNumber}</p>}
              </div>

              {/* Confirm Account Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Account Number</label>
                <input
                  type="text"
                  value={bankData.confirmAccountNumber}
                  onChange={(e) => setBankData({...bankData, confirmAccountNumber: e.target.value.replace(/\D/g, '')})}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmAccountNumber ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Re-enter account number"
                />
                {errors.confirmAccountNumber && <p className="text-red-600 text-sm mt-1">{errors.confirmAccountNumber}</p>}
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
                <input
                  type="text"
                  value={bankData.accountHolderName}
                  onChange={(e) => setBankData({...bankData, accountHolderName: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.accountHolderName ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Full name as it appears on the account"
                />
                {errors.accountHolderName && <p className="text-red-600 text-sm mt-1">{errors.accountHolderName}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800">Review Your Information</h4>
                    <p className="text-sm text-green-700">
                      Please verify all details are correct before saving. This account will be used for all future payouts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Review Information */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h4 className="font-semibold text-gray-900 mb-4">Account Summary</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Account Type:</span>
                    <p className="font-semibold capitalize">{bankData.accountType} Account</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Bank Name:</span>
                    <p className="font-semibold">{bankData.bankName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Routing Number:</span>
                    <p className="font-semibold">{bankData.routingNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Account Number:</span>
                    <p className="font-semibold">••••••{bankData.accountNumber.slice(-4)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">Account Holder:</span>
                    <p className="font-semibold">{bankData.accountHolderName}</p>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Important Notice</h4>
                    <p className="text-sm text-blue-700">
                      By adding this bank account, you authorize Faded Skies to deposit your earnings to this account.
                      You can change your bank account information at any time in your payout settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <div className="flex space-x-3">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}

              {step === 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Save Bank Account
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    );
  };

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

          {currentView === 'earnings' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-xl">
                <h1 className="text-3xl font-bold mb-2">Earnings</h1>
                <p className="text-green-100 text-lg">Track your income and manage payouts</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Current Balance */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-100">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Available Balance</h3>
                    <div className="text-4xl font-black text-green-600">${driver.earnings.pending.toFixed(2)}</div>
                    <p className="text-green-700 text-sm mt-2">Ready for withdrawal</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-gray-900">${driver.earnings.today.toFixed(2)}</div>
                      <div className="text-xs text-gray-600 font-semibold">Today</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-gray-900">${driver.earnings.week.toFixed(2)}</div>
                      <div className="text-xs text-gray-600 font-semibold">This Week</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-gray-900">${driver.earnings.month.toFixed(2)}</div>
                      <div className="text-xs text-gray-600 font-semibold">This Month</div>
                    </div>
                  </div>

                  {driver.earnings.pending > 0 && (
                    <button
                      type="button"
                      onClick={() => openModal('withdrawEarnings')}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      💰 Withdraw ${driver.earnings.pending.toFixed(2)}
                    </button>
                  )}
                </div>

                {/* Today's Breakdown */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Today's Breakdown</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Base Pay</div>
                          <div className="text-sm text-gray-600">Delivery fees</div>
                        </div>
                      </div>
                      <div className="font-bold text-lg text-gray-900">${driver.earnings.todayBase.toFixed(2)}</div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Car className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Mileage</div>
                          <div className="text-sm text-gray-600">{driver.earnings.totalMilesDriven} miles driven</div>
                        </div>
                      </div>
                      <div className="font-bold text-lg text-gray-900">${driver.earnings.todayMileage.toFixed(2)}</div>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Star className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Tips</div>
                          <div className="text-sm text-gray-600">Customer tips</div>
                        </div>
                      </div>
                      <div className="font-bold text-lg text-gray-900">${driver.earnings.todayTips.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xl text-gray-900">Total Today</span>
                      <span className="font-black text-2xl text-green-600">${driver.earnings.today.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payout Settings */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Payout Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Payment Method</span>
                      <span className="font-semibold text-gray-900">{driver.payoutSettings.primaryAccount}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Payout Schedule</span>
                      <span className="font-semibold text-gray-900 capitalize">
                        {driver.payoutSettings.method === 'three_day' ? '3-Day Transfer' :
                         driver.payoutSettings.method === 'daily' ? 'Daily Transfer' :
                         'Instant Transfer'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="font-medium text-gray-700">Instant Transfer Fee</span>
                      <span className="font-semibold text-gray-900">${driver.payoutSettings.instantFee.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal('payoutSettings')}
                    className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    ⚙️ Manage Payout Settings
                  </button>
                </div>

                {/* Withdrawal Options */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Withdrawal Options</h3>
                  <div className="space-y-3">
                    {[
                      {
                        title: 'Instant Transfer',
                        subtitle: `Available now • $${driver.payoutSettings.instantFee.toFixed(2)} fee`,
                        icon: '���',
                        color: 'from-yellow-400 to-orange-500'
                      },
                      {
                        title: 'Same Day Transfer',
                        subtitle: 'Available by end of day • No fee',
                        icon: '📅',
                        color: 'from-blue-400 to-indigo-500'
                      },
                      {
                        title: 'Standard Transfer',
                        subtitle: '2-3 business days • No fee',
                        icon: '🏦',
                        color: 'from-green-400 to-emerald-500'
                      }
                    ].map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => alert(`${option.title} selected`)}
                        className={`w-full bg-gradient-to-r ${option.color} text-white p-4 rounded-2xl text-left hover:scale-105 transition-all shadow-lg hover:shadow-xl`}
                      >
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{option.icon}</span>
                          <div className="flex-1">
                            <div className="font-bold text-lg">{option.title}</div>
                            <div className="text-sm opacity-90">{option.subtitle}</div>
                          </div>
                          <span className="text-white/70">→</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weekly Stats */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Weekly Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 text-center border border-blue-100">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-2xl font-black text-blue-600">{Math.round(driver.earnings.week / 7)}</div>
                      <div className="text-sm font-semibold text-blue-800">Avg Daily</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 text-center border border-purple-100">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="text-2xl font-black text-purple-600">{Math.round(driver.totalDeliveries / 7)}</div>
                      <div className="text-sm font-semibold text-purple-800">Deliveries/Day</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'profile' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-b-3xl shadow-xl">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{driver.name}</h1>
                    <p className="text-blue-100 text-lg font-medium">{driver.email}</p>
                    <div className="flex items-center space-x-1 text-sm bg-blue-700/80 backdrop-blur-sm px-3 py-1 rounded-full mt-2">
                      <Star className="w-4 h-4 text-yellow-300" />
                      <span className="font-semibold">{driver.rating} • {driver.totalDeliveries} deliveries</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Driver Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
                  <h3 className="font-bold text-xl text-blue-900 mb-4">Driver Performance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <div className="text-2xl font-black text-gray-900">{driver.rating}</div>
                      </div>
                      <div className="text-xs text-gray-600 font-semibold">Rating</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-blue-600">{driver.totalDeliveries}</div>
                      <div className="text-xs text-gray-600 font-semibold">Deliveries</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-green-600">99%</div>
                      <div className="text-xs text-gray-600 font-semibold">On Time</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-xl font-black text-purple-600">${(driver.earnings.month / driver.totalDeliveries * 30).toFixed(2)}</div>
                      <div className="text-xs text-gray-600 font-semibold">Avg per Delivery</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-xl font-black text-orange-600">{Math.round(driver.earnings.totalMilesDriven / driver.totalDeliveries * 100)}</div>
                      <div className="text-xs text-gray-600 font-semibold">Miles per Order</div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Full Name</span>
                      <span className="font-semibold text-gray-900">{driver.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Email</span>
                      <span className="font-semibold text-gray-900">{driver.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Phone</span>
                      <span className="font-semibold text-gray-900">{driver.phone}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="font-medium text-gray-700">Driver ID</span>
                      <span className="font-semibold text-gray-900">{driver.id}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal('editProfile')}
                    className="w-full mt-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Edit Information</span>
                  </button>
                </div>

                {/* Vehicle Information */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Vehicle Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Make & Model</span>
                      <span className="font-semibold text-gray-900">{driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Color</span>
                      <span className="font-semibold text-gray-900">{driver.vehicle.color}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="font-medium text-gray-700">License Plate</span>
                      <span className="font-semibold text-gray-900">{driver.vehicle.licensePlate}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal('editVehicle')}
                    className="w-full mt-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Car className="w-5 h-5" />
                    <span>Update Vehicle</span>
                  </button>
                </div>

                {/* App Settings */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">App Settings</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Push Notifications', icon: Bell, enabled: true },
                      { label: 'Location Services', icon: MapPin, enabled: true },
                      { label: 'Auto-Accept Orders', icon: Timer, enabled: false },
                      { label: 'Night Mode', icon: Settings, enabled: false }
                    ].map((setting, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <setting.icon className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-700">{setting.label}</span>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${
                          setting.enabled ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            setting.enabled ? 'translate-x-7' : 'translate-x-1'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Work Schedule */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Work Schedule</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Status</span>
                      <span className={`font-semibold ${driver.isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                        {driver.isOnline ? '🟢 Online' : '🔴 Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Schedule Mode</span>
                      <span className="font-semibold text-gray-900">
                        {driver.schedule.isScheduled ? 'Scheduled' : 'On-Demand'}
                      </span>
                    </div>
                    {driver.schedule.isScheduled && (
                      <>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Start Time</span>
                          <span className="font-semibold text-gray-900">{driver.schedule.startTime}</span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <span className="font-medium text-gray-700">End Time</span>
                          <span className="font-semibold text-gray-900">{driver.schedule.endTime}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal('manageSchedule')}
                    className="w-full mt-6 bg-blue-100 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Manage Schedule</span>
                  </button>
                </div>

                {/* Support & Help */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Support & Help</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Help Center', icon: HelpCircle, subtitle: 'FAQs and guides' },
                      { label: 'Contact Support', icon: MessageCircle, subtitle: '24/7 driver support' },
                      { label: 'Report Issue', icon: AlertTriangle, subtitle: 'Technical problems' },
                      { label: 'Driver Resources', icon: Award, subtitle: 'Tips and training' }
                    ].map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => alert(`${item.label} would be implemented here`)}
                        className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <item.icon className="w-6 h-6 text-gray-500" />
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{item.label}</div>
                          <div className="text-sm text-gray-600">{item.subtitle}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => alert('Account settings would be managed here')}
                      className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Shield className="w-5 h-5" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
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

      {/* Modal Components */}
      {isAuthenticated && (
        <>
          <EditProfileModal />
          <EditVehicleModal />
          <WithdrawEarningsModal />
          <ScheduleModal />
          <PayoutSettingsModal />
          <ChangeBankAccountModal />
        </>
      )}
    </div>
  );
};

export default FadedSkiesDriverApp;
