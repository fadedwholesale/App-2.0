import React, { useState, useEffect, useCallback } from 'react';

// Extend Window interface for GPS tracking
declare global {
  interface Window {
    gpsTrackingId?: number;
    locationSweepInterval?: NodeJS.Timeout;
  }
}
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
  Eye,
  EyeOff,
  X,
  Home,
  Target,
  Route,
  Truck,
  AlertTriangle,
  ChevronRight,
  Calendar,
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  Power,
  PowerOff,
  Timer,
  Award,

} from 'lucide-react';

// Import simple WebSocket service for real-time driver updates

import { supabase, supabaseService } from '../lib/supabase';

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
  status: 'assigned' | 'accepted' | 'ready' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  timestamp: string;
  acceptedAt?: Date;
  lat: number;
  lng: number;
  customerImage?: string;
  tip?: number;
  zone: string;
  mileagePayment: number;
  basePay: number;
  totalDriverPay: number;
  driver_id?: string;
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
  isAvailable: boolean;
  currentLocation: {
    lat: number;
    lng: number;
  } | null;
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

const OrderCard = React.memo(({ order, onAccept, onDecline, onViewDetails, onUpdateStatus, isActive = false }: {
  order: Order;
  onAccept: (order: Order) => void;
  onDecline: (order: Order) => void;
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (order: Order, status: Order['status']) => void;
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
          <p className="text-sm text-gray-700">{order.items.length} items</p>
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

      {/* Delivery Action Buttons - Enhanced Demo Style */}
      <div className="mt-6 space-y-3">
        {order.status === 'assigned' && (
          <>
            <div className="text-center mb-3">
              <p className="text-sm text-gray-600 font-medium">New order assigned! Ready to accept?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onDecline(order)}
                className="bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <X className="w-6 h-6" />
                <span>Decline</span>
              </button>
              <button
                type="button"
                onClick={() => onAccept(order)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-6 h-6" />
                <span>Accept Order</span>
              </button>
            </div>
          </>
        )}

        {order.status === 'accepted' && (
          <>
            <div className="text-center mb-3">
              <p className="text-sm text-gray-600 font-medium">Order accepted! Ready to pick up from store?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onViewDetails(order)}
                className="bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <Eye className="w-6 h-6" />
                <span>View Details</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(order, 'picked_up')}
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <Package className="w-6 h-6" />
                <span>Pick Up Order</span>
              </button>
            </div>
          </>
        )}

        {order.status === 'picked_up' && (
          <>
            <div className="text-center mb-3">
              <p className="text-sm text-gray-600 font-medium">Order picked up! Ready to start delivery?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onViewDetails(order)}
                className="bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <Eye className="w-6 h-6" />
                <span>View Details</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(order, 'in_transit')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <Navigation className="w-6 h-6" />
                <span>Start Delivery</span>
              </button>
            </div>
          </>
        )}

        {order.status === 'in_transit' && (
          <>
            <div className="text-center mb-3">
              <p className="text-sm text-gray-600 font-medium">En route to customer! Ready to complete delivery?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onViewDetails(order)}
                className="bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <Eye className="w-6 h-6" />
                <span>View Details</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(order, 'delivered')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-6 h-6" />
                <span>Complete Delivery</span>
              </button>
            </div>
          </>
        )}

        {order.status === 'delivered' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-bold text-green-800 text-lg">Delivery Completed!</h4>
            <p className="text-green-600 text-sm">Order has been successfully delivered</p>
            <button
              type="button"
              onClick={() => onViewDetails(order)}
              className="mt-3 bg-blue-600 text-white py-3 px-6 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center space-x-2 mx-auto"
            >
              <Eye className="w-5 h-5" />
              <span>View Details</span>
            </button>
          </div>
        )}

        {!['assigned', 'accepted', 'picked_up', 'in_transit', 'delivered'].includes(order.status) && (
          <button
            type="button"
            onClick={() => onViewDetails(order)}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center space-x-2"
          >
            <Eye className="w-6 h-6" />
            <span>View Details</span>
          </button>
        )}
      </div>
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
    id: '',
    name: '',
    phone: '',
    email: '',
    rating: 5.0,
    totalDeliveries: 0,
    vehicle: {
      make: '',
      model: '',
      year: 0,
      color: '',
      licensePlate: ''
    },
    isOnline: false,
    isAvailable: false,
    currentLocation: null,
    earnings: {
      today: 0,
      week: 0,
      month: 0,
      todayMileage: 0,
      todayBase: 0,
      todayTips: 0,
      totalMilesDriven: 0,
      pending: 0
    },
    schedule: {
      isScheduled: false
    },
    payoutSettings: {
      method: 'three_day',
      primaryAccount: '',
      instantFee: 0.50
    }
  });

  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  console.log('Completed orders count:', completedOrders.length);

  // Geofencing states
  const [driverLocation, setDriverLocation] = useState<{lat: number; lng: number}>({ lat: 30.2672, lng: -97.7431 }); // Default to Austin
  const [isWithinDeliveryRadius, setIsWithinDeliveryRadius] = useState(false);
  const [distanceToCustomer, setDistanceToCustomer] = useState<number | null>(null);

  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);

  // Geofencing constants
  const DELIVERY_RADIUS_METERS = 100; // 100 meters radius
  const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds
  console.log('Location update interval:', LOCATION_UPDATE_INTERVAL);

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

  // App settings state
  const [appSettings, setAppSettings] = useState({
    pushNotifications: true,
    locationServices: true,
    autoAcceptOrders: false,
    nightMode: false
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

  // App settings toggle functions
  const toggleAppSetting = useCallback((setting: keyof typeof appSettings) => {
    setAppSettings(prev => {
      const newSettings = { ...prev, [setting]: !prev[setting] };
      
      // Handle specific setting actions
      if (setting === 'locationServices') {
        if (newSettings.locationServices) {
          console.log('📍 Location services enabled - starting GPS tracking');
          startContinuousGPSTracking();
        } else {
          console.log('📍 Location services disabled - stopping GPS tracking');
          stopContinuousGPSTracking();
        }
      }
      
      if (setting === 'autoAcceptOrders') {
        if (newSettings.autoAcceptOrders) {
          console.log('🤖 Auto-accept orders enabled');
          showToastMessage('Auto-accept orders enabled', 'success');
        } else {
          console.log('🤖 Auto-accept orders disabled');
          showToastMessage('Auto-accept orders disabled', 'info');
        }
      }
      
      if (setting === 'pushNotifications') {
        if (newSettings.pushNotifications) {
          console.log('🔔 Push notifications enabled');
          showToastMessage('Push notifications enabled', 'success');
        } else {
          console.log('🔔 Push notifications disabled');
          showToastMessage('Push notifications disabled', 'info');
        }
      }
      
      if (setting === 'nightMode') {
        if (newSettings.nightMode) {
          console.log('🌙 Night mode enabled');
          showToastMessage('Night mode enabled', 'success');
        } else {
          console.log('🌙 Night mode disabled');
          showToastMessage('Night mode disabled', 'info');
        }
      }
      
      return newSettings;
    });
  }, []);

  // Check authentication state on app load
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth state check error:', error);
          return;
        }

        if (user) {
          console.log('✅ User already authenticated:', user.email);
          
          // Load driver profile from database
          const { data: driverData, error: driverError } = await supabase
            .from('drivers')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (driverError) {
            console.error('Failed to load driver profile:', driverError);
            return;
          }

          console.log('✅ Driver profile loaded:', driverData);
          
          // Update driver state with database data
          setDriver(prev => ({
            ...prev,
            id: driverData.id,
            name: driverData.name || '',
            email: driverData.email || '',
            phone: driverData.phone || '',
            isOnline: driverData.is_online || false,
            isAvailable: driverData.is_available || false,
            rating: driverData.rating || 5.0,
            totalDeliveries: driverData.total_deliveries || 0,
            vehicle: {
              make: driverData.vehicle_make || '',
              model: driverData.vehicle_model || '',
              year: driverData.vehicle_year || 0,
              color: driverData.vehicle_color || '',
              licensePlate: driverData.license_plate || ''
            }
          }));

          setIsAuthenticated(true);
          setCurrentView('home');
        }
      } catch (error) {
        console.error('Auth state check error:', error);
      }
    };

    checkAuthState();
  }, []);

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



  // Geofencing utilities
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }, []);

  // Calculate distance in miles for pay calculation
  const calculateDistanceInMiles = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // Round to 2 decimal places
  }, []);

    // Production-ready continuous GPS tracking for 1000+ drivers
  const forceUpdateDriverLocation = useCallback(async (location: { lat: number; lng: number }, accuracy?: number, heading?: number, speed?: number, altitude?: number) => {
    try {
      // Get the authenticated user's UUID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.error('❌ No authenticated user found for location update');
        return;
      }

      // Get driver ID from user ID
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (driverError || !driverData) {
        console.error('❌ Failed to get driver ID:', driverError);
        return;
      }

      console.log('📍 Attempting to insert GPS data:', {
        driver_id: driverData.id,
        lat: location.lat,
        lng: location.lng,
        accuracy: accuracy || null
      });

      // Insert location into dedicated locations table using service client to bypass RLS
      const { error: locationError } = await supabaseService
        .from('driver_locations')
        .upsert({
          driver_id: driverData.id,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: accuracy || null,
          heading: heading || null,
          speed: speed || null,
          altitude: altitude || null
        }, {
          onConflict: 'driver_id'
        });

      if (locationError) {
        console.error('❌ GPS insert failed:', locationError);
        
        // Fallback to RPC function using service client
        const { error: rpcError } = await supabaseService.rpc('insert_driver_location', {
          p_driver_id: driverData.id,
          p_latitude: location.lat,
          p_longitude: location.lng,
          p_accuracy: accuracy || null,
          p_heading: heading || null,
          p_speed: speed || null,
          p_altitude: altitude || null
        });

        if (rpcError) {
          console.error('❌ RPC location insert failed:', rpcError);
          return;
        }
      } else {
        console.log('✅ GPS data inserted successfully');
      }
      
      // Update local state immediately
      setDriverLocation(location);
      setDriver(prev => ({
        ...prev,
        currentLocation: location
      }));



      // PRODUCTION: Refresh orders with new GPS location for accurate pay calculation
      if (driver.isOnline && driver.isAvailable) {
        console.log('📍 GPS location updated, refreshing orders with new pay calculation...');
        setTimeout(() => {
          fetchAvailableOrders();
        }, 1000); // Small delay to ensure GPS state is updated
      }

      // Check geofencing for active order
      if (activeOrder && activeOrder.status === 'in_transit') {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          activeOrder.lat,
          activeOrder.lng
        );

        setDistanceToCustomer(distance);
        const withinRadius = distance <= DELIVERY_RADIUS_METERS;
        setIsWithinDeliveryRadius(withinRadius);

        console.log('📍 Location updated, distance to customer:', distance, 'm');

        // Show notification when entering/leaving delivery zone
        if (withinRadius && distanceToCustomer && distanceToCustomer > DELIVERY_RADIUS_METERS) {
          showToastMessage('🎯 You\'re within delivery range! You can now mark as delivered.', 'success');
        } else if (!withinRadius && distanceToCustomer && distanceToCustomer <= DELIVERY_RADIUS_METERS) {
          showToastMessage('⚠️ You\'ve moved outside the delivery zone.', 'warning');
        }
      }
      
          } catch (error) {
        console.error('❌ GPS tracking error:', error);
      }
    }, [activeOrder, calculateDistance, distanceToCustomer]);

  // Production live GPS tracking system for real-time driver location
  const startContinuousGPSTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('❌ GPS not supported - live tracking unavailable');
      showToastMessage('GPS not supported on this device', 'error');
      return;
    }

    console.log('📍 Starting production live GPS tracking system...');
    
    // Check GPS permission status first
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        console.log('📍 GPS permission status:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          console.error('❌ GPS permission denied - please enable location access');
          showToastMessage('GPS permission denied. Please enable location access in browser settings.', 'error');
          return;
        }
        
        if (permissionStatus.state === 'prompt') {
          console.log('📍 GPS permission prompt needed');
        }
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          console.log('📍 GPS permission changed to:', permissionStatus.state);
          if (permissionStatus.state === 'granted') {
            console.log('📍 GPS permission granted - starting tracking');
            startContinuousTracking();
          }
        };
      }).catch((error) => {
        console.error('❌ GPS permission check failed:', error);
      });
    }
    
    // Test database connection first
    const testDatabaseConnection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          console.log('✅ Database connection test - user authenticated:', user.id);
          
          // Test a simple database read
          const { data, error } = await supabase
            .from('drivers')
            .select('id, name')
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('❌ Database connection test failed:', error);
          } else {
            console.log('✅ Database connection test successful - driver found:', data.name);
          }
        }
      } catch (error) {
        console.error('❌ Database connection test error:', error);
      }
    };
    
    testDatabaseConnection();
    
    // Request GPS permission and start tracking
    console.log('📍 Requesting initial GPS permission...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Initial GPS permission granted');
        console.log('📍 Initial location:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        
        // Log the GPS coordinates received
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        console.log('✅ GPS coordinates detected:', { lat, lng });
        
        // Start continuous tracking after permission is granted
        console.log('📍 Starting continuous tracking...');
        startContinuousTracking();
        console.log('📍 Continuous tracking started');
      },
      (error) => {
        console.error('📍 GPS permission denied:', error.message);
        showToastMessage('GPS permission required for live tracking', 'error');
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 30000 }
    );
    
    const startContinuousTracking = () => {
    
    // Clear any existing tracking
    if (window.gpsTrackingId) {
      navigator.geolocation.clearWatch(window.gpsTrackingId);
    }

    // Production live GPS tracking - updates every 1 second for real-time admin tracking
    window.gpsTrackingId = navigator.geolocation.watchPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        console.log('📍 LIVE GPS COORDINATES RECEIVED:', location);
        console.log('📍 Raw GPS data:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        });
        
        // Immediately update database for admin tracking with full GPS data
        await forceUpdateDriverLocation(
          location,
          position.coords.accuracy || undefined,
          position.coords.heading || undefined,
          position.coords.speed || undefined,
          position.coords.altitude || undefined
        );
        
        console.log('📍 GPS update sent to admin:', location);
      },
      (error) => {
        console.error('📍 Live GPS tracking error:', error.code, error.message);
        console.error('📍 Error details:', {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT
        });
        
        // Production fallback: try to get location with different settings
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const fallbackLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            console.log('📍 Fallback GPS location:', fallbackLocation);
            await forceUpdateDriverLocation(fallbackLocation);
          },
          (fallbackError) => {
            console.error('📍 All GPS methods failed:', fallbackError);
            showToastMessage('GPS location unavailable - check device settings', 'error');
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for better reliability
        maximumAge: 5000 // Allow cached location up to 5 seconds old
      }
    );

    };

    console.log('✅ Production live GPS tracking system active - admin/customer tracking enabled');
  }, [forceUpdateDriverLocation]);

  // Stop live GPS tracking
  const stopContinuousGPSTracking = useCallback(() => {
    if (window.gpsTrackingId) {
      navigator.geolocation.clearWatch(window.gpsTrackingId);
      window.gpsTrackingId = undefined;
      console.log('📍 Live GPS tracking stopped');
    }
    
    // Clear periodic location sweep
    if (window.locationSweepInterval) {
      clearInterval(window.locationSweepInterval);
      window.locationSweepInterval = undefined;
      console.log('📍 Periodic location sweep stopped');
    }
  }, []);

  // Periodic location sweep for admin/customer tracking
  const startPeriodicLocationSweep = useCallback(() => {
    console.log('📍 Starting periodic location sweep for admin/customer tracking...');
    
    // Clear any existing sweep
    if (window.locationSweepInterval) {
      clearInterval(window.locationSweepInterval);
    }

    // Force location update every 2 seconds for admin/customer tracking
    window.locationSweepInterval = setInterval(async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            await forceUpdateDriverLocation(location, position.coords.accuracy || undefined);
          },
          (error) => {
            console.log('📍 Periodic sweep GPS error:', error.message);
          },
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }
        );
      }
    }, 2000); // Every 2 seconds

    console.log('✅ Periodic location sweep active - admin/customer tracking guaranteed');
  }, [forceUpdateDriverLocation]);

  // Manual GPS test function for debugging








  const stopLocationTracking = useCallback(() => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
      console.log('📍 Location tracking stopped');
    }
  }, [locationWatchId]);



  const showToastMessage = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  // Real-time updates handled by Supabase subscriptions
  useEffect(() => {
    if (isAuthenticated && driver.isOnline) {
      console.log('✅ Driver online, real-time updates active for:', driver.name);
      
      return () => {
        console.log('🔌 Driver offline, cleaning up real-time subscriptions');
      };
    }
  }, [isAuthenticated, driver.isOnline, driver.id, driver.name]);

  // Real-time subscriptions for orders and driver updates
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('🔌 Setting up driver real-time subscriptions...');

    // Subscribe to ALL order changes (no filter) to catch any orders assigned to this driver
    const ordersChannel = supabase
      .channel('all-orders-for-driver')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders'
        },
        (payload) => {
          console.log('📋 Order change detected:', payload);
          console.log('🔍 Current driver ID:', driver.id);
          console.log('🔍 Order driver_id:', (payload.new as any)?.driver_id || (payload.old as any)?.driver_id);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            // New order assigned to this driver
            const order = payload.new;
            console.log('🎯 Checking if order is for this driver:', order.driver_id, '===', driver.id);
            if (order.driver_id === driver.id) {
              console.log('🎯 New order assigned to driver:', order.id);
              showToastMessage(`New order assigned: ${order.order_id || order.id}`, 'success');
              
              // Transform the new order and add it to available orders immediately
              const newOrder: Order = {
                id: order.id,
                customerName: order.customer_name || 'Unknown Customer',
                customerPhone: order.customer_phone || '',
                address: order.address || '',
                items: order.items || [],
                total: order.total || 0,
                distance: 2.5,
                estimatedTime: 15,
                paymentMethod: 'Credit Card',
                priority: 'normal' as const,
                status: order.status as any,
                timestamp: order.created_at,
                lat: order.delivery_lat || 0,
                lng: order.delivery_lng || 0,
                zone: 'Downtown',
                tip: 0,
                            basePay: order.driver_base_pay || 2.00, // Use database value or default
            mileagePayment: order.driver_mileage_pay || ((order.distance || 5) * 0.70), // Use database value or calculate
            totalDriverPay: order.driver_total_pay || (2.00 + ((order.distance || 5) * 0.70) + (order.tip || 0)) // Use database value or calculate
              };
              
              // Add to available orders immediately
              setAvailableOrders(prev => [newOrder, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const order = payload.new;
            
            // Update current order if it's assigned to this driver
            if (order.driver_id === driver.id) {
              setActiveOrder(prev => {
                if (prev && prev.id === order.id) {
                  return {
                    ...prev,
                    status: order.status
                  };
                }
                return prev;
              });
              
              // Update order in available orders list immediately
              setAvailableOrders(prev => prev.map(availableOrder => 
                availableOrder.id === order.id 
                  ? { ...availableOrder, status: order.status }
                  : availableOrder
              ));
              
              // Show status update notification
              showToastMessage(`Order status updated: ${order.status}`, 'info');
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Order removed from this driver
            const order = payload.old;
            if (order.driver_id === driver.id) {
              console.log('🗑️ Order removed from driver:', order.id);
              
              // Remove order from available orders immediately
              setAvailableOrders(prev => prev.filter(availableOrder => availableOrder.id !== order.id));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Driver orders subscription status:', status);
      });



    // Subscribe to driver profile changes
    const driverChannel = supabase
      .channel('driver-profile')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'drivers' },
        (payload) => {
          console.log('🚚 Driver profile change detected:', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const driverData = payload.new;
            
            // Update driver state if it's this driver
            if (driverData.user_id === driver.id) {
              setDriver(prev => ({
                ...prev,
                isOnline: driverData.is_online || false,
                isAvailable: driverData.is_available || false,
                rating: driverData.rating || 5.0,
                totalDeliveries: driverData.total_deliveries || 0
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up driver real-time subscriptions...');
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(driverChannel);
    };
  }, [isAuthenticated, driver.id, showToastMessage]);

  // Periodic refresh of available orders when driver is online
  useEffect(() => {
    if (!isAuthenticated || !driver.isOnline) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic refresh of available orders...');
      fetchAvailableOrders();
    }, 5000); // Refresh every 5 seconds when online

    return () => clearInterval(interval);
  }, [isAuthenticated, driver.isOnline]);

  // Function to fetch available orders for this driver
  const fetchAvailableOrders = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, skipping order fetch');
      return;
    }
    
    try {
      console.log('📋 Fetching available orders...');
      
      // Get the authenticated user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        console.error('❌ Failed to get authenticated user:', userError);
        return;
      }
      
      console.log('✅ Authenticated user:', user.id);
      
      // Get driver record using user ID
      const { data: driverRecord, error: driverError } = await supabase
        .from('drivers')
        .select('id, name, is_online, is_available')
        .eq('user_id', user.id)
        .single();
      
      if (driverError || !driverRecord) {
        console.error('❌ Failed to get driver record:', driverError);
        return;
      }
      
      console.log('✅ Driver record found:', driverRecord);
      
      // Get current GPS location for real distance calculation
      let currentGPSLocation = driverLocation;
      console.log('📍 Starting order fetch with driverLocation:', driverLocation);
      
      // Get fresh GPS location with improved error handling
      console.log('📍 Getting fresh GPS location for pay calculation...');
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          // Use low accuracy first (faster, more reliable)
          navigator.geolocation.getCurrentPosition(resolve, (_error) => {
            console.log('📍 Low accuracy GPS failed, trying with cached location...');
            // Fallback to any cached location
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 5000, // Shorter timeout
              maximumAge: 60000 // Allow cached position up to 1 minute old
            });
          }, {
            enableHighAccuracy: false, // Start with low accuracy
            timeout: 8000, // Shorter timeout for faster response
            maximumAge: 30000 // Allow cached location up to 30 seconds old
          });
        });
        
        currentGPSLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('📍 Fresh GPS location obtained:', currentGPSLocation);
        
        // Update driver location state immediately
        setDriverLocation(currentGPSLocation);
        setDriver(prev => ({
          ...prev,
          currentLocation: currentGPSLocation
        }));
        
        // Update driver location in database using service client
        try {
          const { error: locationError } = await supabaseService
            .from('driver_locations')
            .upsert({
              driver_id: driverRecord.id,
              latitude: currentGPSLocation.lat,
              longitude: currentGPSLocation.lng,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'driver_id'
            });
          
          if (locationError) {
            console.error('❌ Failed to update driver location in database:', locationError);
          } else {
            console.log('✅ Driver location updated in database');
          }
        } catch (dbError) {
          console.error('❌ Database update error:', dbError);
        }
        
      } catch (gpsError) {
        console.error('❌ Failed to get fresh GPS location:', gpsError);
        
        // Use existing location if available (more reliable fallback)
        if (currentGPSLocation && currentGPSLocation.lat !== 0 && currentGPSLocation.lng !== 0) {
          console.log('📍 Using existing GPS location:', currentGPSLocation);
        } else if (driverLocation && driverLocation.lat !== 0 && driverLocation.lng !== 0) {
          console.log('📍 Using driver location state:', driverLocation);
          currentGPSLocation = driverLocation;
        } else {
          console.log('📍 No GPS available, using default Austin location');
          currentGPSLocation = { lat: 30.2672, lng: -97.7431 };
        }
      }
      
      // PRODUCTION: Force use of real GPS coordinates if available
      if (currentGPSLocation && currentGPSLocation.lat !== 0 && currentGPSLocation.lng !== 0) {
        console.log('📍 Using real GPS coordinates for pay calculation:', currentGPSLocation);
      } else {
        console.error('❌ No valid GPS coordinates available for pay calculation!');
      }
      
      // Get orders assigned to this driver
      const { data: assignedOrders, error: assignedError } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', driverRecord.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'assigned', 'accepted'])
        .order('created_at', { ascending: false });
      
      if (assignedError) {
        console.error('❌ Failed to fetch assigned orders:', assignedError);
      } else {
        console.log('✅ Assigned orders loaded:', assignedOrders?.length || 0);
      }
      
      // Get available orders (no driver assigned)
      const { data: availableOrders, error: availableError } = await supabase
        .from('orders')
        .select('*')
        .is('driver_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (availableError) {
        console.error('❌ Failed to fetch available orders:', availableError);
      } else {
        console.log('✅ Available orders loaded:', availableOrders?.length || 0);
      }
      
      if (assignedError && availableError) {
        console.error('❌ Both order fetches failed');
        return;
      }
      
      // Combine both sets of orders
      const orders = [...(assignedOrders || []), ...(availableOrders || [])];
      
      console.log('✅ Total orders loaded:', orders?.length || 0);
      
      if (orders && orders.length > 0) {
        console.log('📋 Sample order:', orders[0]);
      }
      
      // Transform database orders to match the Order interface
      const transformedOrders: Order[] = await Promise.all((orders || []).map(async order => {
        // Calculate real distance if we have coordinates
        let calculatedDistance = order.distance || 2.5; // Default fallback
        let calculatedMileagePay = order.driver_mileage_pay || (calculatedDistance * 0.70);
        let calculatedTotalPay = order.driver_total_pay || (2.00 + calculatedMileagePay + (order.tip || 0));
        
        // Debug: Log order coordinates
        console.log(`🔍 Order ${order.id} coordinates:`, {
          delivery_lat: order.delivery_lat,
          delivery_lng: order.delivery_lng,
          currentGPSLocation: currentGPSLocation,
          hasGPS: currentGPSLocation && currentGPSLocation.lat !== 0 && currentGPSLocation.lng !== 0
        });
        
        // If we have delivery coordinates and current GPS location, calculate real distance
        if (order.delivery_lat && order.delivery_lng && currentGPSLocation && 
            currentGPSLocation.lat !== 0 && currentGPSLocation.lng !== 0) {
          calculatedDistance = calculateDistanceInMiles(
            currentGPSLocation.lat, 
            currentGPSLocation.lng, 
            order.delivery_lat, 
            order.delivery_lng
          );
          calculatedMileagePay = calculatedDistance * 0.70;
          calculatedTotalPay = 2.00 + calculatedMileagePay + (order.tip || 0);
          
          console.log(`📍 Real distance calculated for order ${order.id}: ${calculatedDistance} miles`);
          console.log(`📍 From driver location (${currentGPSLocation.lat}, ${currentGPSLocation.lng}) to delivery (${order.delivery_lat}, ${order.delivery_lng})`);
          console.log(`💰 Real pay calculated: Base=$2.00 + Mileage=$${calculatedMileagePay.toFixed(2)} + Tip=$${order.tip || 0} = $${calculatedTotalPay.toFixed(2)}`);
          
                     // Note: Database update removed - distance column doesn't exist in orders table
           console.log('✅ Real pay calculated for display (database update skipped)');
        } else {
          console.log(`⚠️ Using default distance for order ${order.id}: ${calculatedDistance} miles`);
          console.log(`⚠️ Missing: delivery_lat=${order.delivery_lat}, delivery_lng=${order.delivery_lng}, GPS=${currentGPSLocation ? 'available' : 'unavailable'}`);
          
          // If we have GPS but no delivery coordinates, use a default location for testing
          if (currentGPSLocation && currentGPSLocation.lat !== 0 && currentGPSLocation.lng !== 0) {
            // Use a default delivery location (Austin downtown) for testing
            const defaultDeliveryLat = 30.2672;
            const defaultDeliveryLng = -97.7431;
            
            calculatedDistance = calculateDistanceInMiles(
              currentGPSLocation.lat, 
              currentGPSLocation.lng, 
              defaultDeliveryLat, 
              defaultDeliveryLng
            );
            calculatedMileagePay = calculatedDistance * 0.70;
            calculatedTotalPay = 2.00 + calculatedMileagePay + (order.tip || 0);
            
            console.log(`📍 Using default delivery location for order ${order.id}: ${calculatedDistance} miles`);
            console.log(`💰 Calculated pay: Base=$2.00 + Mileage=$${calculatedMileagePay.toFixed(2)} + Tip=$${order.tip || 0} = $${calculatedTotalPay.toFixed(2)}`);
          }
        }
        
        return {
          id: order.id,
          customerName: order.customer_name || 'Unknown Customer',
          customerPhone: order.customer_phone || '',
          address: order.address || '',
          items: order.items || [],
          total: order.total || 0,
          distance: calculatedDistance,
          estimatedTime: Math.max(15, Math.round(calculatedDistance * 2)), // Realistic ETA: 2 minutes per mile minimum
          paymentMethod: 'Credit Card', // Default payment method
          priority: 'normal' as const,
          status: order.status as any,
          timestamp: order.created_at,
          lat: order.delivery_lat || 0, // Use actual delivery coordinates
          lng: order.delivery_lng || 0,
          zone: 'Downtown', // Default zone
          tip: order.tip || 0,
          basePay: order.driver_base_pay || 2.00,
          mileagePayment: calculatedMileagePay,
          totalDriverPay: calculatedTotalPay
        };
      }));
      
      console.log('✅ Transformed orders:', transformedOrders.length);
      setAvailableOrders(transformedOrders);
      
    } catch (error) {
      console.error('❌ Error fetching available orders:', error);
    }
  }, [isAuthenticated, driverLocation, calculateDistanceInMiles]);

  // Cleanup continuous GPS tracking on component unmount
  useEffect(() => {
    return () => {
      stopContinuousGPSTracking();
      stopLocationTracking();
    };
  }, [stopContinuousGPSTracking, stopLocationTracking]);


  const toggleOnlineStatus = useCallback(async () => {
    try {
      console.log('🔄 Toggling online status for driver:', driver.id);
      
      const newOnlineStatus = !driver.isOnline;
      const newAvailableStatus = newOnlineStatus; // When going online, also become available
      
      console.log('🔄 Attempting to update driver status in database...');
      console.log('🔄 Driver ID:', driver.id);
      console.log('🔄 Driver user_id:', driver.id);
      console.log('🔄 New online status:', newOnlineStatus);
      console.log('🔄 New available status:', newAvailableStatus);
      
      // Get the current user to use their ID
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔄 Current user ID:', user?.id);
      
      if (!user?.id) {
        console.error('❌ No authenticated user found');
        showToastMessage('Authentication error. Please sign in again.', 'error');
        return;
      }
      
      // Update in database using the authenticated user's ID
      const { data, error } = await supabase
        .from('drivers')
        .update({ 
          is_online: newOnlineStatus, 
          is_available: newAvailableStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id) // Use the authenticated user's ID
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update driver status:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        console.error('❌ Error hint:', error.hint);
        showToastMessage(`Failed to update status: ${error.message}`, 'error');
        return;
      }

      console.log('✅ Driver status updated in database:', data);
      
      // Update local state immediately
      setDriver(prev => {
        const updatedDriver = {
          ...prev,
          isOnline: newOnlineStatus,
          isAvailable: newAvailableStatus
        };
        console.log('🔄 Updated local driver state:', updatedDriver);
        return updatedDriver;
      });
      
      showToastMessage(
        newOnlineStatus ? 'You are now online and ready for deliveries!' : 'You are now offline',
        newOnlineStatus ? 'success' : 'warning'
      );
      
            // If going online, start live GPS tracking and fetch orders
      if (newOnlineStatus) {
        console.log('🔄 Driver went online, starting live GPS tracking for admin/customer...');
        
        // Start live GPS tracking for real-time location updates
        console.log('📍 Starting GPS tracking...');
        startContinuousGPSTracking();
        console.log('📍 GPS tracking started');
        
        // Start periodic location sweep for guaranteed admin/customer tracking
        startPeriodicLocationSweep();
        
        // Refresh location from database
        // GPS tracking now handled by startContinuousGPSTracking
        
        // Fetch available orders
        fetchAvailableOrders();
        
        // Also check for any orders that might have been assigned while offline
        setTimeout(() => {
          fetchAvailableOrders();
        }, 2000);
      } else {
        // If going offline, stop all GPS tracking
        console.log('🔄 Driver going offline, stopping all GPS tracking...');
        stopContinuousGPSTracking();
      }
      
    } catch (error) {
      console.error('Error toggling online status:', error);
      showToastMessage('Failed to update status. Please try again.', 'error');
    }
  }, [driver.id, driver.isOnline, showToastMessage]);

  const acceptOrder = useCallback(async (order: Order) => {
    try {
      console.log('📋 Accepting order:', order.id);
      
      // Get the authenticated user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        console.error('❌ Failed to get authenticated user:', userError);
        showToastMessage('Authentication error. Please sign in again.', 'error');
        return;
      }
      
      // Get driver record using user ID
      const { data: driverRecord, error: driverError } = await supabase
        .from('drivers')
        .select('id, name')
        .eq('user_id', user.id)
        .single();
      
      if (driverError || !driverRecord) {
        console.error('❌ Failed to get driver record:', driverError);
        showToastMessage('Driver profile error. Please contact support.', 'error');
        return;
      }
      
      console.log('✅ Driver record found for order assignment:', driverRecord);
      
      // Update order in database with driver assignment and status change
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          driver_id: driverRecord.id,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      if (updateError) {
        console.error('❌ Failed to update order in database:', updateError);
        showToastMessage('Failed to accept order. Please try again.', 'error');
        return;
      }
      
      console.log('✅ Order successfully updated in database');
      
      // Update local state
      const acceptedOrder: Order = { ...order, status: 'accepted' as const, acceptedAt: new Date() };
      setActiveOrder(acceptedOrder);
      setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
      
      // Start GPS tracking for delivery
      startContinuousGPSTracking();
      
      showToastMessage(`Order ${order.id} accepted!`, 'success');
      setTimeout(() => setCurrentView('active-delivery'), 500);
      
    } catch (error) {
      console.error('❌ Error accepting order:', error);
      showToastMessage('Failed to accept order. Please try again.', 'error');
    }
  }, [driver.id, driver.name, driver.phone, driver.vehicle, showToastMessage, startContinuousGPSTracking]);

  // Auto-accept orders when enabled
  useEffect(() => {
    if (appSettings.autoAcceptOrders && availableOrders.length > 0 && driver.isOnline && driver.isAvailable) {
      console.log('🤖 Auto-accepting order due to auto-accept setting');
      const firstOrder = availableOrders[0];
      acceptOrder(firstOrder);
    }
  }, [appSettings.autoAcceptOrders, availableOrders, driver.isOnline, driver.isAvailable, acceptOrder]);

  // Force GPS tracking to start immediately when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🚀 Driver authenticated, starting GPS tracking immediately...');
      startContinuousGPSTracking();
    }
  }, [isAuthenticated, startContinuousGPSTracking]);

  const declineOrder = useCallback((order: Order) => {
    setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
    showToastMessage(`Order ${order.id} declined`, 'info');
  }, [showToastMessage]);

  const updateOrderStatusFromCard = useCallback(async (order: Order, status: Order['status']) => {
    try {
      console.log('📋 Updating order status:', order.id, 'to', status);
      
      // Get the authenticated user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        console.error('❌ Failed to get authenticated user:', userError);
        showToastMessage('Authentication error. Please sign in again.', 'error');
        return;
      }
      
      // Get driver record using user ID
      const { data: driverRecord, error: driverError } = await supabase
        .from('drivers')
        .select('id, name')
        .eq('user_id', user.id)
        .single();
      
      if (driverError || !driverRecord) {
        console.error('❌ Failed to get driver record:', driverError);
        showToastMessage('Driver profile error. Please contact support.', 'error');
        return;
      }
      
      // Update order status in database
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: status,
          driver_id: status === 'accepted' ? driverRecord.id : order.driver_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('❌ Failed to update order status in database:', updateError);
        showToastMessage('Failed to update order status. Please try again.', 'error');
        return;
      }

      console.log('✅ Order status updated in database:', status);

      // Update the order in available orders
      setAvailableOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, status, lastUpdate: new Date() } : o
      ));

      // If this becomes an active order, set it as active
      if (status === 'accepted') {
        const acceptedOrder: Order = { ...order, status: 'accepted' as const, acceptedAt: new Date() };
        setActiveOrder(acceptedOrder);
        setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
        startContinuousGPSTracking();
        setTimeout(() => setCurrentView('active-delivery'), 500);
      }

      const statusMessages = {
        assigned: 'Order assigned to you',
        accepted: 'Order accepted successfully',
        ready: 'Order is ready for pickup',
        picked_up: 'Order picked up! En route to customer.',
        in_transit: 'Delivery in progress',
        delivered: 'Order delivered successfully!',
        cancelled: 'Order was cancelled'
      };

      // Status update will be handled by Supabase real-time subscription
      console.log('📡 Order status updated in database, admin will receive real-time update');

      showToastMessage(statusMessages[status] || `Order status updated to ${status}`, 'success');
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      showToastMessage('Failed to update order status. Please try again.', 'error');
    }
  }, [driver.id, driver.name, driver.currentLocation, showToastMessage, startContinuousGPSTracking]);

  const updateOrderStatus = useCallback(async (status: Order['status']) => {
    if (!activeOrder) return;

    // Check geofencing for delivery completion
    if (status === 'delivered' && !isWithinDeliveryRadius && activeOrder.status === 'in_transit') {
      showToastMessage('❌ You must be within 100 meters of the customer location to mark as delivered.', 'error');
      return;
    }

    try {
      console.log('📋 Updating active order status:', activeOrder.id, 'to', status);
      
      // Get the authenticated user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        console.error('❌ Failed to get authenticated user:', userError);
        showToastMessage('Authentication error. Please sign in again.', 'error');
        return;
      }
      
      // Get driver record using user ID
      const { data: driverRecord, error: driverError } = await supabase
        .from('drivers')
        .select('id, name')
        .eq('user_id', user.id)
        .single();
      
      if (driverError || !driverRecord) {
        console.error('❌ Failed to get driver record:', driverError);
        showToastMessage('Driver profile error. Please contact support.', 'error');
        return;
      }
      
      // Update order status in database
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: status,
          driver_id: driverRecord.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeOrder.id);

      if (updateError) {
        console.error('❌ Failed to update order status in database:', updateError);
        showToastMessage('Failed to update order status. Please try again.', 'error');
        return;
      }

      console.log('✅ Order status updated in database:', status);

      const updatedOrder = { ...activeOrder, status, lastUpdate: new Date() };
      setActiveOrder(updatedOrder);

      const statusMessages = {
        assigned: 'Order assigned to you',
        accepted: 'Order accepted successfully',
        ready: 'Order is ready for pickup',
        picked_up: 'Order picked up! En route to customer.',
        in_transit: 'Delivery in progress',
        delivered: 'Order delivered successfully!',
        cancelled: 'Order was cancelled'
      };

      // Status update will be handled by Supabase real-time subscription
      console.log('📡 Order status updated in database, admin will receive real-time update');

      if (status === 'delivered') {
        setCompletedOrders((prev: Order[]) => [updatedOrder, ...prev]);
      setActiveOrder(null);

      // Stop location tracking when delivery is completed
      stopLocationTracking();
      setIsWithinDeliveryRadius(false);
      setDistanceToCustomer(null);

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
    } catch (error) {
      console.error('Error updating order status:', error);
      showToastMessage('Failed to update order status. Please try again.', 'error');
    }
  }, [activeOrder, driver.id, driver.name, driver.currentLocation, showToastMessage, isWithinDeliveryRadius, stopLocationTracking]);

  const handleAuthSubmit = useCallback(async () => {
    try {
      if (authMode === 'login') {
        if (authForm.email && authForm.password) {
          console.log('🔐 Driver login attempt:', authForm.email);
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email: authForm.email,
            password: authForm.password
          });

          if (error) {
            console.error('Driver login error:', error);
            showToastMessage('Login failed. Please check your credentials.', 'error');
            return;
          }

          console.log('✅ Driver login successful:', data);
          
          // Load driver profile from database
          const { data: driverData, error: driverError } = await supabase
            .from('drivers')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

          if (driverError) {
            console.error('Failed to load driver profile:', driverError);
            showToastMessage('Failed to load driver profile.', 'error');
            return;
          }

          console.log('✅ Driver profile loaded:', driverData);
          
          // Update driver state with database data
          setDriver(prev => ({
            ...prev,
            id: driverData.id,
            name: driverData.name || '',
            email: driverData.email || '',
            phone: driverData.phone || '',
            isOnline: driverData.is_online || false,
            isAvailable: driverData.is_available || false,
            rating: driverData.rating || 5.0,
            totalDeliveries: driverData.total_deliveries || 0,
            vehicle: {
              make: driverData.vehicle_make || '',
              model: driverData.vehicle_model || '',
              year: driverData.vehicle_year || 0,
              color: driverData.vehicle_color || '',
              licensePlate: driverData.license_plate || ''
            }
          }));

          setIsAuthenticated(true);
          setCurrentView('home');
          showToastMessage('Welcome back!', 'success');
          
          // Fetch available orders for this driver
          fetchAvailableOrders();
        } else {
          showToastMessage('Please enter email and password', 'error');
        }
      } else if (authMode === 'signup') {
        if (authForm.name && authForm.email && authForm.password && authForm.licenseNumber) {
          console.log('🔐 Driver signup attempt:', authForm.email);
          
          const { data, error } = await supabase.auth.signUp({
            email: authForm.email,
            password: authForm.password,
            options: {
              data: {
                name: authForm.name,
                role: 'driver'
              }
            }
          });

          if (error) {
            console.error('Driver signup error:', error);
            showToastMessage('Signup failed. Please try again.', 'error');
            return;
          }

          console.log('✅ Driver signup successful:', data);
          
          // Create driver profile in database
          const { data: driverData, error: driverError } = await supabase
            .from('drivers')
            .insert([{
              user_id: data.user?.id,
              name: authForm.name,
              email: authForm.email,
              phone: authForm.phone,
              license_number: authForm.licenseNumber,
              vehicle_make: '',
              vehicle_model: '',
              vehicle_year: null,
              vehicle_color: '',
              license_plate: '',
              is_online: false,
              is_available: false,
              is_approved: false
            }])
            .select()
            .single();

          if (driverError) {
            console.error('Failed to create driver profile:', driverError);
            showToastMessage('Account created but profile setup failed. Contact support.', 'error');
            return;
          }

          console.log('✅ Driver profile created:', driverData);
          
          // Update driver state
          setDriver(prev => ({
            ...prev,
            id: driverData.id,
            name: driverData.name,
            email: driverData.email,
            phone: driverData.phone,
            isOnline: false,
            isAvailable: false
          }));

          setIsAuthenticated(true);
          setCurrentView('home');
          showToastMessage('Account created successfully! Please wait for admin approval.', 'success');
        } else {
          showToastMessage('Please fill in all required fields', 'error');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      showToastMessage('Authentication failed. Please try again.', 'error');
    }
  }, [authMode, authForm, showToastMessage]);



  const handleLogout = useCallback(async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      }
      
      setIsAuthenticated(false);
      setCurrentView('auth');
      setDriver(prev => ({ ...prev, isOnline: false }));
      setActiveOrder(null);
      showToastMessage('Logged out successfully', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      showToastMessage('Logout failed. Please try again.', 'error');
    }
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
                    onChange={(e) => setWithdrawData({...withdrawData, method: e.target.value as 'instant' | 'daily' | 'three_day'})}
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
                    onChange={(e) => setPayoutData({...payoutData, defaultMethod: e.target.value as 'instant' | 'daily' | 'three_day'})}
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

              {/* Toggle between login and signup */}
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
                >
                  {authMode === 'login' ? 'Need to sign up? Create account' : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>


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

                {/* Active Order Status - Only show if driver has accepted the order */}
                {activeOrder && ['accepted', 'picked_up', 'in_transit', 'delivered'].includes(activeOrder.status) && (
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
                        <div className="flex items-center space-x-2">
                          <p className="text-blue-600 text-xs font-semibold">{activeOrder.status.replace('_', ' ').toUpperCase()}</p>
                          {activeOrder.status === 'in_transit' && (
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              isWithinDeliveryRadius
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {isWithinDeliveryRadius ? '🎯 In Zone' : '📍 En Route'}
                            </span>
                          )}
                        </div>
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
                    <div className="flex items-center space-x-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          console.log('🧪 Testing GPS location...');
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              const location = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                              };
                              console.log('✅ GPS Test Location:', location);
                              setDriverLocation(location);
                              setDriver(prev => ({
                                ...prev,
                                currentLocation: location
                              }));
                              showToastMessage(`GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`, 'success');
                            },
                            (error) => {
                              console.error('❌ GPS Test Failed:', error);
                              showToastMessage('GPS test failed - check permissions', 'error');
                            },
                            { enableHighAccuracy: true, timeout: 5000 }
                          );
                        }}
                        className="text-green-600 hover:text-green-700 font-semibold text-sm flex items-center space-x-1"
                        title="Test GPS Location"
                      >
                        <Target className="w-4 h-4" />
                        <span>Test GPS</span>
                      </button>
                      <button type="button" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
                        <Filter className="w-4 h-4" />
                      </button>
                    </div>
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
                          onViewDetails={(order) => {
                            setActiveOrder(order);
                            setCurrentView('active-delivery');
                          }}
                          onUpdateStatus={updateOrderStatusFromCard}
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
                {/* Geofencing Status */}
                {activeOrder.status === 'in_transit' && (
                  <div className={`rounded-3xl p-4 mb-6 border-2 ${
                    isWithinDeliveryRadius
                      ? 'bg-green-50 border-green-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isWithinDeliveryRadius ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className={`font-bold ${
                          isWithinDeliveryRadius ? 'text-green-800' : 'text-amber-800'
                        }`}>
                          {isWithinDeliveryRadius ? '🎯 Within Delivery Zone' : '📍 Approaching Customer'}
                        </h4>
                        <p className={`text-sm ${
                          isWithinDeliveryRadius ? 'text-green-700' : 'text-amber-700'
                        }`}>
                          {distanceToCustomer
                            ? `${Math.round(distanceToCustomer)}m from customer location`
                            : 'Calculating distance...'}
                        </p>
                        {!isWithinDeliveryRadius && (
                          <p className="text-xs text-amber-600 mt-1">
                            Get within 100m to enable delivery completion
                          </p>
                        )}
                      </div>
                      <Target className={`w-6 h-6 ${
                        isWithinDeliveryRadius ? 'text-green-600' : 'text-amber-600'
                      }`} />
                    </div>

                  </div>
                )}

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

                  {/* ALWAYS SHOW DELIVERY ACTIONS - PROMINENT */}
                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border-2 border-blue-200">
                    <h3 className="font-bold text-xl text-blue-900 mb-4 text-center">🚚 DELIVERY ACTIONS</h3>
                    
                    {(activeOrder.status === 'accepted' || activeOrder.status === 'ready') && (
                      <div className="text-center">
                        <p className="text-sm text-blue-700 font-medium mb-4">
                          {activeOrder.status === 'ready' 
                            ? "Order is ready for pickup! Head to the store to collect the order."
                            : "Ready to pick up the order from the store?"
                          }
                        </p>
                        <button
                          type="button"
                          onClick={() => updateOrderStatus('picked_up')}
                          className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-5 rounded-2xl font-bold text-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                        >
                          <Package className="w-7 h-7" />
                          <span>PICK UP ORDER</span>
                        </button>
                      </div>
                    )}
                    
                    {activeOrder.status === 'picked_up' && (
                      <div className="text-center">
                        <p className="text-sm text-blue-700 font-medium mb-4">Order picked up! Ready to start delivery to customer?</p>
                        <button
                          type="button"
                          onClick={() => {
                            updateOrderStatus('in_transit');
                            // Start intensive location tracking for geofencing
                            startContinuousGPSTracking();
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-5 rounded-2xl font-bold text-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                        >
                          <Navigation className="w-7 h-7" />
                          <span>START DELIVERY</span>
                        </button>
                      </div>
                    )}
                    
                    {activeOrder.status === 'in_transit' && (
                      <div className="text-center">
                        <p className="text-sm text-blue-700 font-medium mb-4">
                          {isWithinDeliveryRadius 
                            ? "You're within delivery range! Ready to complete delivery?"
                            : "Get within 100m of the customer to enable delivery completion"
                          }
                        </p>
                        <button
                          type="button"
                          onClick={() => updateOrderStatus('delivered')}
                          disabled={!isWithinDeliveryRadius}
                          className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-lg flex items-center justify-center space-x-3 ${
                            isWithinDeliveryRadius
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-xl'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          title={!isWithinDeliveryRadius ? 'You must be within 100 meters of the customer location to mark as delivered' : 'Mark order as delivered'}
                        >
                          <CheckCircle className="w-7 h-7" />
                          <span>{isWithinDeliveryRadius ? 'COMPLETE DELIVERY' : 'NOT WITHIN DELIVERY ZONE'}</span>
                        </button>
                        {!isWithinDeliveryRadius && (
                          <p className="text-xs text-amber-600 mt-3 font-semibold">
                            Current distance: {distanceToCustomer ? `${Math.round(distanceToCustomer)}m` : 'Calculating...'}
                          </p>
                        )}
                      </div>
                    )}

                    {activeOrder.status === 'delivered' && (
                      <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h4 className="font-bold text-green-800 text-xl mb-2">DELIVERY COMPLETED!</h4>
                        <p className="text-green-600 text-sm">Order has been successfully delivered</p>
                      </div>
                    )}

                    {!['accepted', 'ready', 'picked_up', 'in_transit', 'delivered'].includes(activeOrder.status) && (
                      <div className="text-center">
                        <p className="text-sm text-blue-700 font-medium mb-4">Waiting for order to be ready...</p>
                        <div className="w-full bg-gray-200 text-gray-500 py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-3">
                          <Clock className="w-7 h-7" />
                          <span>ORDER STATUS: {activeOrder.status.toUpperCase()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Geofencing Debug Info - Development Only */}
                {activeOrder.status === 'in_transit' && driverLocation && (
                  <div className="bg-gray-50 rounded-3xl p-4 mb-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">📍 Location Debug</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">Driver:</span>
                        <p className="font-mono text-gray-800">
                          {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Customer:</span>
                        <p className="font-mono text-gray-800">
                          {activeOrder.lat.toFixed(6)}, {activeOrder.lng.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Distance:</span>
                        <p className="font-semibold text-gray-800">
                          {distanceToCustomer ? `${Math.round(distanceToCustomer)}m` : 'Calculating...'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Radius:</span>
                        <p className="font-semibold text-gray-800">{DELIVERY_RADIUS_METERS}m</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Test geofencing by simulating customer location
                        const simulatedLocation = {
                          lat: activeOrder.lat + 0.0001,
                          lng: activeOrder.lng + 0.0001
                        };
                        forceUpdateDriverLocation(simulatedLocation, 10);
                      }}
                      className="mt-2 w-full bg-blue-100 text-blue-700 py-2 px-3 rounded-xl text-xs font-semibold hover:bg-blue-200 transition-colors"
                    >
                      🧪 Test: Simulate Near Customer
                    </button>
                  </div>
                )}

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

                  <div className="grid grid-cols-3 gap-3 mt-4">
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
                    <button
                      type="button"
                      onClick={() => {
                        const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${activeOrder.lat},${activeOrder.lng}&travelmode=driving`;
                        window.open(navigationUrl, '_blank');
                      }}
                      className="bg-purple-600 text-white py-3 rounded-2xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Navigation className="w-5 h-5" />
                      <span>Navigate</span>
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
                      { key: 'pushNotifications', label: 'Push Notifications', icon: Bell },
                      { key: 'locationServices', label: 'Location Services', icon: MapPin },
                      { key: 'autoAcceptOrders', label: 'Auto-Accept Orders', icon: Timer },
                      { key: 'nightMode', label: 'Night Mode', icon: Settings }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <setting.icon className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-700">{setting.label}</span>
                        </div>
                        <button
                          onClick={() => toggleAppSetting(setting.key as keyof typeof appSettings)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            appSettings[setting.key as keyof typeof appSettings] ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            appSettings[setting.key as keyof typeof appSettings] ? 'translate-x-7' : 'translate-x-1'
                          }`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                  

                </div>

                {/* GPS Tracking Test */}


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
