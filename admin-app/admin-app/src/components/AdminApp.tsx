import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Home,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,

  Play,
  Pause,
  Bell,
  Star,
  Edit,
  MapPin,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  RefreshCw,
  Eye,
  Shield,
  Database,
  Globe,
  Mail,
  UserPlus,
  CreditCard,
  Truck,
  Target,
  Activity,
  User
} from 'lucide-react';

// Import Supabase for authentication and real-time data
import { supabase, supabaseService } from '../lib/supabase';
import EnhancedAdminMap from './EnhancedAdminMap';
import { 
  DriverLocation, 
  DeliveryLocation, 
  OptimizedRoute 
} from '../services/mapbox-optimization';

const FadedSkiesTrackingAdmin = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState({
    id: '',
    email: '',
    name: 'Admin',
    role: 'admin'
  });

  // Live data state
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [liveCustomers, setLiveCustomers] = useState<any[]>([]);
  const [liveDrivers, setLiveDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentView, setCurrentView] = useState('dashboard');
  
  // Live Tracking & Dispatch System State
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(true);
  const [dispatchQueue, setDispatchQueue] = useState<any[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const [driverPerformance, setDriverPerformance] = useState<any[]>([]);

  // Mapbox Optimization State
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [selectedDriverForTracking, setSelectedDriverForTracking] = useState<string | null>(null);
  const [selectedDeliveryForTracking, setSelectedDeliveryForTracking] = useState<string | null>(null);

  // Modal states
  const [modals, setModals] = useState({
    addProduct: false,
    editProduct: false,
    orderDetails: false,
    customerDetails: false,
    driverDetails: false,
    editDriver: false,
    userManagement: false,
    confirmDelete: false
  });

  // Selected items for modals
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: null, name: '' });

  // Modal management functions
  const openModal = (modalName: string, item: any = null) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
    if (item) {
      switch (modalName) {
        case 'editProduct':
          setSelectedProduct(item);
          break;
        case 'orderDetails':
          setSelectedOrder(item);
          break;
        case 'customerDetails':
          setSelectedCustomer(item);
          break;
        case 'driverDetails':
        case 'editDriver':
          setSelectedDriver(item);
          break;
        case 'confirmDelete':
          setDeleteTarget(item);
          break;
      }
    }
  };

  const closeModal = (modalName: string) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    // Clear selected items
    if (modalName === 'editProduct' || modalName === 'addProduct') setSelectedProduct(null);
    if (modalName === 'orderDetails') setSelectedOrder(null);
    if (modalName === 'customerDetails') setSelectedCustomer(null);
    if (modalName === 'driverDetails' || modalName === 'editDriver') setSelectedDriver(null);

    if (modalName === 'confirmDelete') setDeleteTarget({ type: '', id: null, name: '' });
  };

  // Supabase real-time connection for admin monitoring
  useEffect(() => {
    if (!isAuthenticated) return;

    try {
      console.log('🔗 Setting up Supabase real-time for admin...');
      
      // Subscribe to orders table changes
      const ordersSubscription = supabase
        .channel('admin-orders')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('📦 Order change:', payload);
            
            // Handle new order notifications
            if (payload.eventType === 'INSERT') {
              const orderData = payload.new;
              console.log('🔔 New order received:', orderData);

              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification('New Order - Faded Skies Admin', {
                  body: `Order ${orderData.order_id} from ${orderData.customer_name} - $${orderData.total.toFixed(2)}`,
                  icon: '/favicon.ico',
                  tag: orderData.order_id
                });
              }
            }
          }
        )
        .subscribe();

      // Subscribe to products table changes
      const productsSubscription = supabase
        .channel('admin-products')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            console.log('📦 Product change:', payload);
          }
        )
        .subscribe();

      // Subscribe to all user changes
      const usersSubscription = supabaseService
        .channel('admin-users')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'users' },
          (payload) => {
            console.log('🔍 Real-time user change:', payload.eventType, (payload.new as any)?.email);
            
            if (payload.eventType === 'UPDATE' && payload.new) {
              // Update existing user profile
              setLiveCustomers(prev => 
                prev.map(user => 
                  user.id === payload.new.id ? { ...user, ...payload.new } : user
                )
              );
              console.log('✅ User profile updated in admin:', (payload.new as any)?.email);
            } else if (payload.eventType === 'INSERT' && payload.new) {
              // Add new user
              console.log('➕ Adding new user via real-time:', (payload.new as any)?.email);
              setLiveCustomers(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'DELETE') {
              // Remove user
              console.log('🗑️ Removing user via real-time:', (payload.old as any)?.email);
              setLiveCustomers(prev => prev.filter(user => user.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      console.log('✅ Admin Supabase real-time connected');

      // Cleanup on unmount
      return () => {
        ordersSubscription.unsubscribe();
        productsSubscription.unsubscribe();
        usersSubscription.unsubscribe();
        console.log('🔌 Admin Supabase real-time disconnected');
      };
    } catch (error) {
      console.error('Admin Supabase real-time setup failed:', error);
    }
  }, [isAuthenticated]);

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // Authentication functions
  const handleAuthSubmit = useCallback(async () => {
    if (authMode === 'login') {
      if (authForm.email && authForm.password) {
        try {
          console.log('🔐 Admin login attempt:', authForm.email);
          const { data, error } = await supabase.auth.signInWithPassword({
            email: authForm.email,
            password: authForm.password
          });

          if (error) {
            console.error('Admin login error:', error);
            alert('Login failed. Please check your credentials.');
            return;
          }

          console.log('✅ Admin login successful:', data);
          setIsAuthenticated(true);
          setAdminUser({
            id: data.user?.id || '',
            email: authForm.email,
            name: data.user?.user_metadata?.name || 'Admin',
            role: 'admin'
          });
          setCurrentView('dashboard');
        } catch (error) {
          console.error('Admin login error:', error);
          alert('Login failed. Please try again.');
        }
      } else {
        alert('Please enter email and password');
      }
    } else if (authMode === 'signup') {
      if (!authForm.name || !authForm.email || !authForm.password) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (authForm.password !== authForm.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      try {
        console.log('🔐 Admin signup attempt:', authForm.email);
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              name: authForm.name,
              role: 'admin'
            }
          }
        });

        if (error) {
          console.error('Admin signup error:', error);
          alert('Signup failed. Please try again.');
          return;
        }

        console.log('✅ Admin signup successful:', data);
        alert('Admin account created! Please check your email to confirm before logging in.');
        setAuthMode('login');
      } catch (error) {
        console.error('Admin signup error:', error);
        alert('Signup failed. Please try again.');
      }
    }
  }, [authMode, authForm]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setAdminUser({ id: '', email: '', name: 'Admin', role: 'admin' });
    setCurrentView('dashboard');
    setAuthForm({ email: '', password: '', name: '', confirmPassword: '' });
  }, []);

  // Fetch live data from Supabase
  const fetchLiveData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    
    try {
      console.log('🔍 SINGLE SOLUTION: Fetching all data...');
      
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        console.error('❌ Failed to fetch orders:', ordersError);
      } else {
        console.log('📋 Orders loaded:', ordersData?.length || 0);
        if (ordersData && ordersData.length > 0) {
          console.log('📋 Sample order data:', ordersData[0]);
          console.log('📋 Order ID field:', ordersData[0].order_id || ordersData[0].id);
          console.log('📋 Order status:', ordersData[0].status);
          console.log('📋 Order user_id:', ordersData[0].user_id);
          console.log('📋 Order user_id type:', typeof ordersData[0].user_id);
          
          // Check for orders with undefined user_id
          const ordersWithUndefinedUserId = ordersData.filter(order => !order.user_id);
          if (ordersWithUndefinedUserId.length > 0) {
            console.warn('⚠️ Found orders with undefined user_id:', ordersWithUndefinedUserId.length);
            console.warn('⚠️ These orders:', ordersWithUndefinedUserId);
          }
        } else {
          console.log('⚠️ No orders found in database');
        }
        setLiveOrders(ordersData || []);
      }

      // Fetch products
      console.log('🔍 Fetching products from database...');
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (productsError) {
        console.error('❌ Failed to fetch products:', productsError);
      } else {
        console.log('📦 Products loaded:', productsData?.length || 0);
        if (productsData && productsData.length > 0) {
          console.log('📦 Sample product data:', productsData[0]);
          console.log('📦 Product categories:', [...new Set(productsData.map(p => p.category))]);
        } else {
          console.log('⚠️ No products found in database');
        }
        setLiveProducts(productsData || []);
      }

      // Use regular supabase client with proper RLS policies
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, phone, address, role, is_admin, is_driver, is_verified, created_at, updated_at')
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.error('❌ Failed to fetch users:', usersError);
        setLiveCustomers([]);
      } else {
        console.log('👥 Users loaded from database:', usersData?.length || 0);
        setLiveCustomers(usersData || []);
      }

      // Fetch drivers
      const { data: driversData, error: driversError } = await supabaseService
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (driversError) {
        console.error('❌ Failed to fetch drivers:', driversError);
      } else {
        console.log('🚗 Drivers loaded:', driversData?.length || 0);
        setLiveDrivers(driversData || []);
      }

    } catch (error) {
      console.error('Failed to fetch live data:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Smart refresh function that only updates orders without affecting map
  const refreshOrdersOnly = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('🔄 Smart refresh: Updating orders only...');
      
      // Only fetch orders, not drivers (to avoid map reset)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) {
        console.error('❌ Smart refresh failed to fetch orders:', ordersError);
      } else {
        console.log('📋 Smart refresh: Orders updated:', ordersData?.length || 0);
        setLiveOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Smart refresh error:', error);
    }
  }, [isAuthenticated]);

  // Smart driver location refresh that updates locations without affecting map view
  const refreshDriverLocationsOnly = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('📍 Smart refresh: Updating driver locations only...');
      
      // Only fetch driver locations, not full data (to avoid map reset)
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('id, name, current_location, location_updated_at, is_online, is_available')
        .eq('is_online', true)
        .order('location_updated_at', { ascending: false });
      
      if (driversError) {
        console.error('❌ Smart refresh failed to fetch driver locations:', driversError);
      } else {
        console.log('📍 Smart refresh: Driver locations updated:', driversData?.length || 0);
        
        // Update only location data in existing drivers without resetting map
        setLiveDrivers(prev => {
          return prev.map(existingDriver => {
            const updatedDriver = driversData?.find(d => d.id === existingDriver.id);
            if (updatedDriver) {
              return {
                ...existingDriver,
                current_location: updatedDriver.current_location,
                location_updated_at: updatedDriver.location_updated_at,
                is_online: updatedDriver.is_online,
                is_available: updatedDriver.is_available
              };
            }
            return existingDriver;
          });
        });
      }
    } catch (error) {
      console.error('Smart driver location refresh error:', error);
    }
  }, [isAuthenticated]);

  // Auto-assign drivers to unassigned orders
  const autoAssignDrivers = useCallback(async () => {
    try {
      console.log('🤖 Auto-assigning drivers to unassigned orders...');
      
      // Get unassigned orders
      const unassignedOrders = liveOrders.filter(order => !order.driver_id);
      
      if (unassignedOrders.length === 0) {
        alert('No unassigned orders to assign drivers to.');
        return;
      }
      
      // Get available drivers
      const availableDrivers = liveDrivers.filter(driver => 
        driver.is_online && driver.is_available && driver.is_approved
      );
      
      if (availableDrivers.length === 0) {
        alert('No drivers available online. Drivers must be online and available to be assigned.');
        return;
      }
      
      console.log(`📋 Found ${unassignedOrders.length} unassigned orders and ${availableDrivers.length} available drivers`);
      
      // Assign drivers to orders
      let assignedCount = 0;
      for (let i = 0; i < unassignedOrders.length; i++) {
        const order = unassignedOrders[i];
        const driver = availableDrivers[i % availableDrivers.length]; // Round-robin assignment
        
        console.log(`🔄 Assigning ${driver.name} to order ${order.order_id || order.id}...`);
        
        const { error } = await supabase
          .from('orders')
          .update({ 
            driver_id: driver.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);
        
        if (error) {
          console.error(`❌ Failed to assign driver to order ${order.id}:`, error);
        } else {
          console.log(`✅ Successfully assigned ${driver.name} to order ${order.order_id || order.id}`);
          assignedCount++;
        }
      }
      
      // Refresh data
      await fetchLiveData();
      
      alert(`Auto-assigned ${assignedCount} orders to drivers successfully!`);
      
    } catch (error) {
      console.error('Error auto-assigning drivers:', error);
      alert('Failed to auto-assign drivers. Please try again.');
    }
  }, [liveOrders, liveDrivers, fetchLiveData]);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔍 Authenticated - loading data...');
      fetchLiveData();
    }
  }, [isAuthenticated, fetchLiveData]);

  // Load data when navigating to customers tab
  useEffect(() => {
    if (isAuthenticated && currentView === 'customers') {
      console.log('🔍 Navigating to customers tab - fetching users...');
      fetchLiveData();
    }
  }, [isAuthenticated, currentView, fetchLiveData]);





  // Smart periodic refresh for order management dashboard (doesn't affect map)
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('🔄 Setting up smart periodic refresh for order management...');
    
    // Smart refresh orders every 10 seconds without affecting map view
    const orderRefreshInterval = setInterval(() => {
      console.log('🔄 Smart periodic order refresh triggered...');
      refreshOrdersOnly(); // Only updates orders, not drivers/map
    }, 10000); // Every 10 seconds

    // Cleanup interval on unmount
    return () => {
      console.log('🔄 Cleaning up smart periodic order refresh...');
      clearInterval(orderRefreshInterval);
    };
  }, [isAuthenticated, refreshOrdersOnly]);

  // Smart periodic refresh for driver locations (doesn't affect map view)
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('📍 Setting up smart periodic driver location refresh...');
    
    // Smart refresh driver locations every 15 seconds without affecting map view
    const driverLocationRefreshInterval = setInterval(() => {
      console.log('📍 Smart periodic driver location refresh triggered...');
      refreshDriverLocationsOnly(); // Only updates driver locations, not map view
    }, 15000); // Every 15 seconds

    // Cleanup interval on unmount
    return () => {
      console.log('📍 Cleaning up smart periodic driver location refresh...');
      clearInterval(driverLocationRefreshInterval);
    };
  }, [isAuthenticated, refreshDriverLocationsOnly]);

  // Production Live Tracking & Dispatch System
  const startLiveTracking = useCallback(() => {
    console.log('🚀 Starting Production Live Tracking & Dispatch System...');
    setLiveTrackingEnabled(true);
    
    // Initialize real-time tracking for all online drivers
    liveDrivers.forEach(driver => {
      if (driver.is_online) {
        console.log(`📍 Initializing live tracking for driver: ${driver.name}`);
      }
    });
    
    console.log('✅ Production Live Tracking & Dispatch System Active');
  }, [liveDrivers]);

  const stopLiveTracking = useCallback(() => {
    console.log('🛑 Stopping Production Live Tracking & Dispatch System...');
    setLiveTrackingEnabled(false);
    console.log('✅ Production Live Tracking & Dispatch System Stopped');
  }, []);

  // Real-time driver dispatch system
  const dispatchOrderToDriver = useCallback(async (orderId: string, driverId: string) => {
    try {
      console.log(`🚚 Dispatching order ${orderId} to driver ${driverId}...`);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          driver_id: driverId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Dispatch failed:', error);
        return false;
      }

      console.log('✅ Order dispatched successfully');
      
      // Add to dispatch queue for tracking
      setDispatchQueue(prev => [...prev, {
        orderId,
        driverId,
        timestamp: new Date().toISOString(),
        status: 'dispatched'
      }]);

      return true;
    } catch (error) {
      console.error('❌ Dispatch error:', error);
      return false;
    }
  }, []);

  // Emergency alert system
  const createEmergencyAlert = useCallback((driverId: string, alertType: string, message: string) => {
    const alert = {
      id: Date.now(),
      driverId,
      alertType,
      message,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    setEmergencyAlerts(prev => [alert, ...prev]);
    console.log(`🚨 Emergency Alert: ${alertType} - ${message}`);
  }, []);

  // Driver performance tracking
  const updateDriverPerformance = useCallback((driverId: string, metrics: any) => {
    setDriverPerformance(prev => {
      const existing = prev.find(p => p.driverId === driverId);
      if (existing) {
        return prev.map(p => p.driverId === driverId ? { ...p, ...metrics } : p);
      } else {
        return [...prev, { driverId, ...metrics, timestamp: new Date().toISOString() }];
      }
    });
  }, []);

  // Mapbox Optimization Functions
  const handleRouteOptimized = useCallback((routes: OptimizedRoute[]) => {
    setOptimizedRoutes(routes);
    console.log('✅ Routes optimized:', routes.length, 'routes');
  }, []);

  const handleDriverSelected = useCallback((driverId: string) => {
    setSelectedDriverForTracking(driverId);
    console.log('👤 Driver selected for tracking:', driverId);
  }, []);

  const handleDeliverySelected = useCallback((deliveryId: string) => {
    setSelectedDeliveryForTracking(deliveryId);
    console.log('📦 Delivery selected for tracking:', deliveryId);
  }, []);

  // Convert live data to optimization format
  const getOptimizationData = useCallback(() => {
    const driverLocations: DriverLocation[] = liveDrivers
      .filter(driver => driver.is_online)
      .map(driver => {
        // Use real GPS coordinates or default to Austin
        let lat = 30.2672; // Austin default
        let lng = -97.7431; // Austin default
        
        if (driver.latest_lat && driver.latest_lng && 
            driver.latest_lat !== 0 && driver.latest_lng !== 0) {
          lat = driver.latest_lat;
          lng = driver.latest_lng;
        } else if (driver.current_location && 
            typeof driver.current_location === 'object' && 
            driver.current_location.lat && 
            driver.current_location.lng) {
          lat = driver.current_location.lat;
          lng = driver.current_location.lng;
        }
        
        return {
          id: driver.id,
          name: driver.name || 'Unknown Driver',
          lat: lat,
          lng: lng,
          isOnline: driver.is_online,
          isAvailable: driver.is_available,
          currentOrder: liveOrders.find(order => order.driver_id === driver.id)?.order_id
        };
      });

    const deliveryLocations: DeliveryLocation[] = liveOrders
      .filter(order => order.status === 'pending' || order.status === 'confirmed')
      .map(order => {
        // Use order address to get coordinates or default to Austin
        let lat = 30.2672; // Austin default
        let lng = -97.7431; // Austin default
        
        // For now, use default coordinates - in production this would geocode the address
        return {
          id: order.id,
          address: order.address || 'Unknown Address',
          lat: lat,
          lng: lng,
          priority: 'normal',
          estimatedTime: order.estimated_delivery_time
        };
      });

    console.log('🗺️ getOptimizationData - driverLocations:', driverLocations.length);
    console.log('🗺️ getOptimizationData - deliveryLocations:', deliveryLocations.length);
    
    return { driverLocations, deliveryLocations };
  }, [liveDrivers, liveOrders]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('🔌 Setting up real-time subscriptions...');

    // Start Live Tracking & Dispatch system automatically
    if (liveTrackingEnabled) {
      startLiveTracking();
    }

    // Enhanced real-time subscriptions for instant updates
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('📦 Products change detected:', payload);
          // Immediate update for products
          if (payload.eventType === 'UPDATE' && payload.new) {
            setLiveProducts(prev => 
              prev.map(product => 
                product.id === payload.new.id ? payload.new : product
              )
            );
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setLiveProducts(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setLiveProducts(prev => prev.filter(product => product.id !== payload.old.id));
          }
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('📋 REAL-TIME ORDER UPDATE DETECTED:', payload);
          console.log('📋 Event type:', payload.eventType);
          console.log('📋 Current liveOrders before update:', liveOrders.length);
          
          // Immediate update for orders with enhanced logging
          if (payload.eventType === 'UPDATE' && payload.new) {
            console.log('📋 ORDER STATUS UPDATE:', {
              orderId: payload.new.id,
              oldStatus: payload.old?.status,
              newStatus: payload.new.status,
              driverId: payload.new.driver_id,
              timestamp: new Date().toISOString()
            });
            
            setLiveOrders(prev => {
              const updated = prev.map(order => 
                order.id === payload.new.id ? payload.new : order
              );
              console.log('📋 Order management dashboard updated:', updated.length, 'orders');
              return updated;
            });
            
            // Update selected order if it's the one being modified
            if (selectedOrder && selectedOrder.id === payload.new.id) {
              console.log('📋 Updating selected order in modal:', payload.new);
              setSelectedOrder(payload.new);
            }
            
            // Show notification for important status changes
            if (payload.new.status === 'delivered') {
              console.log('🎉 ORDER DELIVERED! Order ID:', payload.new.id);
              // Update driver performance metrics
              if (payload.new.driver_id) {
                updateDriverPerformance(payload.new.driver_id, {
                  completedOrders: 1,
                  lastDelivery: new Date().toISOString()
                });
              }
            } else if (payload.new.status === 'in_transit') {
              console.log('🚚 ORDER IN TRANSIT! Order ID:', payload.new.id);
              // Create dispatch alert
              if (payload.new.driver_id) {
                const driver = liveDrivers.find(d => d.id === payload.new.driver_id);
                if (driver) {
                  createEmergencyAlert(
                    payload.new.driver_id,
                    'Order In Transit',
                    `Driver ${driver.name} is now en route with order ${payload.new.order_id}`
                  );
                }
              }
            } else if (payload.new.status === 'picked_up') {
              console.log('📦 ORDER PICKED UP! Order ID:', payload.new.id);
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            console.log('📋 NEW ORDER CREATED:', payload.new);
            setLiveOrders(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            console.log('📋 ORDER DELETED:', payload.old.id);
            setLiveOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'drivers' },
        (payload) => {
          console.log('🚚 Drivers change detected:', payload);
          console.log('🚚 Current liveDrivers before update:', liveDrivers.length);
          
          // Immediate update for drivers
          if (payload.eventType === 'UPDATE' && payload.new) {
            console.log('🚚 Updating driver:', payload.new.id, 'online:', payload.new.is_online, 'available:', payload.new.is_available);
            
            // Check for driver going offline unexpectedly
            if (payload.old?.is_online && !payload.new.is_online) {
              console.log('🚨 DRIVER WENT OFFLINE:', payload.new.name);
              createEmergencyAlert(
                payload.new.id,
                'Driver Offline',
                `Driver ${payload.new.name} went offline unexpectedly`
              );
            }
            
            // Monitor driver location updates
            if (payload.new.current_location && payload.old?.current_location) {
              const oldLocation = payload.old.current_location;
              const newLocation = payload.new.current_location;
              
              // Check for unusual movement patterns (simple distance check)
              if (oldLocation.lat && oldLocation.lng && newLocation.lat && newLocation.lng) {
                const distance = Math.sqrt(
                  Math.pow(newLocation.lat - oldLocation.lat, 2) + 
                  Math.pow(newLocation.lng - oldLocation.lng, 2)
                );
                
                // Alert if driver moved more than 0.1 degrees (roughly 11km) in a short time
                if (distance > 0.1) {
                  console.log('🚨 UNUSUAL DRIVER MOVEMENT:', payload.new.name, 'distance:', distance);
                  createEmergencyAlert(
                    payload.new.id,
                    'Unusual Movement',
                    `Driver ${payload.new.name} moved ${distance.toFixed(3)} degrees in a short time`
                  );
                }
              }
            }
            
            setLiveDrivers(prev => {
              const updated = prev.map(driver => 
                driver.id === payload.new.id ? payload.new : driver
              );
              console.log('🚚 Updated liveDrivers:', updated.length);
              console.log('🚚 Online drivers after update:', updated.filter(d => d.is_online).length);
              return updated;
            });
          } else if (payload.eventType === 'INSERT' && payload.new) {
            console.log('🚚 Adding new driver:', payload.new);
            setLiveDrivers(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            console.log('🚚 Removing driver:', payload.old.id);
            setLiveDrivers(prev => prev.filter(driver => driver.id !== payload.old.id));
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'driver_locations' },
        (payload) => {
          console.log('📍 Real-time location update:', payload);
          const newLocation = payload.new;
          
          // Update driver's current location in live drivers
          setLiveDrivers(prev => {
            const existingIndex = prev.findIndex(d => d.id === newLocation.driver_id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                current_location: {
                  lat: newLocation.lat,
                  lng: newLocation.lng
                },
                location_updated_at: newLocation.location_timestamp
              };
              console.log('📍 Updated driver location:', updated[existingIndex].name, 'at', newLocation.lat, newLocation.lng);
              return updated;
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log('🔌 Enhanced real-time subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, selectedOrder, liveOrders]);

  // Driver approval functions
  const approveDriver = useCallback(async (driverId: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          is_approved: true, 
          approved_at: new Date().toISOString(),
          approved_by: adminUser.id || null
        })
        .eq('id', driverId);

      if (error) {
        console.error('Failed to approve driver:', error);
        return;
      }

      console.log('Driver approved successfully');
      await fetchLiveData(); // Refresh data
    } catch (error) {
      console.error('Error approving driver:', error);
    }
  }, [adminUser.id, fetchLiveData]);

  const rejectDriver = useCallback(async (driverId: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          is_approved: false, 
          approved_at: null,
          approved_by: null
        })
        .eq('id', driverId);

      if (error) {
        console.error('Failed to reject driver:', error);
        return;
      }

      console.log('Driver rejected successfully');
      await fetchLiveData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting driver:', error);
    }
  }, [fetchLiveData]);

  // Dedicated function to refresh driver data
  const refreshDriverData = useCallback(async () => {
    try {
      console.log('🔄 Manually refreshing driver data...');
      setLoading(true);
      
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (driversError) {
        console.error('❌ Failed to refresh drivers:', driversError);
      } else {
        console.log('🚚 Drivers refreshed:', driversData?.length || 0);
        console.log('🚚 Online drivers:', driversData?.filter(d => d.is_online).length || 0);
        console.log('🚚 Available drivers:', driversData?.filter(d => d.is_available).length || 0);
        setLiveDrivers(driversData || []);
      }
    } catch (error) {
      console.error('Error refreshing driver data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const closeAllModals = () => {
    setModals({
      addProduct: false,
      editProduct: false,
      orderDetails: false,
      customerDetails: false,
      driverDetails: false,
      editDriver: false,
      userManagement: false,
      confirmDelete: false
    });
    setSelectedProduct(null);
    setSelectedOrder(null);
    setSelectedCustomer(null);
    setSelectedDriver(null);
    
    setDeleteTarget({ type: '', id: null, name: '' });
  };

  // Handle keyboard events for modals
  useEffect(() => {
    const handleKeyDown = (event: any) => {
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

  // Live data state - no more mock data

  // Base Modal Component
  const Modal = ({ isOpen, onClose, title, children, size = 'md' }: any) => {
    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl'
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

          <div className={`inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size as keyof typeof sizeClasses]} sm:w-full sm:p-6`}>
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

  // Add/Edit Product Modal
  const ProductModal = () => {
    const isEdit = modals.editProduct;
    const [formData, setFormData] = useState({
      name: '',
      category: 'Flower',
      price: '',
      stock: '',
      thc: '',
      cbd: '',
      supplier: '',
      description: '',
      image: null as File | null,
      featured: false,
      status: 'active'
    });

    // Update form data when selectedProduct changes
    useEffect(() => {
      if (selectedProduct && isEdit) {
        console.log('🔄 Updating form data for edit:', selectedProduct);
        setFormData({
          name: selectedProduct.name || '',
          category: selectedProduct.category || 'Flower',
          price: selectedProduct.price?.toString() || '',
          stock: selectedProduct.stock?.toString() || '',
          thc: selectedProduct.thc || '',
          cbd: selectedProduct.cbd || '',
          supplier: selectedProduct.supplier || '',
          description: selectedProduct.description || '',
          image: null,
          featured: selectedProduct.featured || false,
          status: selectedProduct.status || 'active'
        });
      } else if (!isEdit) {
        // Reset form for new product
        console.log('🔄 Resetting form data for new product');
        setFormData({
          name: '',
          category: 'Flower',
          price: '',
          stock: '',
          thc: '',
          cbd: '',
          supplier: '',
          description: '',
          image: null,
          featured: false,
          status: 'active'
        });
      }
    }, [selectedProduct, isEdit]);

    const handleSubmit = async (e: any) => {
      e.preventDefault();
      
      try {
        let imageUrl = selectedProduct?.image_url || null;
        
        // Upload image if provided
        if (formData.image) {
          console.log('Starting image upload...', formData.image.name);
          
          // Delete old image if it exists
          if (isEdit && selectedProduct?.image_url) {
            try {
              console.log('🗑️  Deleting old image:', selectedProduct.image_url);
              const oldImagePath = selectedProduct.image_url.split('/').pop();
              if (oldImagePath) {
                const { error: deleteError } = await supabaseService.storage
                  .from('product-images')
                  .remove([oldImagePath]);
                
                if (deleteError) {
                  console.log('⚠️  Could not delete old image:', deleteError.message);
                } else {
                  console.log('✅ Old image deleted successfully');
                }
              }
            } catch (error) {
              console.log('⚠️  Error deleting old image:', error);
            }
          }
          
          const fileExt = formData.image.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabaseService.storage
            .from('product-images')
            .upload(fileName, formData.image);
          
          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            alert(`Failed to upload image: ${uploadError.message}. Please try again.`);
            return;
          }
          
          console.log('Image uploaded successfully, getting public URL...');
          
          // Get public URL
          const { data: urlData } = supabaseService.storage
            .from('product-images')
            .getPublicUrl(fileName);
          
          imageUrl = urlData.publicUrl;
          console.log('Image URL:', imageUrl);
        }
        
        const productData: any = {
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          thc: formData.thc,
          cbd: formData.cbd,
          supplier: formData.supplier,
          description: formData.description,
          image_url: imageUrl,
          featured: formData.featured,
          status: formData.status,
          updated_at: new Date().toISOString()
        };
        
        // Only add created_at for new products
        if (!isEdit) {
          productData.created_at = new Date().toISOString();
        }
        
        if (isEdit && selectedProduct) {
          // Update existing product
          console.log('🔄 Updating product with ID:', selectedProduct.id);
          console.log('📝 Form data being submitted:', formData);
          console.log('📦 Update data:', productData);
          
          const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', selectedProduct.id)
            .select();
          
          if (error) {
            console.error('❌ Error updating product:', error);
            console.error('❌ Error details:', error.message, error.details, error.hint);
            alert(`Failed to update product: ${error.message}. Please try again.`);
            return;
          }
          
          console.log('✅ Product updated successfully:', data);
        } else {
          // Create new product
          console.log('Creating new product with data:', productData);
          
          const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select();
          
          if (error) {
            console.error('Error creating product:', error);
            console.error('Error details:', error.message, error.details, error.hint);
            alert(`Failed to create product: ${error.message}. Please try again.`);
            return;
          }
          
          console.log('Product created successfully:', data);
        }
        
        // Close modal and show success message
        closeModal(isEdit ? 'editProduct' : 'addProduct');
        alert(isEdit ? 'Product updated successfully!' : 'Product created successfully!');
        
        // Force refresh data immediately
        console.log('🔄 Forcing data refresh after product operation...');
        
        // Force immediate refresh
        await fetchLiveData();
        
        // Additional refresh after a short delay to ensure data is loaded
        setTimeout(() => {
          console.log('🔄 Additional refresh to ensure data is loaded...');
          fetchLiveData();
        }, 1000);
        
      } catch (error) {
        console.error('Error handling product submission:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`An error occurred: ${errorMessage}. Please try again.`);
      }
    };

    const handleChange = (field: any, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <Modal
        isOpen={modals.addProduct || modals.editProduct}
        onClose={() => closeModal(isEdit ? 'editProduct' : 'addProduct')}
        title={isEdit ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Flower">Flower</option>
                <option value="Edibles">Edibles</option>
                <option value="Concentrates">Concentrates</option>
                <option value="Pre-rolls">Pre-rolls</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">THC Content</label>
              <input
                type="text"
                value={formData.thc}
                onChange={(e) => handleChange('thc', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., 18% or 10mg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">CBD Content</label>
              <input
                type="text"
                value={formData.cbd}
                onChange={(e) => handleChange('cbd', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., 2% or 0mg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => handleChange('supplier', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Supplier name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Product description..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
            {formData.image ? (
              <div className="mt-1">
                <div className="flex items-center space-x-4 p-4 border-2 border-emerald-200 bg-emerald-50 rounded-xl">
                  <img
                    src={URL.createObjectURL(formData.image)}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{formData.image.name}</p>
                    <p className="text-xs text-gray-500">
                      {(formData.image.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('image', null)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-emerald-600">✅ Image selected and ready to upload</p>
              </div>
            ) : (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-emerald-400 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="product-image"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="product-image"
                        name="product-image"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('Image selected:', file.name, file.size);
                            
                            // Check file size (50MB limit)
                            const maxSize = 50 * 1024 * 1024; // 50MB in bytes
                            if (file.size > maxSize) {
                              alert(`File too large. Maximum size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
                              e.target.value = ''; // Clear the input
                              return;
                            }
                            
                            handleChange('image', file);
                          }
                        }}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 50MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => handleChange('featured', e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                Featured Product
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => closeModal(isEdit ? 'editProduct' : 'addProduct')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              {isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  // Order Details Modal
  const OrderDetailsModal = () => {
    const [orderStatus, setOrderStatus] = useState(selectedOrder?.status || 'pending');
    const [isUpdating, setIsUpdating] = useState(false);

    const updateOrderStatus = async (newStatus: string) => {
      if (!selectedOrder?.id) return;
      
      setIsUpdating(true);
      try {
        console.log('🔄 Updating order status:', selectedOrder.id, 'to', newStatus);
        console.log('🔄 Current order data:', selectedOrder);
        
        const { data, error } = await supabase
          .from('orders')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedOrder.id)
          .select()
          .single();

        if (error) {
          console.error('Failed to update order status:', error);
          alert('Failed to update order status. Please try again.');
        } else {
          console.log('✅ Order status updated successfully:', data);
          
          // Update local state immediately
          setOrderStatus(newStatus);
          setSelectedOrder(data);
          
          // Handle cancellation - remove from admin view but keep in database
          if (newStatus === 'cancelled') {
            // Remove from live orders list (admin won't see it anymore)
            setLiveOrders(prev => 
              prev.filter(order => order.id !== selectedOrder.id)
            );
            
            // Close the modal
            closeModal('orderDetails');
            
            // Show cancellation message
            alert(`Order ${selectedOrder.order_id || selectedOrder.id} has been cancelled. The customer will be notified.`);
          } else {
            // Update the orders list for other status changes
            setLiveOrders(prev => 
              prev.map(order => 
                order.id === selectedOrder.id 
                  ? data
                  : order
              )
            );
            
            // Show success message
            alert(`Order status updated to: ${newStatus}`);
          }
        }
      } catch (error) {
        console.error('Failed to update order status:', error);
        alert('Failed to update order status. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    };

    const assignDriverToOrder = async (driverId: string) => {
      if (!selectedOrder?.id) return;
      
      setIsUpdating(true);
      try {
        console.log('🔄 Assigning driver:', driverId, 'to order:', selectedOrder.id);
        
        const { data, error } = await supabase
          .from('orders')
          .update({ 
            driver_id: driverId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedOrder.id)
          .select()
          .single();

        if (error) {
          console.error('Failed to assign driver to order:', error);
          alert('Failed to assign driver to order. Please try again.');
        } else {
          console.log('✅ Driver assigned successfully:', data);
          
          // Update local state immediately
          setSelectedOrder(data);
          
          // Update the orders list immediately
          setLiveOrders(prev => 
            prev.map(order => 
              order.id === selectedOrder.id 
                ? data
                : order
            )
          );
          
          // Show success message
          if (driverId) {
            const assignedDriver = liveDrivers.find(d => d.id === driverId);
            alert(`Driver ${assignedDriver?.name || 'Unknown'} assigned to order successfully!`);
          } else {
            alert('Driver assignment removed from order.');
          }
        }
      } catch (error) {
        console.error('Failed to assign driver to order:', error);
        alert('Failed to assign driver to order. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    };

    // Safety check - if selectedOrder is null, show error
    if (!selectedOrder) {
      console.error('❌ selectedOrder is null - this should not happen');
      return (
        <Modal
          isOpen={modals.orderDetails}
          onClose={() => closeModal('orderDetails')}
          title="Order Details - Error"
          size="lg"
        >
          <div className="p-6 text-center">
            <p className="text-red-600 font-semibold">Error: No order selected</p>
            <p className="text-gray-600 mt-2">Please try selecting an order again.</p>
            <button 
              onClick={() => closeModal('orderDetails')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </Modal>
      );
    }

    // Find customer details from liveCustomers with better debugging and fallback
    const customerDetails = selectedOrder.user_id ? 
      liveCustomers.find(customer => customer.id === selectedOrder.user_id) : null;
    
    console.log('🔍 Customer lookup for order:', selectedOrder.user_id);
    console.log('🔍 Available customers:', liveCustomers.length);
    console.log('🔍 Found customer:', customerDetails);
    console.log('🔍 Order user_id:', selectedOrder.user_id);
    console.log('🔍 Order data:', selectedOrder);
    
    // If user_id is undefined, try to find customer by email or other fields
    const fallbackCustomer = !customerDetails ? 
      liveCustomers.find(customer => 
        customer.email === selectedOrder.customer_email ||
        customer.name === selectedOrder.customer_name ||
        customer.phone === selectedOrder.customer_phone
      ) : null;
    
    const finalCustomerDetails = customerDetails || fallbackCustomer;



    return (
      <Modal
        isOpen={modals.orderDetails}
        onClose={() => closeModal('orderDetails')}
        title={`Order Details - ${selectedOrder.order_id || selectedOrder.id}`}
        size="lg"
      >
        <div className="space-y-6">
          <div className="space-y-6">
            {/* Order Status Update */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-lg font-bold text-blue-800 mb-3">Order Status Management</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-semibold text-blue-700">Current Status:</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedOrder?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    selectedOrder?.status === 'en-route' ? 'bg-blue-100 text-blue-800' :
                    selectedOrder?.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                    selectedOrder?.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                    selectedOrder?.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedOrder?.status || 'pending'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-semibold text-blue-700">Change to:</label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    disabled={isUpdating}
                    className="px-4 py-2 border border-blue-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready for Pickup</option>
                    <option value="en-route">En Route</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3 pt-2">
                  <button 
                    onClick={() => updateOrderStatus(orderStatus)}
                    disabled={isUpdating || orderStatus === selectedOrder?.status}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Status Change</span>
                      </>
                    )}
                  </button>
                  {orderStatus !== selectedOrder?.status && (
                    <span className="text-sm text-emerald-600 font-semibold">
                      Status will change from "{selectedOrder?.status}" to "{orderStatus}"
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Customer Details</span>
                </h4>
                <div className="space-y-2">
                  <p><span className="font-semibold">Name:</span> {selectedOrder?.customer_name || finalCustomerDetails?.name || finalCustomerDetails?.email || 'N/A'}</p>
                  <p><span className="font-semibold">Email:</span> {finalCustomerDetails?.email || selectedOrder?.customer_email || 'N/A'}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedOrder?.customer_phone || finalCustomerDetails?.phone || 'N/A'}</p>
                  <p><span className="font-semibold">Order Date:</span> {new Date(selectedOrder?.created_at).toLocaleString()}</p>
                  <p><span className="font-semibold">Address:</span> {selectedOrder?.address || finalCustomerDetails?.address || 'N/A'}</p>
                  <p><span className="font-semibold">User ID:</span> {selectedOrder?.user_id || 'N/A'}</p>
                  {!selectedOrder?.user_id && (
                    <p className="text-orange-600 text-sm font-semibold">⚠️ Order needs user_id migration</p>
                  )}
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Order Summary</span>
                </h4>
                <div className="space-y-2">
                  <p><span className="font-semibold">Order ID:</span> {selectedOrder?.order_id || selectedOrder?.id}</p>
                  <p><span className="font-semibold">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedOrder?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      selectedOrder?.status === 'en-route' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder?.status === 'ready' ? 'bg-purple-100 text-purple-800' :
                      selectedOrder?.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                      selectedOrder?.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedOrder?.status}
                    </span>
                  </p>
                  <p><span className="font-semibold">Total:</span> ${selectedOrder?.total?.toFixed(2) || '0.00'}</p>
                  <p><span className="font-semibold">Items:</span> {selectedOrder?.items?.length || 0} item(s)</p>
                  <p><span className="font-semibold">Driver:</span> {selectedOrder?.driver_id ? 'Assigned' : 'Not Assigned'}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-3">Order Items</h4>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrder?.items?.map((item: any, index: any) => (
                      <tr key={index}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-700">${item.price}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">${(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    )) || []}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Driver Assignment */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h4 className="text-lg font-bold text-purple-800 mb-3 flex items-center space-x-2">
                <Truck className="w-5 h-5" />
                <span>Driver Assignment</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-semibold text-purple-700">Current Driver:</label>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedOrder?.driver_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedOrder?.driver_id ? 'Assigned' : 'Not Assigned'}
                  </span>
                </div>
                
                {/* Available Drivers */}
                <div>
                  <label className="block text-sm font-semibold text-purple-700 mb-2">Assign to Driver:</label>
                  <select
                    value={selectedOrder?.driver_id || ''}
                    onChange={(e) => assignDriverToOrder(e.target.value)}
                    disabled={isUpdating}
                    className="w-full px-4 py-2 border border-purple-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                  >
                    <option value="">Select a driver...</option>
                    {liveDrivers
                      .filter(driver => driver.is_online && driver.is_available && driver.is_approved)
                      .map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.vehicle_make} {driver.vehicle_model} (Rating: {driver.rating})
                        </option>
                      ))}
                  </select>
                  {liveDrivers.filter(d => d.is_online && d.is_available && d.is_approved).length === 0 && (
                    <p className="text-sm text-red-600 mt-1">No drivers available online</p>
                  )}
                </div>
                
                {/* Driver Stats */}
                {selectedOrder?.driver_id && (
                  <div className="bg-white border border-purple-200 rounded-lg p-3">
                    <h5 className="font-semibold text-purple-800 mb-2">Assigned Driver Info:</h5>
                    {(() => {
                      const assignedDriver = liveDrivers.find(d => d.id === selectedOrder?.driver_id);
                      return assignedDriver ? (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><span className="font-semibold">Name:</span> {assignedDriver.name}</p>
                          <p><span className="font-semibold">Vehicle:</span> {assignedDriver.vehicle_make} {assignedDriver.vehicle_model}</p>
                          <p><span className="font-semibold">Rating:</span> ⭐ {assignedDriver.rating}</p>
                          <p><span className="font-semibold">Deliveries:</span> {assignedDriver.total_deliveries}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Driver information not available</p>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => closeModal('orderDetails')}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Print Order
              </button>
              <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                Contact Customer
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  // Customer Details Modal with real-time updates
  const CustomerDetailsModal = () => {
    const [customerData, setCustomerData] = useState({
      name: selectedCustomer?.name || '',
      email: selectedCustomer?.email || '',
      phone: selectedCustomer?.phone || '',
      address: selectedCustomer?.address || '',
      status: selectedCustomer?.status || 'pending'
    });

    // Update customer data when selectedCustomer changes
    useEffect(() => {
      if (selectedCustomer) {
        console.log('📞 Customer phone:', selectedCustomer.phone);
        setCustomerData({
          name: selectedCustomer.name || '',
          email: selectedCustomer.email || '',
          phone: selectedCustomer.phone || '',
          address: selectedCustomer.address || '',
          status: selectedCustomer.is_verified ? 'verified' : 'pending'
        });
      }
    }, [selectedCustomer]);

    // Calculate customer statistics
    const customerStats = useMemo(() => {
      if (!selectedCustomer) return { totalOrders: 0, totalSpent: 0, avgOrder: 0 };
      
      const userOrders = liveOrders.filter(order => order.user_id === selectedCustomer.id);
      const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const totalOrders = userOrders.length;
      const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;
      
      return { totalOrders, totalSpent, avgOrder };
    }, [selectedCustomer, liveOrders]);

    const handleSave = async () => {
      if (!selectedCustomer) return;
      
      try {
        console.log('🔄 Updating customer data:', customerData);
        
        // Update customer in database
        const { error: updateError } = await supabaseService
          .from('users')
          .update({
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
            is_verified: customerData.status === 'verified'
          })
          .eq('id', selectedCustomer.id);
        
        if (updateError) {
          console.error('❌ Failed to update customer:', updateError);
          alert('Failed to update customer. Please try again.');
          return;
        }
        
        console.log('✅ Customer updated successfully');
        closeModal('customerDetails');
      } catch (error) {
        console.error('❌ Error updating customer:', error);
        alert('Failed to update customer. Please try again.');
      }
    };

    return (
      <Modal
        isOpen={modals.customerDetails}
        onClose={() => closeModal('customerDetails')}
        title={`Customer Details - ${selectedCustomer?.name || 'Loading...'}`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Real-time Status Indicator */}
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live Updates Active</span>
              </div>
              <span className="text-xs text-green-600">Real-time data synchronization</span>
            </div>
            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <h4 className="text-lg font-bold text-blue-800">Total Orders</h4>
                <p className="text-2xl font-black text-blue-600">{customerStats.totalOrders}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <h4 className="text-lg font-bold text-green-800">Total Spent</h4>
                <p className="text-2xl font-black text-green-600">${customerStats.totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                <h4 className="text-lg font-bold text-purple-800">Avg Order</h4>
                <p className="text-2xl font-black text-purple-600">${customerStats.avgOrder.toFixed(2)}</p>
              </div>
            </div>

            {/* Customer Information Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Status</label>
                <select
                  value={customerData.status}
                  onChange={(e) => setCustomerData({...customerData, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="pending">Pending Verification</option>
                  <option value="verified">Verified</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
              <textarea
                value={customerData.address}
                onChange={(e) => setCustomerData({...customerData, address: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => closeModal('customerDetails')}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    );
  };

  // User Management Modal
  const UserManagementModal = () => {
    const [userData, setUserData] = useState({
      name: '',
      email: '',
      role: 'Support',
      permissions: {
        products: false,
        orders: false,
        customers: false,
        analytics: false,
        settings: false
      }
    });

    const handlePermissionChange = (permission: any) => {
      setUserData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permission]: !prev.permissions[permission as keyof typeof prev.permissions]
        }
      }));
    };

    const handleSave = () => {
      console.log('User data:', userData);
      closeModal('userManagement');
    };

    return (
      <Modal
        isOpen={modals.userManagement}
        onClose={() => closeModal('userManagement')}
        title="User Management"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({...userData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({...userData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">User Role</label>
            <select
              value={userData.role}
              onChange={(e) => setUserData({...userData, role: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Support">Support</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4">Permissions</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(userData.permissions).map(permission => (
                <div key={permission} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="font-medium text-gray-700 capitalize">{permission}</span>
                  <div className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                    userData.permissions[permission as keyof typeof userData.permissions] ? 'bg-emerald-600' : 'bg-gray-300'
                  }`} onClick={() => handlePermissionChange(permission)}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      userData.permissions[permission as keyof typeof userData.permissions] ? 'translate-x-7' : 'translate-x-1'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => closeModal('userManagement')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Save User
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Confirmation Modal
  const ConfirmationModal = () => {
    const handleConfirm = async () => {
      console.log(`🗑️  Deleting ${deleteTarget.type}:`, deleteTarget.id);
      
      try {
        if (deleteTarget.type === 'product') {
          // Find the product to get its image URL
          const product = liveProducts.find(p => p.id === deleteTarget.id);
          
          if (product?.image_url) {
            try {
              console.log('🗑️  Deleting product image:', product.image_url);
              const imagePath = product.image_url.split('/').pop();
              if (imagePath) {
                const { error: deleteImageError } = await supabaseService.storage
                  .from('product-images')
                  .remove([imagePath]);
                
                if (deleteImageError) {
                  console.log('⚠️  Could not delete product image:', deleteImageError.message);
                } else {
                  console.log('✅ Product image deleted successfully');
                }
              }
            } catch (error) {
              console.log('⚠️  Error deleting product image:', error);
            }
          }
          
          // Delete the product from database
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', deleteTarget.id);
          
          if (deleteError) {
            console.error('❌ Error deleting product:', deleteError);
            alert('Failed to delete product. Please try again.');
            return;
          }
          
          console.log('✅ Product deleted successfully');
          fetchLiveData(); // Refresh the data
        }
        
        closeModal('confirmDelete');
      } catch (error) {
        console.error('❌ Error in delete operation:', error);
        alert('An error occurred during deletion. Please try again.');
      }
    };

    return (
      <Modal
        isOpen={modals.confirmDelete}
        onClose={() => closeModal('confirmDelete')}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Are you sure?</h4>
              <p className="text-sm text-gray-600">
                This will permanently delete "{deleteTarget.name}". This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => closeModal('confirmDelete')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  const Sidebar = () => (
    <div className="w-64 bg-gradient-to-b from-emerald-900 to-green-900 text-white min-h-screen p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-black">FS</span>
          </div>
          <div>
            <h1 className="text-xl font-black">Faded Skies</h1>
            <p className="text-xs text-green-200">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {[
          { id: 'dashboard', icon: Home, label: 'Dashboard' },
          { id: 'products', icon: Package, label: 'Products' },
          { id: 'orders', icon: ShoppingCart, label: 'Orders' },
          { id: 'drivers', icon: Truck, label: 'Drivers' },
          { id: 'map', icon: MapPin, label: 'Live Tracking & Dispatch' },
          { id: 'customers', icon: Users, label: 'Users' },
          { id: 'analytics', icon: BarChart3, label: 'Analytics' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              currentView === item.id 
                ? 'bg-white/20 text-white shadow-lg' 
                : 'text-green-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-8">
        {/* Admin User Info */}
        <div className="mb-4 p-3 bg-white/10 rounded-xl">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-green-200" />
            <span className="text-sm text-green-200">{adminUser.name}</span>
          </div>
          <div className="text-xs text-green-300 mt-1">{adminUser.email}</div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-200 hover:text-red-100 hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">Total Orders</h3>
          <p className="text-3xl font-black text-blue-600">{loading ? '...' : liveOrders.length}</p>
          <p className="text-xs text-blue-600 mt-1">Live from Supabase</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Products</h3>
          <p className="text-3xl font-black text-green-600">{loading ? '...' : liveProducts.length}</p>
          <p className="text-xs text-green-600 mt-1">Available products</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-2">Revenue</h3>
          <p className="text-3xl font-black text-purple-600">
            ${loading ? '...' : liveOrders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
          </p>
          <p className="text-xs text-purple-600 mt-1">Total from orders</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-orange-800 mb-2">Customers</h3>
          <p className="text-3xl font-black text-orange-600">{loading ? '...' : liveCustomers.length}</p>
          <p className="text-xs text-orange-600 mt-1">Registered users</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading orders...</div>
            ) : liveOrders.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No orders yet</div>
            ) : (
              liveOrders.slice(0, 3).map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-gray-900">{order.order_id}</h4>
                    <p className="text-sm text-gray-600">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">${order.total}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Driver Status</h3>
          <div className="space-y-4">
            <div className="text-center py-4 text-gray-500">
              Driver management coming soon...
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProductsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <button
          onClick={() => openModal('addProduct')}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Image</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">THC/CBD</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : liveProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No products found. Add your first product!
                  </td>
                </tr>
              ) : (
                liveProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No img</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.supplier}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{product.category}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${product.price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      product.stock > 50 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{product.thc} / {product.cbd}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal('editProduct', product)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal('confirmDelete', { type: 'product', id: product.id, name: product.name })}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Delete Product"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const OrdersView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">Live Updates Active</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchLiveData}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Now</span>
          </button>
          <button
            onClick={autoAssignDrivers}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Truck className="w-4 h-4" />
            <span>Auto-Assign Drivers</span>
          </button>
          <button 
            onClick={async () => {
              try {
                console.log('🧪 Creating test order...');
                const { data, error } = await supabase
                  .from('orders')
                  .insert([{
                    user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
                    order_id: `TEST-${Date.now()}`,
                    customer_name: 'Test Customer',
                    customer_phone: '555-1234',
                    address: '123 Test St, Austin, TX',
                    delivery_lat: 30.2849, // Austin coordinates
                    delivery_lng: -97.7341,
                    items: [
                      { name: 'Test Product', quantity: 1, price: 25.00 }
                    ],
                    total: 25.00,
                    status: 'pending',
                    tip: 5.00 // Add tip for testing
                  }])
                  .select()
                  .single();

                if (error) {
                  console.error('Failed to create test order:', error);
                  alert('Failed to create test order: ' + error.message);
                } else {
                  console.log('✅ Test order created:', data);
                  alert('Test order created successfully!');
                  fetchLiveData(); // Refresh the data
                }
              } catch (error) {
                console.error('Error creating test order:', error);
                alert('Error creating test order');
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Create Test Order (Austin)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Driver</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : liveOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                liveOrders.map(order => {
                  // Find customer details
                  const customerDetails = liveCustomers.find(customer => customer.id === order.user_id);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-blue-600">{order.order_id || order.id}</div>
                        <div className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{order.customer_name || customerDetails?.user_metadata?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{order.address || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">${order.total?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'picked_up' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'ready' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'accepted' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live Status Updates Active"></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.updated_at ? `Updated: ${new Date(order.updated_at).toLocaleTimeString()}` : 'No updates'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {order.driver_id ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Assigned
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                          Unassigned
                        </span>
                      )}
                      <select
                        value={order.driver_id || ''}
                        onChange={async (e) => {
                          const driverId = e.target.value;
                          console.log('🔄 Quick driver assignment:', order.id, '→', driverId);
                          
                          try {
                            const { data, error } = await supabase
                              .from('orders')
                              .update({ 
                                driver_id: driverId || null,
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', order.id)
                              .select()
                              .single();

                            if (error) {
                              console.error('Failed to assign driver:', error);
                              alert('Failed to assign driver. Please try again.');
                            } else {
                              console.log('✅ Quick driver assignment successful:', data);
                              // Update local state immediately
                              setLiveOrders(prev => 
                                prev.map(o => 
                                  o.id === order.id 
                                    ? data
                                    : o
                                )
                              );
                              
                              if (driverId) {
                                const assignedDriver = liveDrivers.find(d => d.id === driverId);
                                alert(`Driver ${assignedDriver?.name || 'Unknown'} assigned!`);
                              } else {
                                alert('Driver assignment removed.');
                              }
                            }
                          } catch (error) {
                            console.error('Quick driver assignment failed:', error);
                            alert('Failed to assign driver. Please try again.');
                          }
                        }}
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50"
                        title="Quick Driver Assignment"
                      >
                        <option value="">Select Driver</option>
                        {liveDrivers
                          .filter(driver => driver.is_online && driver.is_available && driver.is_approved)
                          .map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal('orderDetails', order)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal('orderDetails', order)}
                        className="text-green-600 hover:text-green-700 p-1"
                        title="Update Order Status"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <select
                        value={order.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          console.log('🔄 Quick status update:', order.id, '→', newStatus);
                          
                          try {
                            const { data, error } = await supabase
                              .from('orders')
                              .update({ 
                                status: newStatus,
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', order.id)
                              .select()
                              .single();

                            if (error) {
                              console.error('Failed to update order status:', error);
                              alert('Failed to update order status. Please try again.');
                            } else {
                              console.log('✅ Quick status update successful:', data);
                              // Update local state immediately
                              setLiveOrders(prev => 
                                prev.map(o => 
                                  o.id === order.id 
                                    ? data
                                    : o
                                )
                              );
                            }
                          } catch (error) {
                            console.error('Quick status update failed:', error);
                            alert('Failed to update order status. Please try again.');
                          }
                        }}
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50"
                        title="Quick Status Update"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="en-route">En Route</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              )
            })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );



  const DriversView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshDriverData}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Drivers</span>
          </button>
          <div className="text-sm text-gray-600">
            Online: {liveDrivers.filter(d => d.is_online).length} | Available: {liveDrivers.filter(d => d.is_available).length}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">Total Drivers</h3>
          <p className="text-3xl font-black text-blue-600">{loading ? '...' : liveDrivers.length}</p>
          <p className="text-xs text-blue-600 mt-1">Registered drivers</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Online Drivers</h3>
          <p className="text-3xl font-black text-green-600">
            {loading ? '...' : liveDrivers.filter(driver => driver.is_online).length}
          </p>
          <p className="text-xs text-green-600 mt-1">Currently active</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-2">Available Drivers</h3>
          <p className="text-3xl font-black text-purple-600">
            {loading ? '...' : liveDrivers.filter(driver => driver.is_available).length}
          </p>
          <p className="text-xs text-purple-600 mt-1">Ready for orders</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-orange-800 mb-2">Avg Rating</h3>
          <p className="text-3xl font-black text-orange-600">
            {loading ? '...' : liveDrivers.length > 0 
              ? (liveDrivers.reduce((sum, driver) => sum + (driver.rating || 5.0), 0) / liveDrivers.length).toFixed(1)
              : '5.0'
            }
          </p>
          <p className="text-xs text-orange-600 mt-1">Driver satisfaction</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Pending Approval</h3>
          <p className="text-3xl font-black text-yellow-600">
            {loading ? '...' : liveDrivers.filter(driver => !driver.is_approved).length}
          </p>
          <p className="text-xs text-yellow-600 mt-1">Awaiting review</p>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">All Drivers</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Approval</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deliveries</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading drivers...</td>
                </tr>
              ) : liveDrivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No drivers found</td>
                </tr>
              ) : (
                liveDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{driver.name?.charAt(0) || 'D'}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-500">{driver.email}</div>
                          <div className="text-xs text-gray-400">{driver.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {driver.vehicle_make} {driver.vehicle_model} ({driver.vehicle_year})
                      </div>
                      <div className="text-sm text-gray-500">{driver.vehicle_color}</div>
                      <div className="text-xs text-gray-400">{driver.license_plate}</div>
                    </td>
                                         <td className="px-6 py-4">
                       <div className="flex items-center space-x-2">
                         <div className={`w-2 h-2 rounded-full ${
                           driver.is_online ? 'bg-green-500' : 'bg-gray-400'
                         }`}></div>
                         <span className={`text-sm font-semibold ${
                           driver.is_online ? 'text-green-600' : 'text-gray-500'
                         }`}>
                           {driver.is_online ? 'Online' : 'Offline'}
                         </span>
                       </div>
                       <div className="text-xs text-gray-500 mt-1">
                         {driver.is_available ? 'Available' : 'Busy'}
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center space-x-2">
                         {driver.is_approved ? (
                           <div className="flex items-center space-x-1">
                             <CheckCircle className="w-4 h-4 text-green-500" />
                             <span className="text-sm font-semibold text-green-600">Approved</span>
                           </div>
                         ) : (
                           <div className="flex items-center space-x-1">
                             <AlertTriangle className="w-4 h-4 text-yellow-500" />
                             <span className="text-sm font-semibold text-yellow-600">Pending</span>
                           </div>
                         )}
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center space-x-1">
                         <Star className="w-4 h-4 text-yellow-400 fill-current" />
                         <span className="text-sm font-semibold text-gray-900">{driver.rating || 5.0}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="text-sm font-semibold text-gray-900">{driver.total_deliveries || 0}</div>
                       <div className="text-xs text-gray-500">deliveries</div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center space-x-2">
                         <button
                           onClick={() => openModal('driverDetails', driver)}
                           className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                         >
                           View Details
                         </button>
                         <button
                           onClick={() => openModal('editDriver', driver)}
                           className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold"
                         >
                           Edit
                         </button>
                         {!driver.is_approved && (
                           <button
                             onClick={() => approveDriver(driver.id)}
                             className="text-green-600 hover:text-green-800 text-sm font-semibold"
                           >
                             Approve
                           </button>
                         )}
                         {driver.is_approved && (
                           <button
                             onClick={() => rejectDriver(driver.id)}
                             className="text-red-600 hover:text-red-800 text-sm font-semibold"
                           >
                             Reject
                           </button>
                         )}
                       </div>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );



  const AnalyticsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
        <div className="flex items-center space-x-3">
          <select className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
            <option>This year</option>
          </select>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-green-800">Total Revenue</h3>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-3xl font-black text-green-600 mb-2">$47,892</p>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">+23.5% vs last period</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-blue-800">Total Orders</h3>
            <ShoppingCart className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-600 mb-2">1,847</p>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">+18.2% vs last period</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-purple-800">Active Users</h3>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-purple-600 mb-2">2,341</p>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">+12.8% vs last period</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-orange-800">Avg Order Value</h3>
            <Target className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-3xl font-black text-orange-600 mb-2">$89.42</p>
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-600">-3.1% vs last period</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Revenue Trend</h3>
            <button className="text-gray-500 hover:text-gray-700">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="h-64 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700">Revenue Chart</p>
              <p className="text-sm text-gray-500">Interactive chart visualization</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Order Status Distribution</h3>
            <button className="text-gray-500 hover:text-gray-700">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { status: 'Delivered', count: 1456, color: 'bg-green-500', percentage: 78.8 },
              { status: 'In Transit', count: 234, color: 'bg-blue-500', percentage: 12.7 },
              { status: 'Processing', count: 123, color: 'bg-yellow-500', percentage: 6.7 },
              { status: 'Cancelled', count: 34, color: 'bg-red-500', percentage: 1.8 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                  <span className="font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-12 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Delivery Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Average Delivery Time</span>
              <span className="font-bold text-blue-600">14.3 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">On-Time Delivery Rate</span>
              <span className="font-bold text-green-600">97.8%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Customer Satisfaction</span>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-bold text-yellow-600">4.8</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Return Rate</span>
              <span className="font-bold text-red-600">1.2%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-4">
            {[
              { name: 'Blue Dream Flower', sales: 234, revenue: '$10,530' },
              { name: 'Live Resin Carts', sales: 189, revenue: '$12,285' },
              { name: 'Gummy Edibles', sales: 156, revenue: '$3,900' },
              { name: 'Pre-rolls Pack', sales: 134, revenue: '$4,690' }
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-semibold text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.sales} units sold</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{product.revenue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Driver Analytics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Active Drivers</span>
              <span className="font-bold text-blue-600">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Average Rating</span>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-bold text-yellow-600">4.85</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Total Deliveries Today</span>
              <span className="font-bold text-green-600">47</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Driver Utilization</span>
              <span className="font-bold text-purple-600">84%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {[
              { time: '2 min ago', action: 'New order placed', details: '#FS2025045 - $89.50', type: 'order' },
              { time: '5 min ago', action: 'Driver went online', details: 'Marcus Johnson', type: 'driver' },
              { time: '8 min ago', action: 'Order delivered', details: '#FS2025044 - Sarah Williams', type: 'delivery' },
              { time: '12 min ago', action: 'Inventory alert', details: 'Blue Dream - Low stock', type: 'alert' },
              { time: '15 min ago', action: 'Customer registered', details: 'New user: Alex Chen', type: 'customer' }
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-xl">
                <div className={`w-3 h-3 rounded-full mt-2 ${
                  activity.type === 'order' ? 'bg-blue-500' :
                  activity.type === 'driver' ? 'bg-green-500' :
                  activity.type === 'delivery' ? 'bg-purple-500' :
                  activity.type === 'alert' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{activity.action}</h4>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">System Alerts</h3>
          <div className="space-y-4">
            {[
              { type: 'warning', message: 'Low inventory: Blue Dream Flower (15 units left)', time: '10 min ago' },
              { type: 'info', message: 'Weekly report ready for download', time: '1 hour ago' },
              { type: 'success', message: 'Payment processing system updated', time: '2 hours ago' },
              { type: 'error', message: 'Failed delivery attempt - Order #FS2025041', time: '3 hours ago' }
            ].map((alert, index) => (
              <div key={index} className={`p-4 rounded-xl border-l-4 ${
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                alert.type === 'info' ? 'bg-blue-50 border-blue-400' :
                alert.type === 'success' ? 'bg-green-50 border-green-400' :
                'bg-red-50 border-red-400'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`font-medium ${
                      alert.type === 'warning' ? 'text-yellow-800' :
                      alert.type === 'info' ? 'text-blue-800' :
                      alert.type === 'success' ? 'text-green-800' :
                      'text-red-800'
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center space-x-2">
          <Save className="w-4 h-4" />
          <span>Save All Changes</span>
        </button>
      </div>

      {/* System Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span>System Configuration</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Business Hours</label>
              <div className="grid grid-cols-2 gap-3">
                <select className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option>9:00 AM</option>
                  <option>10:00 AM</option>
                  <option>11:00 AM</option>
                </select>
                <select className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option>10:00 PM</option>
                  <option>11:00 PM</option>
                  <option>12:00 AM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Zone Radius</label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="5"
                  max="50"
                  defaultValue="25"
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-bold text-gray-900 w-12">25 mi</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Order Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  defaultValue="25"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                defaultValue="8.25"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Truck className="w-6 h-6 text-green-600" />
            <span>Delivery Settings</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Standard Delivery Fee</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  defaultValue="5.99"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Free Delivery Threshold</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  defaultValue="100"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Average Delivery Time (minutes)</label>
              <input
                type="number"
                defaultValue="30"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <label className="font-medium text-gray-700">Enable Real-Time Tracking</label>
                <p className="text-sm text-gray-600">Allow customers to track deliveries</p>
              </div>
              <div className="w-12 h-6 bg-emerald-600 rounded-full relative transition-colors">
                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-purple-600" />
            <span>Payment Settings</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Accepted Payment Methods</label>
              <div className="space-y-3">
                {[
                  { name: 'Credit/Debit Cards', enabled: true },
                  { name: 'Apple Pay', enabled: true },
                  { name: 'Google Pay', enabled: true },
                  { name: 'Cash on Delivery', enabled: false },
                  { name: 'Crypto Payments', enabled: false }
                ].map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{method.name}</span>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${
                      method.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        method.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Processing Fee (%)</label>
              <input
                type="number"
                defaultValue="2.9"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-red-600" />
            <span>Security Settings</span>
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="font-medium text-gray-700">Two-Factor Authentication</label>
                <p className="text-sm text-gray-600">Require 2FA for admin access</p>
              </div>
              <div className="w-12 h-6 bg-emerald-600 rounded-full relative transition-colors">
                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="font-medium text-gray-700">IP Restriction</label>
                <p className="text-sm text-gray-600">Limit admin access by IP</p>
              </div>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative transition-colors">
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="font-medium text-gray-700">Session Timeout</label>
                <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
              </div>
              <select className="px-3 py-1 border border-gray-200 rounded-lg text-sm">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <label className="font-medium text-gray-700">Audit Logging</label>
                <p className="text-sm text-gray-600">Track all admin actions</p>
              </div>
              <div className="w-12 h-6 bg-emerald-600 rounded-full relative transition-colors">
                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications & Communications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <span>Notification Settings</span>
          </h3>
          <div className="space-y-4">
            {[
              { name: 'Order Alerts', description: 'New orders and updates', enabled: true },
              { name: 'Inventory Alerts', description: 'Low stock notifications', enabled: true },
              { name: 'Driver Notifications', description: 'Driver status changes', enabled: true },
              { name: 'System Alerts', description: 'Technical issues and updates', enabled: true },
              { name: 'Marketing Reports', description: 'Weekly performance reports', enabled: false }
            ].map((notification, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <label className="font-medium text-gray-700">{notification.name}</label>
                  <p className="text-sm text-gray-600">{notification.description}</p>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${
                  notification.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notification.enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Mail className="w-6 h-6 text-green-600" />
            <span>Communication Settings</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Support Email</label>
              <input
                type="email"
                defaultValue="support@fadedskies.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Support Phone Number</label>
              <input
                type="tel"
                defaultValue="+1 (555) 420-FADED"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SMS Provider</label>
              <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                <option>Twilio</option>
                <option>AWS SNS</option>
                <option>MessageBird</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <label className="font-medium text-gray-700">Auto-Reply Messages</label>
                <p className="text-sm text-gray-600">Automatic customer responses</p>
              </div>
              <div className="w-12 h-6 bg-emerald-600 rounded-full relative transition-colors">
                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Management & API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <UserPlus className="w-6 h-6 text-indigo-600" />
            <span>User Management</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Admin Roles</label>
              <div className="space-y-2">
                {[
                  { role: 'Super Admin', count: 1, color: 'bg-red-100 text-red-800' },
                  { role: 'Admin', count: 3, color: 'bg-blue-100 text-blue-800' },
                  { role: 'Manager', count: 5, color: 'bg-green-100 text-green-800' },
                  { role: 'Support', count: 8, color: 'bg-gray-100 text-gray-800' }
                ].map((role, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">{role.role}</span>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${role.color}`}>
                        {role.count} users
                      </span>
                      <button className="text-blue-600 hover:text-blue-700">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => openModal('userManagement')}
              className="w-full bg-indigo-100 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-200 transition-colors"
            >
              Manage Users & Permissions
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Globe className="w-6 h-6 text-purple-600" />
            <span>API & Integration</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">API Rate Limit (requests/minute)</label>
              <input
                type="number"
                defaultValue="1000"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="font-medium text-gray-700">API Access Logging</label>
                <p className="text-sm text-gray-600">Log all API requests</p>
              </div>
              <div className="w-12 h-6 bg-emerald-600 rounded-full relative transition-colors">
                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Active Integrations</label>
              {[
                { name: 'Stripe Payment', status: 'Connected', color: 'text-green-600' },
                { name: 'Google Maps', status: 'Connected', color: 'text-green-600' },
                { name: 'Twilio SMS', status: 'Connected', color: 'text-green-600' },
                { name: 'SendGrid Email', status: 'Disconnected', color: 'text-red-600' }
              ].map((integration, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{integration.name}</span>
                  <span className={`text-sm font-semibold ${integration.color}`}>{integration.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Maintenance */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Activity className="w-6 h-6 text-orange-600" />
          <span>System Maintenance</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Database</h4>
            <div className="space-y-2">
              <button className="w-full bg-blue-100 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors">
                Backup Database
              </button>
              <button className="w-full bg-green-100 text-green-700 py-2 rounded-lg font-medium hover:bg-green-200 transition-colors">
                Optimize Tables
              </button>
              <button className="w-full bg-purple-100 text-purple-700 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors">
                View Logs
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Cache Management</h4>
            <div className="space-y-2">
              <button className="w-full bg-orange-100 text-orange-700 py-2 rounded-lg font-medium hover:bg-orange-200 transition-colors">
                Clear All Cache
              </button>
              <button className="w-full bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors">
                Reset Sessions
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                System Status
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">System Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Server Uptime:</span>
                <span className="font-semibold">7d 14h 32m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Database Size:</span>
                <span className="font-semibold">2.4 GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Sessions:</span>
                <span className="font-semibold">247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Memory Usage:</span>
                <span className="font-semibold">68%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CustomersView = () => {
    console.log('🔍 CustomersView render - liveCustomers count:', liveCustomers.length);
    console.log('🔍 CustomersView render - liveCustomers:', liveCustomers.map(u => ({ id: u.id, email: u.email, role: u.role })));
    

    
    // Calculate user statistics
    const getUserStats = (userId: string) => {
      const userOrders = liveOrders.filter(order => order.user_id === userId);
      const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      return {
        totalOrders: userOrders.length,
        totalSpent: totalSpent.toFixed(2)
      };
    };

    // Categorize users based on database role field
    const categorizeUser = (user: any) => {
      if (user.role === 'admin' || user.is_admin) {
        return { category: 'Admin', color: 'bg-purple-100 text-purple-800' };
      }
      if (user.role === 'driver' || user.is_driver) {
        return { category: 'Driver', color: 'bg-blue-100 text-blue-800' };
      }
      return { category: 'Customer', color: 'bg-green-100 text-green-800' };
    };


    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">Live Updates Active</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Orders</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Spent</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
                ) : liveCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No users found. (liveCustomers.length: {liveCustomers.length})
                    </td>
                  </tr>
                ) : (
                  liveCustomers
                    .filter(user => user.role !== 'driver' && !user.is_driver) // Show customers and admins, not drivers
                    .map(user => {
                      const stats = getUserStats(user.id);
                      const userCategory = categorizeUser(user);
                      return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {user.name || user.email?.split('@')[0] || 'Unknown'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {user.address || 'No address provided'}
                            </p>
                            {user.vehicle && (
                              <p className="text-xs text-blue-600">
                                🚗 {user.vehicle.make} {user.vehicle.model} ({user.vehicle.year})
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            <div className="font-medium">{user.email}</div>
                            <div>{user.phone || 'No phone'}</div>
                            {user.rating && (
                              <div className="text-yellow-600">⭐ {user.rating}/5</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${userCategory.color}`}>
                            {userCategory.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          <div>
                            <div>{stats.totalOrders} orders</div>
                            {user.totalDeliveries > 0 && (
                              <div className="text-xs text-blue-600">{user.totalDeliveries} deliveries</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          <div>
                            <div>${stats.totalSpent}</div>
                            {user.totalEarned > 0 && (
                              <div className="text-xs text-green-600">Earned: ${user.totalEarned}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.is_verified || user.email_confirmed_at
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.is_verified || user.email_confirmed_at ? 'Verified' : 'Pending'}
                            </span>
                            {user.isOnline !== undefined && (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                user.isOnline 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.isOnline ? '🟢 Online' : '⚫ Offline'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal('customerDetails', user)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="View User Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                // Show user's orders
                                const userOrders = liveOrders.filter(order => order.user_id === user.id);
                                console.log('User orders:', userOrders);
                                alert(`User ${user.email} has ${userOrders.length} orders`);
                              }}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="View Orders"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Driver Details Modal
  const DriverDetailsModal = () => {
    if (!selectedDriver) return null;

    return (
      <Modal
        isOpen={modals.driverDetails}
        onClose={() => closeModal('driverDetails')}
        title="Driver Details"
        size="lg"
      >
        <div className="space-y-6">
          {/* Driver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedDriver.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-lg text-gray-900">{selectedDriver.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-lg text-gray-900">{selectedDriver.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Driver's License</label>
                  <p className="text-lg text-gray-900">{selectedDriver.license_number}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Vehicle</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedDriver.vehicle_make} {selectedDriver.vehicle_model} ({selectedDriver.vehicle_year})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Color</label>
                  <p className="text-lg text-gray-900">{selectedDriver.vehicle_color}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">License Plate</label>
                  <p className="text-lg text-gray-900">{selectedDriver.license_plate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h5 className="text-sm font-medium text-gray-600 mb-2">Status</h5>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  selectedDriver.is_online ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className={`font-semibold ${
                  selectedDriver.is_online ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {selectedDriver.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedDriver.is_available ? 'Available for orders' : 'Currently busy'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h5 className="text-sm font-medium text-gray-600 mb-2">Rating</h5>
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-xl font-bold text-gray-900">{selectedDriver.rating || 5.0}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Customer satisfaction</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h5 className="text-sm font-medium text-gray-600 mb-2">Deliveries</h5>
              <p className="text-xl font-bold text-gray-900">{selectedDriver.total_deliveries || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Total completed</p>
            </div>
          </div>

          {/* Approval Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-sm font-medium text-gray-600 mb-2">Approval Status</h5>
            <div className="flex items-center space-x-2">
              {selectedDriver.is_approved ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-green-600">Approved</span>
                  {selectedDriver.approved_at && (
                    <span className="text-sm text-gray-500">
                      on {new Date(selectedDriver.approved_at).toLocaleDateString()}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-600">Pending Approval</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => closeModal('driverDetails')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold"
            >
              Close
            </button>
            <button
              onClick={() => {
                closeModal('driverDetails');
                openModal('editDriver', selectedDriver);
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Edit Driver
            </button>
            {!selectedDriver.is_approved && (
              <button
                onClick={() => {
                  approveDriver(selectedDriver.id);
                  closeModal('driverDetails');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Approve Driver
              </button>
            )}
            {selectedDriver.is_approved && (
              <button
                onClick={() => {
                  rejectDriver(selectedDriver.id);
                  closeModal('driverDetails');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                Reject Driver
              </button>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  // Edit Driver Modal
  const EditDriverModal = () => {
    if (!selectedDriver) return null;

    const [formData, setFormData] = useState({
      name: selectedDriver.name || '',
      phone: selectedDriver.phone || '',
      license_number: selectedDriver.license_number || '',
      vehicle_make: selectedDriver.vehicle_make || '',
      vehicle_model: selectedDriver.vehicle_model || '',
      vehicle_year: selectedDriver.vehicle_year || '',
      vehicle_color: selectedDriver.vehicle_color || '',
      license_plate: selectedDriver.license_plate || '',
      is_approved: selectedDriver.is_approved || false
    });

    const handleSubmit = async (e: any) => {
      e.preventDefault();
      
      try {
        const { error } = await supabase
          .from('drivers')
          .update({
            name: formData.name,
            phone: formData.phone,
            license_number: formData.license_number,
            vehicle_make: formData.vehicle_make,
            vehicle_model: formData.vehicle_model,
            vehicle_year: parseInt(formData.vehicle_year.toString()),
            vehicle_color: formData.vehicle_color,
            license_plate: formData.license_plate,
            is_approved: formData.is_approved,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedDriver.id);

        if (error) {
          console.error('Failed to update driver:', error);
          return;
        }

        console.log('Driver updated successfully');
        await fetchLiveData();
        closeModal('editDriver');
      } catch (error) {
        console.error('Error updating driver:', error);
      }
    };

    return (
      <Modal
        isOpen={modals.editDriver}
        onClose={() => closeModal('editDriver')}
        title="Edit Driver"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver's License</label>
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Make</label>
              <input
                type="text"
                value={formData.vehicle_make}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicle_make: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Model</label>
              <input
                type="text"
                value={formData.vehicle_model}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicle_model: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Year</label>
              <input
                type="number"
                value={formData.vehicle_year}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicle_year: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Color</label>
              <input
                type="text"
                value={formData.vehicle_color}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicle_color: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
              <input
                type="text"
                value={formData.license_plate}
                onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_approved"
              checked={formData.is_approved}
              onChange={(e) => setFormData(prev => ({ ...prev, is_approved: e.target.checked }))}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="is_approved" className="text-sm font-medium text-gray-700">
              Approve this driver
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => closeModal('editDriver')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Update Driver
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  const MapView = () => {
    console.log('🗺️ MapView - liveDrivers:', liveDrivers);
    console.log('🗺️ MapView - liveOrders:', liveOrders);
    console.log('🗺️ Number of drivers:', liveDrivers.length);
    console.log('🗺️ Online drivers:', liveDrivers.filter(d => d.is_online).length);
    
    // Debug driver locations
    liveDrivers.forEach((driver, index) => {
      console.log(`🗺️ Driver ${index + 1}:`, {
        id: driver.id,
        name: driver.name,
        isOnline: driver.is_online,
        currentLocation: driver.current_location,
        locationType: typeof driver.current_location,
        hasLocation: !!driver.current_location,
        locationUpdatedAt: driver.location_updated_at
      });
    });
    
    // Debug driver location data
    liveDrivers.forEach((driver, index) => {
      console.log(`🗺️ Driver ${index + 1}:`, {
        id: driver.id,
        name: driver.name,
        isOnline: driver.is_online,
        currentLocation: driver.current_location,
        locationType: typeof driver.current_location,
        hasLocation: !!driver.current_location,
        locationUpdatedAt: driver.location_updated_at
      });
    });
    
    // Transform live driver data for map display
    const realDrivers = liveDrivers
      .filter(driver => driver.is_online)
      .map(driver => {
        console.log('🗺️ Processing driver:', driver);
        console.log('🗺️ Driver current_location:', driver.current_location);
        console.log('🗺️ Driver latest_lat/lng:', driver.latest_lat, driver.latest_lng);
        
        // Handle location data - check multiple possible location sources
        let location: [number, number];
        
        // First try latest_lat/lng from real_time_driver_tracking view
        if (driver.latest_lat && driver.latest_lng && 
            driver.latest_lat !== 0 && driver.latest_lng !== 0) {
          location = [driver.latest_lng, driver.latest_lat] as [number, number];
          console.log('🗺️ Using latest_lat/lng coordinates for driver:', driver.name, location);
        } else if (driver.current_location && 
            typeof driver.current_location === 'object' && 
            driver.current_location.lat && 
            driver.current_location.lng &&
            driver.current_location.lat !== 0 && 
            driver.current_location.lng !== 0) {
          // Valid GPS coordinates from current_location
          location = [driver.current_location.lng, driver.current_location.lat] as [number, number];
          console.log('🗺️ Using current_location coordinates for driver:', driver.name, location);
        } else if (Array.isArray(driver.current_location) && 
                   driver.current_location.length === 2 &&
                   driver.current_location[0] !== 0 && 
                   driver.current_location[1] !== 0) {
          // Valid array coordinates
          location = driver.current_location as [number, number];
          console.log('🗺️ Using array coordinates for driver:', driver.name, location);
        } else {
          // No valid location data - use default location for now
          console.log('⚠️ No valid GPS coordinates for driver:', driver.name, '- using default location');
          location = [-97.7341, 30.2849] as [number, number]; // Default Austin location
        }
        
        console.log('🗺️ Final driver location:', location);
        
        return {
          id: driver.id,
          name: driver.name,
          location: location,
          status: driver.is_available ? 'available' as const : 'busy' as const,
          currentOrder: liveOrders.find(order => order.driver_id === driver.id)?.order_id || undefined
        };
      }) as any[];

    console.log('🗺️ Final realDrivers:', realDrivers);
    console.log('🗺️ Number of realDrivers to show on map:', realDrivers.length);

    // Note: realDeliveries is now handled by getOptimizationData()

    return (
      <div className="space-y-6">
        {/* Header with Live Tracking Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">Live Tracking & Dispatch</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${liveTrackingEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${liveTrackingEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {liveTrackingEnabled ? 'Live Tracking Active' : 'Live Tracking Inactive'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={liveTrackingEnabled ? stopLiveTracking : startLiveTracking}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors flex items-center space-x-2 ${
                liveTrackingEnabled 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {liveTrackingEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{liveTrackingEnabled ? 'Stop Tracking' : 'Start Tracking'}</span>
            </button>
            <button
              onClick={fetchLiveData}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Live Tracking Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Live Driver Tracking</h2>
                <div className="text-sm text-gray-600">
                  {liveDrivers.filter(d => d.is_online).length} drivers online
                </div>
              </div>
              <div className="h-96 bg-gray-100 rounded-xl overflow-hidden">
                <EnhancedAdminMap 
                  drivers={getOptimizationData().driverLocations}
                  deliveries={getOptimizationData().deliveryLocations}
                  onRouteOptimized={handleRouteOptimized}
                  onDriverSelected={handleDriverSelected}
                  onDeliverySelected={handleDeliverySelected}
                />
              </div>
            </div>
          </div>

          {/* Live Dispatch Panel */}
          <div className="space-y-6">
            {/* Active Drivers */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Active Drivers</h3>
              <div className="space-y-3">
                {realDrivers.map((driver: any) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900">{driver.name}</div>
                      <div className="text-sm text-gray-600">
                        {driver.status === 'available' ? 'Available' : 'Busy'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <button
                        onClick={() => console.log('Tracking driver:', driver.name)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Track
                      </button>
                    </div>
                  </div>
                ))}
                {realDrivers.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No drivers online
                  </div>
                )}
              </div>
            </div>

            {/* Dispatch Queue */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Dispatch Queue</h3>
              <div className="space-y-3">
                {dispatchQueue.slice(0, 5).map((dispatch, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-blue-900">Order #{dispatch.orderId}</div>
                      <div className="text-sm text-blue-700">
                        {new Date(dispatch.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm text-blue-600 font-medium">
                      {dispatch.status}
                    </div>
                  </div>
                ))}
                {dispatchQueue.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No pending dispatches
                  </div>
                )}
              </div>
              
              {/* Auto-Dispatch Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={async () => {
                    console.log('🤖 Auto-dispatching orders to available drivers...');
                    const unassignedOrders = liveOrders.filter(o => !o.driver_id && o.status === 'ready');
                    const availableDrivers = liveDrivers.filter(d => d.is_online && d.is_available);
                    
                    if (unassignedOrders.length === 0) {
                      alert('No ready orders to dispatch');
                      return;
                    }
                    
                    if (availableDrivers.length === 0) {
                      alert('No available drivers online');
                      return;
                    }
                    
                    let dispatchedCount = 0;
                    for (let i = 0; i < Math.min(unassignedOrders.length, availableDrivers.length); i++) {
                      const success = await dispatchOrderToDriver(unassignedOrders[i].id, availableDrivers[i].id);
                      if (success) dispatchedCount++;
                    }
                    
                    alert(`Auto-dispatched ${dispatchedCount} orders to drivers!`);
                  }}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  🤖 Auto-Dispatch Orders
                </button>
              </div>
            </div>

            {/* Emergency Alerts */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Emergency Alerts</h3>
              <div className="space-y-3">
                {emergencyAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-red-900">{alert.alertType}</div>
                      <div className="text-sm text-red-700">{alert.message}</div>
                    </div>
                    <div className="text-sm text-red-600 font-medium">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {emergencyAlerts.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No active alerts
                  </div>
                )}
              </div>
            </div>

            {/* Optimized Routes */}
            {optimizedRoutes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Optimized Routes</h3>
                <div className="space-y-3">
                  {optimizedRoutes.map((route) => (
                    <div key={route.driverId} className="p-3 bg-green-50 rounded-lg">
                      <div className="font-semibold text-green-900">{route.driverName}</div>
                      <div className="text-sm text-green-700">
                        {route.route.length - 1} deliveries • ${route.totalEarnings.toFixed(2)} earnings
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Driver/Delivery Info */}
            {(selectedDriverForTracking || selectedDeliveryForTracking) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Selected Items</h3>
                <div className="space-y-3">
                  {selectedDriverForTracking && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-blue-900">Driver: {selectedDriverForTracking}</div>
                    </div>
                  )}
                  {selectedDeliveryForTracking && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-blue-900">Delivery: {selectedDeliveryForTracking}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Driver Performance Metrics */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Driver Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {driverPerformance.slice(0, 4).map((performance, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-900">Driver #{performance.driverId}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Last updated: {new Date(performance.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {driverPerformance.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-4">
                No performance data available
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'products': return <ProductsView />;
      case 'orders': return <OrdersView />;
      case 'drivers': return <DriversView />;
      case 'map': return <MapView />;
      case 'customers': return <CustomersView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Faded Skies Admin</h1>
            <p className="text-gray-500">Cannabis Delivery Management</p>
          </div>

          {/* Auth Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleAuthSubmit(); }} className="space-y-6">
            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={authForm.name}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Admin Name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="admin@fadedskies.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>

            {authMode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-blue-700 transition-all duration-200"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Admin Account'}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {authMode === 'login' ? 'Need an admin account?' : 'Already have an account?'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        {renderCurrentView()}
      </div>

      {/* Modal Components */}
      <ProductModal />
      <OrderDetailsModal />
      <CustomerDetailsModal />
      <DriverDetailsModal />
      <EditDriverModal />
      <UserManagementModal />
      <ConfirmationModal />
    </div>
  );
};

export default FadedSkiesTrackingAdmin;
