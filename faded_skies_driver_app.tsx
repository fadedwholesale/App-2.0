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
  mileagePayment: number; // $0.50 per mile
  basePay: number; // Base delivery fee
  totalDriverPay: number; // basePay + mileagePayment + tip
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
    todayMileage: number; // Today's mileage earnings
    todayBase: number; // Today's base pay
    todayTips: number; // Today's tips
    totalMilesDriven: number; // Total miles driven today
    pending: number; // Pending payout amount
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

interface PayoutMethod {
  id: string;
  type: 'bank' | 'debit' | 'paypal' | 'venmo';
  name: string;
  details: string;
  isPrimary: boolean;
  isVerified: boolean;
  icon: string;
}

interface PayoutHistory {
  id: string;
  amount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  date: string;
  expectedDate?: string;
  fee?: number;
}

interface Message {
  id: string;
  orderId: string;
  sender: 'driver' | 'customer' | 'system';
  message: string;
  timestamp: string;
  read: boolean;
}

// Toast component
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

// Order Card Component
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

  // Driver state
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
      todayMileage: 64.50, // 129 miles × $0.50
      todayBase: 72.00, // 12 deliveries × $6 base
      todayTips: 20.00, // Tips received today
      totalMilesDriven: 129,
      pending: 156.50 // Today's earnings pending payout
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

  // Orders state
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
      mileagePayment: 1.15, // 2.3 miles × $0.50
      totalDriverPay: 22.15 // $6 + $1.15 + $15
    },
    {
      id: '#FS2025004',
      customerName: 'Mike Rodriguez',
      customerPhone: '(512) 555-0789',
      address: '456 Pine Ave, Austin, TX 78704',
      items: ['OG Kush Flower', 'Pre-roll 3-Pack', 'CBD Tincture'],
      total: 124.75,
      distance: 4.1,
      estimatedTime: 12,
      paymentMethod: 'Credit Card',
      specialInstructions: 'Please call when you arrive. Apartment 2B, use side entrance.',
      priority: 'high',
      status: 'assigned',
      timestamp: new Date().toISOString(),
      lat: 30.2518,
      lng: -97.7595,
      zone: 'South Austin',
      basePay: 7.00, // Higher base for high priority
      mileagePayment: 2.05, // 4.1 miles × $0.50
      totalDriverPay: 9.05 // $7 + $2.05 + $0 (no tip yet)
    },
    {
      id: '#FS2025005',
      customerName: 'Lisa Chen',
      customerPhone: '(512) 555-0321',
      address: '123 Elm Dr, Austin, TX 78702',
      items: ['Sunset Sherbet Cart', 'Edible Brownies'],
      total: 67.25,
      distance: 1.8,
      estimatedTime: 6,
      paymentMethod: 'Cash',
      priority: 'urgent',
      status: 'assigned',
      timestamp: new Date().toISOString(),
      lat: 30.2811,
      lng: -97.7094,
      zone: 'East Austin',
      tip: 10.00,
      basePay: 8.00, // Higher base for urgent
      mileagePayment: 0.90, // 1.8 miles × $0.50
      totalDriverPay: 18.90 // $8 + $0.90 + $10
    }
  ]);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Payout state
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([
    {
      id: '1',
      type: 'bank',
      name: 'Chase Bank',
      details: '••••4567',
      isPrimary: true,
      isVerified: true,
      icon: '🏦'
    },
    {
      id: '2',
      type: 'debit',
      name: 'Visa Debit',
      details: '••••8901',
      isPrimary: false,
      isVerified: true,
      icon: '💳'
    },
    {
      id: '3',
      type: 'paypal',
      name: 'PayPal',
      details: 'marcus@example.com',
      isPrimary: false,
      isVerified: false,
      icon: '💙'
    }
  ]);

  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([
    {
      id: 'PO001',
      amount: 234.75,
      method: 'Chase Bank ••••4567',
      status: 'completed',
      date: '2025-07-05',
      fee: 0
    },
    {
      id: 'PO002',
      amount: 189.50,
      method: 'Chase Bank ••••4567',
      status: 'processing',
      date: '2025-07-06',
      expectedDate: '2025-07-09',
      fee: 0
    },
    {
      id: 'PO003',
      amount: 67.25,
      method: 'Visa Debit ••••8901',
      status: 'completed',
      date: '2025-07-07',
      fee: 0.50
    }
  ]);

  // UI state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);
  const [showNavigationModal, setShowNavigationModal] = useState<boolean>(false);
  const [showMessageModal, setShowMessageModal] = useState<boolean>(false);
  const [messageText, setMessageText] = useState<string>('');
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [showAddPayoutMethod, setShowAddPayoutMethod] = useState<boolean>(false);
  const [newPayoutForm, setNewPayoutForm] = useState({
    type: 'bank',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    email: ''
  });

  // Live location simulation
  const [liveLocation, setLiveLocation] = useState({
    lat: 30.2672,
    lng: -97.7431,
    heading: 45,
    speed: 0
  });

  const showToastMessage = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  // Toggle driver online status
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

  // Accept order
  const acceptOrder = useCallback((order: Order) => {
    setActiveOrder({ ...order, status: 'accepted' });
    setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
    showToastMessage(`Order ${order.id} accepted!`, 'success');
    
    // Auto-navigate to active delivery view
    setTimeout(() => setCurrentView('active-delivery'), 500);
  }, [showToastMessage]);

  // Decline order
  const declineOrder = useCallback((order: Order) => {
    setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
    showToastMessage(`Order ${order.id} declined`, 'info');
  }, [showToastMessage]);

  // Update order status
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
      
      // Update driver earnings with detailed breakdown
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

  // Send message to customer
  const sendMessage = useCallback(() => {
    if (!messageText.trim() || !activeOrder) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      orderId: activeOrder.id,
      sender: 'driver',
      message: messageText,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    setMessages(prev => [newMessage, ...prev]);
    setMessageText('');
    setShowMessageModal(false);
    showToastMessage('Message sent to customer', 'success');
  }, [messageText, activeOrder, showToastMessage]);

  // Payout method management
  const updatePayoutMethod = useCallback((method: 'instant' | 'daily' | 'three_day') => {
    setDriver(prev => ({
      ...prev,
      payoutSettings: {
        ...prev.payoutSettings,
        method: method
      }
    }));
    
    const methodNames = {
      instant: 'Instant payout',
      daily: 'Daily payout',
      three_day: '3-day payout'
    };
    
    showToastMessage(`${methodNames[method]} selected`, 'success');
  }, [showToastMessage]);

  const addPayoutMethod = useCallback(() => {
    if (newPayoutForm.type === 'bank' && (!newPayoutForm.bankName || !newPayoutForm.accountNumber || !newPayoutForm.routingNumber)) {
      showToastMessage('Please fill in all bank details', 'error');
      return;
    }
    
    if ((newPayoutForm.type === 'paypal' || newPayoutForm.type === 'venmo') && !newPayoutForm.email) {
      showToastMessage('Please enter your email address', 'error');
      return;
    }

    const newMethod: PayoutMethod = {
      id: Date.now().toString(),
      type: newPayoutForm.type as PayoutMethod['type'],
      name: newPayoutForm.type === 'bank' ? newPayoutForm.bankName : 
            newPayoutForm.type === 'paypal' ? 'PayPal' : 
            newPayoutForm.type === 'venmo' ? 'Venmo' : 'Debit Card',
      details: newPayoutForm.type === 'bank' ? `••••${newPayoutForm.accountNumber.slice(-4)}` :
               newPayoutForm.email || `••••${newPayoutForm.accountNumber?.slice(-4) || '0000'}`,
      isPrimary: payoutMethods.length === 0,
      isVerified: false,
      icon: newPayoutForm.type === 'bank' ? '🏦' : 
            newPayoutForm.type === 'paypal' ? '💙' : 
            newPayoutForm.type === 'venmo' ? '💚' : '💳'
    };

    setPayoutMethods(prev => [...prev, newMethod]);
    setNewPayoutForm({ type: 'bank', bankName: '', accountNumber: '', routingNumber: '', accountHolderName: '', email: '' });
    setShowAddPayoutMethod(false);
    showToastMessage('Payout method added successfully', 'success');
  }, [newPayoutForm, payoutMethods.length, showToastMessage]);

  const setPrimaryPayoutMethod = useCallback((id: string) => {
    setPayoutMethods(prev => prev.map(method => ({
      ...method,
      isPrimary: method.id === id
    })));
    
    const selectedMethod = payoutMethods.find(m => m.id === id);
    if (selectedMethod) {
      setDriver(prev => ({
        ...prev,
        payoutSettings: {
          ...prev.payoutSettings,
          primaryAccount: `${selectedMethod.name} ${selectedMethod.details}`
        }
      }));
    }
    
    showToastMessage('Primary payout method updated', 'success');
  }, [payoutMethods, showToastMessage]);

  const removePayoutMethod = useCallback((id: string) => {
    setPayoutMethods(prev => {
      const filtered = prev.filter(method => method.id !== id);
      if (filtered.length > 0 && !filtered.some(method => method.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
    showToastMessage('Payout method removed', 'success');
  }, [showToastMessage]);

  const requestInstantPayout = useCallback(() => {
    if (driver.earnings.pending <= 0) {
      showToastMessage('No pending earnings to cash out', 'warning');
      return;
    }

    const fee = driver.payoutSettings.instantFee;
    const amount = driver.earnings.pending - fee;
    
    const newPayout: PayoutHistory = {
      id: `PO${Date.now()}`,
      amount: amount,
      method: driver.payoutSettings.primaryAccount,
      status: 'processing',
      date: new Date().toISOString().split('T')[0],
      fee: fee
    };
    
    setPayoutHistory(prev => [newPayout, ...prev]);
    setDriver(prev => ({
      ...prev,
      earnings: {
        ...prev.earnings,
        pending: 0
      }
    }));
    
    showToastMessage(`${amount.toFixed(2)} payout initiated`, 'success');
  }, [driver.earnings.pending, driver.payoutSettings, showToastMessage]);

  // Auth handlers
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

  // Simulate live location updates during active delivery
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'in_transit') {
      const interval = setInterval(() => {
        setLiveLocation(prev => ({
          ...prev,
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001,
          heading: prev.heading + (Math.random() - 0.5) * 10,
          speed: Math.max(0, Math.min(45, prev.speed + (Math.random() - 0.5) * 5))
        }));
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [activeOrder]);

  // Auto-assign orders when online
  useEffect(() => {
    if (driver.isOnline && availableOrders.length < 3) {
      const timer = setTimeout(() => {
        const distance = Math.round((Math.random() * 8 + 1) * 10) / 10;
        const priority = ['normal', 'normal', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 5)] as Order['priority'];
        const basePay = priority === 'urgent' ? 8.00 : priority === 'high' ? 7.00 : 6.00;
        const mileagePayment = distance * 0.50;
        const tip = Math.random() > 0.6 ? Math.round((Math.random() * 20 + 5) * 100) / 100 : 0;

        const newOrder: Order = {
          id: `#FS2025${String(Date.now()).slice(-3)}`,
          customerName: ['Alex Smith', 'Emma Davis', 'John Wilson', 'Kate Brown'][Math.floor(Math.random() * 4)],
          customerPhone: '(512) 555-' + String(Math.floor(Math.random() * 9000) + 1000),
          address: ['456 Main St', '789 College Ave', '321 River Rd', '654 Park Blvd'][Math.floor(Math.random() * 4)] + ', Austin, TX',
          items: [
            ['Blue Dream Flower', 'Rolling Papers'],
            ['Sativa Cart', 'Gummies'],
            ['Indica Pre-rolls', 'CBD Oil'],
            ['Hybrid Edibles', 'Vape Battery']
          ][Math.floor(Math.random() * 4)],
          total: Math.round((Math.random() * 100 + 50) * 100) / 100,
          distance: distance,
          estimatedTime: Math.floor(Math.random() * 15 + 5),
          paymentMethod: ['Apple Pay', 'Credit Card', 'Cash', 'Google Pay'][Math.floor(Math.random() * 4)],
          priority: priority,
          status: 'assigned',
          timestamp: new Date().toISOString(),
          lat: 30.2672 + (Math.random() - 0.5) * 0.1,
          lng: -97.7431 + (Math.random() - 0.5) * 0.1,
          zone: ['Downtown', 'South Austin', 'East Austin', 'West Austin'][Math.floor(Math.random() * 4)],
          tip: tip,
          basePay: basePay,
          mileagePayment: mileagePayment,
          totalDriverPay: basePay + mileagePayment + tip
        };

        setAvailableOrders(prev => [...prev, newOrder]);
        
        if (currentView === 'home') {
          showToastMessage('New delivery available!', 'info');
        }
      }, Math.random() * 30000 + 10000); // Random between 10-40 seconds

      return () => clearTimeout(timer);
    }
  }, [driver.isOnline, availableOrders.length, currentView, showToastMessage]);

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

            <div className="mt-8 text-center">
              {authMode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                  >
                    Forgot your password?
                  </button>
                  <div className="mt-4">
                    <span className="text-gray-600 text-sm">Want to drive for us? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                    >
                      Apply now
                    </button>
                  </div>
                </>
              )}

              {authMode === 'signup' && (
                <div>
                  <span className="text-gray-600 text-sm">Already a driver? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                  >
                    Sign in
                  </button>
                </div>
              )}

              {authMode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                >
                  Back to sign in
                </button>
              )}
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
                              {/* Quick Stats */}
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
                          onViewDetails={(order) => setSelectedOrderModal(order)}
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
                      onClick={() => setShowMessageModal(true)}
                      className="bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Message</span>
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Navigation</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNavigationModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center space-x-2"
                    >
                      <Navigation className="w-6 h-6" />
                      <span>Navigate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(activeOrder.address)}`)}
                      className="bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <MapPin className="w-6 h-6" />
                      <span>Maps</span>
                    </button>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {activeOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="font-medium text-gray-900">{item}</span>
                        <span className="text-sm text-gray-600">1x</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Customer Total:</span>
                        <span className="font-semibold text-gray-900">${activeOrder.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Base Pay:</span>
                        <span className="font-semibold text-blue-600">${activeOrder.basePay.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Mileage ({activeOrder.distance}mi):</span>
                        <span className="font-semibold text-blue-600">${activeOrder.mileagePayment.toFixed(2)}</span>
                      </div>
                      {activeOrder.tip && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Customer Tip:</span>
                          <span className="font-semibold text-green-600">${activeOrder.tip.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="font-bold text-lg text-gray-900">Your Earnings:</span>
                      <span className="font-black text-2xl text-green-600">${activeOrder.totalDriverPay.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'earnings' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-xl">
                <h1 className="text-3xl font-bold">Earnings</h1>
                <p className="text-green-100 text-lg">Base pay + mileage + tips</p>
              </div>

              <div className="p-6">
                {/* Earnings Summary */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-200 shadow-lg">
                    <div className="text-center">
                      <div className="text-4xl font-black text-green-600 mb-2">${driver.earnings.today.toFixed(2)}</div>
                      <div className="text-green-700 font-semibold mb-4">Today's Earnings</div>
                      
                      {/* Detailed Breakdown */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-lg font-bold text-gray-900">${driver.earnings.todayBase.toFixed(2)}</div>
                          <div className="text-xs text-gray-600">Base Pay</div>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-lg font-bold text-blue-600">${driver.earnings.todayMileage.toFixed(2)}</div>
                          <div className="text-xs text-gray-600">Mileage</div>
                          <div className="text-xs text-blue-500">{driver.earnings.totalMilesDriven} mi</div>
                        </div>
                        <div className="bg-white/60 rounded-xl p-3">
                          <div className="text-lg font-bold text-purple-600">${driver.earnings.todayTips.toFixed(2)}</div>
                          <div className="text-xs text-gray-600">Tips</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xl font-bold text-gray-900">${driver.earnings.week.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">This Week</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-gray-900">${driver.earnings.month.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">This Month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Earnings & Cash Out */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-200 shadow-lg mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-blue-900">💰 Available to Cash Out</h3>
                      <p className="text-blue-700 text-sm">Ready for payout</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-blue-600">${driver.earnings.pending.toFixed(2)}</div>
                      <div className="text-sm text-blue-700">Pending</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => updatePayoutMethod('instant')}
                      className={`p-3 rounded-xl text-center border-2 transition-all ${
                        driver.payoutSettings.method === 'instant'
                          ? 'border-orange-300 bg-orange-100 text-orange-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-orange-200'
                      }`}
                    >
                      <div className="font-bold text-sm">Instant</div>
                      <div className="text-xs">$0.50 fee</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePayoutMethod('daily')}
                      className={`p-3 rounded-xl text-center border-2 transition-all ${
                        driver.payoutSettings.method === 'daily'
                          ? 'border-blue-300 bg-blue-100 text-blue-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200'
                      }`}
                    >
                      <div className="font-bold text-sm">Daily</div>
                      <div className="text-xs">Next day</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePayoutMethod('three_day')}
                      className={`p-3 rounded-xl text-center border-2 transition-all ${
                        driver.payoutSettings.method === 'three_day'
                          ? 'border-green-300 bg-green-100 text-green-800'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-green-200'
                      }`}
                    >
                      <div className="font-bold text-sm">3-Day</div>
                      <div className="text-xs">Free</div>
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={driver.payoutSettings.method === 'instant' ? requestInstantPayout : () => showToastMessage('Automatic payout scheduled', 'info')}
                    disabled={driver.earnings.pending <= 0}
                    className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${
                      driver.earnings.pending > 0
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {driver.payoutSettings.method === 'instant' ? '⚡ Cash Out Now' : '📅 Auto Payout Enabled'}
                  </button>
                </div>

                {/* Mileage Tracker */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">🚗 Mileage Tracker</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-2xl font-black text-blue-600">{driver.earnings.totalMilesDriven}</div>
                      <div className="text-sm text-blue-700 font-semibold">Miles Today</div>
                      <div className="text-xs text-gray-600">For tax records</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-2xl font-black text-green-600">${driver.earnings.todayMileage.toFixed(2)}</div>
                      <div className="text-sm text-green-700 font-semibold">Mileage Pay</div>
                      <div className="text-xs text-gray-600">Tax deductible</div>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 mb-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <div className="text-2xl font-black text-gray-900">{driver.rating}</div>
                      </div>
                      <div className="text-sm text-gray-600 font-semibold">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-blue-600 mb-2">{driver.totalDeliveries}</div>
                      <div className="text-sm text-gray-600 font-semibold">Total Deliveries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-purple-600 mb-2">98%</div>
                      <div className="text-sm text-gray-600 font-semibold">Acceptance Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-green-600 mb-2">12</div>
                      <div className="text-sm text-gray-600 font-semibold">Today's Deliveries</div>
                    </div>
                  </div>
                </div>

                {/* Recent Earnings */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Recent Deliveries</h3>
                  <div className="space-y-3">
                    {completedOrders.slice(0, 5).concat([
                      {
                        id: '#FS2025001',
                        customerName: 'Alex Johnson',
                        address: '123 Main St',
                        total: 67.50,
                        tip: 12.00,
                        timestamp: '2 hours ago'
                      },
                      {
                        id: '#FS2025000',
                        customerName: 'Maria Garcia', 
                        address: '456 Oak Ave',
                        total: 89.25,
                        tip: 8.50,
                        timestamp: '3 hours ago'
                      }
                    ] as any).map((order: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{order.customerName || order.id}</h4>
                          <p className="text-sm text-gray-600">{order.address || order.timestamp}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">${order.total}</div>
                          {order.tip && (
                            <div className="text-sm text-green-600">+${order.tip} tip</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'profile' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-b-3xl shadow-xl">
                <h1 className="text-3xl font-bold">Profile</h1>
                <p className="text-blue-100 text-lg">Manage your driver account</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Driver Info */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900">{driver.name}</h3>
                      <p className="text-gray-600">{driver.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                          ✅ Verified Driver
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                          Premium Partner
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-bold text-lg">{driver.rating}</span>
                      </div>
                      <span className="text-sm text-gray-600">Rating</span>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="font-bold text-lg text-blue-600">{driver.totalDeliveries}</div>
                      <span className="text-sm text-gray-600">Deliveries</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">🚗 Vehicle Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Make & Model:</span>
                      <span className="font-semibold">{driver.vehicle.year} {driver.vehicle.make} {driver.vehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color:</span>
                      <span className="font-semibold">{driver.vehicle.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">License Plate:</span>
                      <span className="font-semibold">{driver.vehicle.licensePlate}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setCurrentView('earnings')}
                    className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all text-left"
                  >
                    <div className="text-2xl mb-2">📊</div>
                    <h4 className="font-bold text-gray-900 mb-1">Analytics</h4>
                    <p className="text-sm text-gray-600">Performance insights</p>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowPayoutModal(true)}
                    className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all text-left"
                  >
                    <div className="text-2xl mb-2">💳</div>
                    <h4 className="font-bold text-gray-900 mb-1">Payouts</h4>
                    <p className="text-sm text-gray-600">Bank & payout settings</p>
                  </button>
                  <button type="button" className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all text-left">
                    <div className="text-2xl mb-2">🔔</div>
                    <h4 className="font-bold text-gray-900 mb-1">Notifications</h4>
                    <p className="text-sm text-gray-600">Alert preferences</p>
                  </button>
                  <button type="button" className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all text-left">
                    <div className="text-2xl mb-2">❓</div>
                    <h4 className="font-bold text-gray-900 mb-1">Help</h4>
                    <p className="text-sm text-gray-600">Support center</p>
                  </button>
                </div>

                {/* Account Actions */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('earnings')}
                    className="w-full bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 rounded-2xl p-5 text-left border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-colors font-bold shadow-sm flex items-center space-x-3"
                  >
                    <DollarSign className="w-6 h-6" />
                    <span>View Detailed Earnings</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-2xl p-5 text-left border border-red-200 hover:from-red-100 hover:to-red-200 transition-colors font-bold shadow-sm flex items-center space-x-3"
                  >
                    <LogOut className="w-6 h-6" />
                    <span>Sign Out</span>
                  </button>
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

      {/* Order Details Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  type="button"
                  onClick={() => setSelectedOrderModal(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-blue-100">{selectedOrderModal.id} • ${selectedOrderModal.total}</p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <OrderCard
                order={selectedOrderModal}
                onAccept={acceptOrder}
                onDecline={declineOrder}
                onViewDetails={() => {}}
                isActive={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payout Management Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">💰 Payout Settings</h2>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-green-100">Manage your earnings and payout methods</p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {!showAddPayoutMethod ? (
                <>
                  {/* Current Balance */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 border border-green-200">
                    <div className="text-center">
                      <div className="text-3xl font-black text-green-600 mb-1">${driver.earnings.pending.toFixed(2)}</div>
                      <div className="text-green-700 font-semibold mb-2">Available Balance</div>
                      <div className="text-sm text-gray-600">
                        Payout method: {driver.payoutSettings.method === 'instant' ? 'Instant ($0.50 fee)' : 
                                       driver.payoutSettings.method === 'daily' ? 'Daily (Free)' : 
                                       '3-Day (Free)'}
                      </div>
                    </div>
                  </div>

                  {/* Payout Methods */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Payout Methods</h3>
                    <div className="space-y-3">
                      {payoutMethods.map((method) => (
                        <div key={method.id} className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{method.icon}</span>
                            <div>
                              <h4 className="font-bold text-gray-900">{method.name}</h4>
                              <p className="text-sm text-gray-600">{method.details}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                {method.isPrimary && (
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">PRIMARY</span>
                                )}
                                {method.isVerified ? (
                                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">✓ VERIFIED</span>
                                ) : (
                                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">⏳ PENDING</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!method.isPrimary && method.isVerified && (
                              <button 
                                type="button" 
                                onClick={() => setPrimaryPayoutMethod(method.id)}
                                className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                              >
                                Set Primary
                              </button>
                            )}
                            <button 
                              type="button" 
                              onClick={() => removePayoutMethod(method.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowAddPayoutMethod(true)}
                      className="w-full mt-4 bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors"
                    >
                      ➕ Add Payout Method
                    </button>
                  </div>

                  {/* Payout History */}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Recent Payouts</h3>
                    <div className="space-y-3">
                      {payoutHistory.slice(0, 5).map((payout) => (
                        <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <h4 className="font-semibold text-gray-900">${payout.amount.toFixed(2)}</h4>
                            <p className="text-sm text-gray-600">{payout.method}</p>
                            <p className="text-xs text-gray-500">{payout.date}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                              payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payout.status.toUpperCase()}
                            </span>
                            {payout.fee && payout.fee > 0 && (
                              <p className="text-xs text-gray-500 mt-1">Fee: ${payout.fee.toFixed(2)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <h3 className="font-bold text-xl text-gray-900">Add Payout Method</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Method Type</label>
                      <select
                        value={newPayoutForm.type}
                        onChange={(e) => setNewPayoutForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="bank">Bank Account</option>
                        <option value="debit">Debit Card</option>
                        <option value="paypal">PayPal</option>
                        <option value="venmo">Venmo</option>
                      </select>
                    </div>

                    {newPayoutForm.type === 'bank' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                          <input
                            type="text"
                            value={newPayoutForm.bankName}
                            onChange={(e) => setNewPayoutForm(prev => ({ ...prev, bankName: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="Chase Bank"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                          <input
                            type="text"
                            value={newPayoutForm.accountNumber}
                            onChange={(e) => setNewPayoutForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="123456789"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Routing Number</label>
                          <input
                            type="text"
                            value={newPayoutForm.routingNumber}
                            onChange={(e) => setNewPayoutForm(prev => ({ ...prev, routingNumber: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="021000021"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
                          <input
                            type="text"
                            value={newPayoutForm.accountHolderName}
                            onChange={(e) => setNewPayoutForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                            placeholder="Marcus Chen"
                          />
                        </div>
                      </>
                    )}

                    {(newPayoutForm.type === 'paypal' || newPayoutForm.type === 'venmo') && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={newPayoutForm.email}
                          onChange={(e) => setNewPayoutForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="marcus@example.com"
                        />
                      </div>
                    )}

                    {newPayoutForm.type === 'debit' && (
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-blue-800 font-semibold mb-2">💳 Debit Card Setup</p>
                        <p className="text-blue-600 text-sm">You'll be redirected to securely add your card</p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPayoutMethod(false);
                        setNewPayoutForm({ type: 'bank', bankName: '', accountNumber: '', routingNumber: '', accountHolderName: '', email: '' });
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addPayoutMethod}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                    >
                      Add Method
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Modal */}
      {showNavigationModal && activeOrder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNavigationModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-xl font-bold">Navigation</h2>
                  <p className="text-blue-100 text-sm">To: {activeOrder.customerName}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100">ETA</div>
                <div className="font-bold">{activeOrder.estimatedTime} min</div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative bg-gradient-to-br from-green-100 via-blue-50 to-gray-100">
            {/* Simulated map view with route */}
            <div className="w-full h-full relative">
              {/* Route visualization */}
              <svg className="absolute inset-0 w-full h-full">
                <path 
                  d="M 100 400 Q 200 200, 300 300 T 400 100" 
                  stroke="#3b82f6" 
                  strokeWidth="6" 
                  fill="none"
                  strokeDasharray="20,10"
                  className="animate-pulse"
                />
              </svg>

              {/* Driver location */}
              <div className="absolute bottom-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                <div className="absolute inset-0 w-8 h-8 bg-blue-400 rounded-full animate-ping opacity-75"></div>
              </div>

              {/* Destination */}
              <div className="absolute top-1/4 right-1/4 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 bg-green-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Navigation instructions */}
              <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Turn right on Oak Street</h3>
                    <p className="text-gray-600">in 0.3 miles</p>
                  </div>
                </div>
              </div>

              {/* Speed and distance info */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg text-gray-900">{Math.round(liveLocation.speed)} mph</div>
                    <div className="text-sm text-gray-600">Speed</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-blue-600">{activeOrder.distance} mi</div>
                    <div className="text-sm text-gray-600">Distance</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-green-600">{activeOrder.estimatedTime} min</div>
                    <div className="text-sm text-gray-600">ETA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && activeOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Message Customer</h2>
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-blue-100">{activeOrder.customerName}</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "I'm on my way!",
                    "Running 5 mins late",
                    "I'm at your location",
                    "Please come outside"
                  ].map((quickMessage, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setMessageText(quickMessage);
                        sendMessage();
                      }}
                      className="bg-gray-100 hover:bg-gray-200 rounded-xl p-3 text-sm font-semibold text-gray-800 transition-colors text-left"
                    >
                      {quickMessage}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  rows={3}
                />
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FadedSkiesDriverApp;