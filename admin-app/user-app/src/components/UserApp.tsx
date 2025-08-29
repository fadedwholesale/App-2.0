import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShoppingCart, 
  User, 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  MessageCircle, 
  Truck, 
  Plus, 
  Minus, 
  Menu, 
  X, 
  Camera, 
  Upload, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle,
  Edit3,
  Navigation,
  Phone
} from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Import real-time service
import realTimeService, { Order as RealTimeOrder, Product as RealTimeProduct } from '../services/real-time-service';
import { supabase } from '../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePayment from './StripePayment';

// TypeScript interfaces
interface Product {
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
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  items: string[];
  total: number;
  date: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  driver: string;
  vehicle: string;
  currentLocation?: string;
  driverLocation?: { lat: number; lng: number };
  deliveryAddress?: string;
  distance?: number;
  etaMinutes?: number;
  lastUpdated?: string;
}

interface User {
  name: string;
  email: string;
  address: string;
  phone?: string;
  rewards: number;
  age: number;
  idVerified: boolean;
}

// interface SupportTicket {
//   id: string;
//   subject: string;
//   status: string;
//   priority: string;
//   created: string;
//   updated: string;
//   category: string;
// }

// Format order date for clean display with tracking precision
const formatOrderDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    // Today - show time for tracking
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffInHours < 48) {
    // Yesterday - show time for tracking
    return `Yesterday, ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  } else {
    // Older - show date and time for tracking
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  }
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Round to 2 decimal places
};

// Calculate delivery time based on distance and status
const calculateDeliveryTime = (distance: number, status: string): number => {
  if (status === 'delivered') return 0;
  if (status === 'cancelled') return 0;
  
  // Different speeds based on order status
  let averageSpeed = 25; // Default city speed
  
  switch (status) {
    case 'picked_up':
    case 'in_transit':
      averageSpeed = 30; // Highway speed for delivery
      break;
    case 'accepted':
      averageSpeed = 25; // City speed when heading to pickup
      break;
    case 'assigned':
      averageSpeed = 20; // Slower when just assigned
      break;
    default:
      averageSpeed = 15; // Very slow for other statuses
  }
  
  const timeInHours = distance / averageSpeed;
  const timeInMinutes = Math.round(timeInHours * 60);
  
  // Add buffer time based on distance
  let bufferMinutes = 10; // Base buffer
  
  if (distance > 5) {
    bufferMinutes = 15; // More buffer for longer distances
  } else if (distance > 10) {
    bufferMinutes = 20; // Even more buffer for very long distances
  }
  
  // Add status-specific buffer
  if (status === 'picked_up' || status === 'in_transit') {
    bufferMinutes += 5; // Extra time for final delivery
  }
  
  return Math.max(timeInMinutes + bufferMinutes, 8); // Minimum 8 minutes
};

// Format delivery time for display
const formatDeliveryTime = (minutes: number): string => {
  if (minutes <= 0) return 'Delivered';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// Map database status to user-friendly display status
const getDisplayStatus = (status: string): { text: string; color: string; icon: string } => {
  switch (status) {
    case 'pending':
      return { text: 'Order Placed', color: 'bg-blue-100 text-blue-800', icon: '📋' };
    case 'confirmed':
      return { text: 'Order Confirmed', color: 'bg-blue-100 text-blue-800', icon: '✅' };
    case 'preparing':
      return { text: 'Preparing Order', color: 'bg-yellow-100 text-yellow-800', icon: '👨‍🍳' };
    case 'ready':
      return { text: 'Ready for Pickup', color: 'bg-green-100 text-green-800', icon: '📦' };
    case 'assigned':
      return { text: 'Driver Assigned', color: 'bg-purple-100 text-purple-800', icon: '🚚' };
    case 'accepted':
      return { text: 'Driver En Route', color: 'bg-orange-100 text-orange-800', icon: '🚗' };
    case 'picked_up':
      return { text: 'Picked Up', color: 'bg-indigo-100 text-indigo-800', icon: '📱' };
    case 'in_transit':
      return { text: 'Out for Delivery', color: 'bg-red-100 text-red-800', icon: '🚚' };
    case 'delivered':
      return { text: 'Delivered', color: 'bg-green-100 text-green-800', icon: '🎉' };
    case 'cancelled':
      return { text: 'Cancelled', color: 'bg-gray-100 text-gray-800', icon: '❌' };
    default:
      return { text: 'Processing', color: 'bg-gray-100 text-gray-800', icon: '⏳' };
  }
};

// Get appropriate ETA based on order status
const getStatusBasedETA = (status: string): string => {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return '45-60 min';
    case 'preparing':
      return '30-45 min';
    case 'ready':
      return '20-35 min';
    case 'assigned':
      return '15-25 min';
    case 'accepted':
      return '10-20 min';
    case 'picked_up':
    case 'in_transit':
      return '8-15 min';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return '45-60 min';
  }
};

// Professional Mapbox Delivery Tracker Component
const DeliveryTracker = React.memo(({ 
  order, 
  isOpen, 
  onClose 
}: { 
  order: Order; 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const routeLayer = useRef<mapboxgl.GeoJSONSource | null>(null);
  
  // User delivery address (Austin downtown - replace with actual user location)
  const userDeliveryLat = 30.2672;
  const userDeliveryLng = -97.7431;
  
  // Mapbox access token - Using working token from admin app
  const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZmFkZWRza2llczU3IiwiYSI6ImNtZW00dHRyajBod3IyeHEyZHdnYm1yeW0ifQ.P4RajEEKqe1dBpyehD-iAA';

  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;

    try {
      // Initialize map with real Mapbox token
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [userDeliveryLng, userDeliveryLat],
        zoom: 14
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add delivery destination marker
      new mapboxgl.Marker({ color: '#10B981' })
        .setLngLat([userDeliveryLng, userDeliveryLat])
        .setPopup(new mapboxgl.Popup().setHTML('<div class="text-center"><strong>Your Address</strong><br/>Delivery Destination</div>'))
        .addTo(map.current);

      // Add driver marker if location is available - PRODUCTION READY
      if (currentOrder.driverLocation && currentOrder.driverLocation.lat && currentOrder.driverLocation.lng) {
        console.log('📍 Adding initial driver marker at:', currentOrder.driverLocation);
        driverMarker.current = new mapboxgl.Marker({ 
          color: '#3B82F6',
          element: createDriverMarker()
        })
          .setLngLat([currentOrder.driverLocation.lng, currentOrder.driverLocation.lat])
          .addTo(map.current);
        
        // Fit map to show both driver and destination
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([currentOrder.driverLocation.lng, currentOrder.driverLocation.lat]); // Driver
        bounds.extend([userDeliveryLng, userDeliveryLat]); // Destination
        map.current.fitBounds(bounds, { padding: 50 });
      } else {
        console.log('⚠️ No driver location available for initial marker');
        console.log('🔍 Current order data:', currentOrder);
        console.log('🔍 Driver ID:', currentOrder.driver);
        console.log('🔍 Driver location:', currentOrder.driverLocation);
        
        // Add a placeholder marker that will be updated when real data arrives
        console.log('📍 Adding placeholder driver marker...');
        driverMarker.current = new mapboxgl.Marker({ 
          color: '#6B7280', // Gray color for placeholder
          element: createDriverMarker()
        })
          .setLngLat([userDeliveryLng + 0.01, userDeliveryLat + 0.01]) // Slightly offset from destination
          .addTo(map.current);
      }

      // Add route layer when map loads
      map.current.on('load', () => {
        if (currentOrder.driverLocation && currentOrder.driverLocation.lat && currentOrder.driverLocation.lng) {
          console.log('🗺️ Map loaded, adding route...');
          addRouteToMap();
        } else {
          console.log('🗺️ Map loaded, waiting for driver location to add route...');
        }
      });

      console.log('🗺️ Map initialized with real Mapbox token');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      createFallbackMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen]);

  const createFallbackMap = () => {
    if (!mapContainer.current) return;
    
    // Create a simple map-like interface
    mapContainer.current.innerHTML = `
      <div class="w-full h-full bg-gradient-to-br from-blue-50 to-gray-100 relative">
        <!-- Map Background Pattern -->
        <div class="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" class="absolute inset-0">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <!-- Delivery Destination Marker -->
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div class="w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-medium shadow">
            Your Address
          </div>
        </div>
        
        <!-- Driver Marker (if location available) -->
        ${order.driverLocation ? `
          <div class="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
            <div class="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded text-xs font-medium shadow">
              Driver
            </div>
          </div>
        ` : ''}
        
        <!-- Route Line (if driver location available) -->
        ${order.driverLocation ? `
          <svg class="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.8"/>
                <stop offset="50%" stop-color="#6366f1" stop-opacity="0.8"/>
                <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.8"/>
              </linearGradient>
            </defs>
            <path 
              d="M 25 25 Q 50 50, 75 25 T 125 75 Q 150 100, 200 50" 
              stroke="url(#routeGradient)" 
              stroke-width="4" 
              fill="none"
              stroke-dasharray="10,5"
              class="animate-pulse"
            />
          </svg>
        ` : ''}
        
        <!-- Map Attribution -->
        <div class="absolute bottom-2 left-2 text-xs text-gray-500">
          Delivery Tracking
        </div>
      </div>
    `;
  };

  // Update driver location when it changes - PRODUCTION READY
  useEffect(() => {
    console.log('🔄 Driver location update triggered:', {
      hasMap: !!map.current,
      hasDriverLocation: !!currentOrder.driverLocation,
      hasDriverMarker: !!driverMarker.current,
      driverLocation: currentOrder.driverLocation
    });

    if (map.current && currentOrder.driverLocation) {
      const { lat, lng } = currentOrder.driverLocation;
      
      if (driverMarker.current) {
        // Update existing marker
        driverMarker.current.setLngLat([lng, lat]);
        
        // Update marker color to active blue if it was placeholder
        const markerElement = driverMarker.current.getElement();
        if (markerElement) {
          const markerDiv = markerElement.querySelector('.driver-marker > div');
          if (markerDiv) {
            markerDiv.className = 'bg-blue-600 text-white rounded-full p-3 shadow-xl border-4 border-white animate-pulse';
          }
        }
        
        console.log('📍 Updated existing driver marker to:', { lat, lng });
      } else {
        // Create new driver marker
        driverMarker.current = new mapboxgl.Marker({ 
          color: '#3B82F6',
          element: createDriverMarker()
        })
          .setLngLat([lng, lat])
          .addTo(map.current);
        console.log('📍 Created new driver marker at:', { lat, lng });
      }
      
      // Update route if available
      if (routeLayer.current) {
        updateRoute();
      } else {
        addRouteToMap();
      }
      
      // Fit map to show both driver and destination
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([lng, lat]); // Driver location
      bounds.extend([userDeliveryLng, userDeliveryLat]); // Delivery location
      map.current.fitBounds(bounds, { padding: 50 });
      
    } else if (!map.current && currentOrder.driverLocation) {
      // Update fallback map if using fallback interface
      updateFallbackMap();
    }
  }, [currentOrder.driverLocation]);

  // Production-ready 30-second driver location updates with real database integration
  useEffect(() => {
    if (!isOpen || !currentOrder.driver) return;

    const updateInterval = setInterval(async () => {
      try {
        let driverId = currentOrder.driver;
        
        // Check if driverId is a valid UUID or if it's just a status string
        if (driverId === 'Driver Assigned' || driverId === 'driver_assigned' || !driverId) {
          console.log('⚠️ Invalid driver ID in periodic update:', driverId);
          
          // Try to find any available driver
          const { data: availableDrivers, error: driversError } = await supabase
            .from('drivers')
            .select('id, name, current_location, is_online, is_available')
            .eq('is_online', true)
            .eq('is_available', true);
          
          if (driversError) {
            console.error('❌ Error fetching available drivers in periodic update:', driversError);
            return;
          }
          
          if (availableDrivers && availableDrivers.length > 0) {
            driverId = availableDrivers[0].id;
            console.log('📍 Using available driver for periodic update:', driverId);
          } else {
            console.log('❌ No available drivers for periodic update');
            return;
          }
        }
        
        // Fetch driver data from drivers table (same as Admin App)
        const { data: driver, error } = await supabase
          .from('drivers')
          .select('id, name, current_location, is_online, is_available')
          .eq('id', driverId)
          .single();

        if (driver && !error) {
          // Use same logic as Admin App to get coordinates from current_location JSONB
          let lat = 30.2672; // Austin default
          let lng = -97.7431; // Austin default
          
          if (driver.current_location && 
              typeof driver.current_location === 'object' && 
              driver.current_location.lat && 
              driver.current_location.lng) {
            lat = driver.current_location.lat;
            lng = driver.current_location.lng;
          }
          
          const location = { lat, lng };
          
          // Update order state
          const updatedOrder = {
            ...currentOrder,
            driverLocation: location
          };
          setCurrentOrder(updatedOrder);
          
          // Update driver marker
          if (map.current) {
            if (driverMarker.current) {
              driverMarker.current.setLngLat([location.lng, location.lat]);
            } else {
              driverMarker.current = new mapboxgl.Marker({ color: '#3B82F6' })
                .setLngLat([location.lng, location.lat])
                .addTo(map.current);
            }
          }
          
          console.log('📍 Driver location updated from database:', location);
        }
      } catch (error) {
        console.error('❌ Error in periodic driver location update:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(updateInterval);
  }, [isOpen, currentOrder.driver]);

  const updateFallbackMap = () => {
    if (!mapContainer.current || !order.driverLocation) return;
    
    // Recreate the fallback map with updated driver location
    createFallbackMap();
  };

  // Calculate distance and ETA for display
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatedETA, setCalculatedETA] = useState<string>('Calculating...');

  useEffect(() => {
    console.log('🔄 Updating delivery tracker:', {
      hasDriverLocation: !!currentOrder.driverLocation,
      driverLocation: currentOrder.driverLocation,
      status: currentOrder.status
    });

    if (currentOrder.driverLocation && currentOrder.driverLocation.lat && currentOrder.driverLocation.lng) {
      const distance = calculateDistance(
        currentOrder.driverLocation.lat,
        currentOrder.driverLocation.lng,
        userDeliveryLat,
        userDeliveryLng
      );
      setCalculatedDistance(distance);
      
      // Calculate realistic ETA based on distance
      const etaMinutes = calculateDeliveryTime(distance, currentOrder.status);
      const formattedETA = formatDeliveryTime(etaMinutes);
      setCalculatedETA(formattedETA);
      
      console.log(`📍 Real distance calculation: ${distance} mi, ETA: ${formattedETA}`);
      console.log(`📍 Driver location: ${currentOrder.driverLocation.lat}, ${currentOrder.driverLocation.lng}`);
      console.log(`📍 Delivery location: ${userDeliveryLat}, ${userDeliveryLng}`);
    } else {
      // Use status-based ETA when no driver location
      const statusBasedETA = getStatusBasedETA(currentOrder.status);
      setCalculatedETA(statusBasedETA);
      setCalculatedDistance(null);
      
      console.log(`📍 No driver location, using status-based ETA: ${statusBasedETA}`);
      console.log(`📍 Current order driver location:`, currentOrder.driverLocation);
    }
  }, [currentOrder.driverLocation, currentOrder.status]);

  // Production-ready component mount with comprehensive driver data validation
  useEffect(() => {
    console.log('🗺️ DeliveryTracker mounted with order:', {
      id: currentOrder.id,
      status: currentOrder.status,
      driver: currentOrder.driver,
      driverLocation: currentOrder.driverLocation,
      hasDriverLocation: !!currentOrder.driverLocation
    });

    // Comprehensive driver data validation and fetching
    if (currentOrder.driver) {
      console.log('🔍 Validating driver data for:', currentOrder.driver);
      console.log('📋 Full order object:', currentOrder);
      
      // Check database for available drivers
      checkAllDrivers();
      
      // Fetch real driver location from database
      fetchDriverLocation(currentOrder.driver);
    } else {
      console.log('⚠️ No driver assigned to order, attempting to find available driver');
      fetchDriverLocation('Driver Assigned');
    }
  }, []);

  const checkAllDrivers = async () => {
    try {
      console.log('🔍 Checking all drivers in database...');
      const { data: allDrivers, error } = await supabase
        .from('drivers')
        .select('id, name, current_location, is_online, is_available');
      
      if (error) {
        console.error('❌ Error fetching all drivers:', error);
      } else {
        console.log('📋 All drivers in database:', allDrivers);
        console.log('📋 Number of drivers:', allDrivers?.length || 0);
        
        // Check if our driver is in the list
        if (allDrivers) {
          const ourDriver = allDrivers.find(d => d.id === currentOrder.driver);
          if (ourDriver) {
            console.log('✅ Found our driver in database:', ourDriver);
          } else {
            console.log('❌ Our driver not found in database. Looking for:', currentOrder.driver);
            console.log('📋 Available driver IDs:', allDrivers.map(d => d.id));
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking all drivers:', error);
    }
  };

  const fetchDriverLocation = async (driverId: string) => {
    try {
      console.log('🔍 Fetching driver location for driver ID:', driverId);
      
      // Check if driverId is a valid UUID or if it's just a status string
      if (driverId === 'Driver Assigned' || driverId === 'driver_assigned' || !driverId) {
        console.log('⚠️ Invalid driver ID detected:', driverId);
        console.log('🔍 This order needs to be assigned to a real driver first');
        
        // Try to find any available driver
        const { data: availableDrivers, error: driversError } = await supabase
          .from('drivers')
          .select('id, name, current_location, is_online, is_available')
          .eq('is_online', true)
          .eq('is_available', true);
        
        if (driversError) {
          console.error('❌ Error fetching available drivers:', driversError);
          return;
        }
        
        if (availableDrivers && availableDrivers.length > 0) {
          console.log('📋 Found available drivers:', availableDrivers);
          const firstDriver = availableDrivers[0];
          console.log('📍 Using first available driver:', firstDriver);
          
          // Use the first available driver
          driverId = firstDriver.id;
        } else {
          console.log('❌ No available drivers found');
          return;
        }
      }
      
      // Fetch driver data from drivers table (same as Admin App)
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('id, name, current_location, is_online, is_available')
        .eq('id', driverId)
        .single();

      if (driver && !error) {
        console.log('📋 Driver data fetched:', driver);
        
        // Use same logic as Admin App to get coordinates from current_location JSONB
        let lat = 30.2672; // Austin default
        let lng = -97.7431; // Austin default
        
        if (driver.current_location && 
            typeof driver.current_location === 'object' && 
            driver.current_location.lat && 
            driver.current_location.lng) {
          lat = driver.current_location.lat;
          lng = driver.current_location.lng;
        }
        
        const location = { lat, lng };
        console.log('📍 Real driver location calculated:', location);
        
        // Update the order with real driver location
        const updatedOrder = {
          ...currentOrder,
          driverLocation: location
        };
        
        // Update state with real driver location
        setCurrentOrder(updatedOrder);
        
        // Update the map with real driver location
        if (map.current) {
          if (driverMarker.current) {
            driverMarker.current.setLngLat([location.lng, location.lat]);
            console.log('📍 Updated existing driver marker to:', location);
          } else {
            // Create driver marker if it doesn't exist
            driverMarker.current = new mapboxgl.Marker({ 
              color: '#3B82F6',
              element: createDriverMarker()
            })
              .setLngLat([location.lng, location.lat])
              .addTo(map.current);
            console.log('📍 Created new driver marker at:', location);
          }
          
          // Update route
          if (routeLayer.current) {
            updateRoute();
          } else {
            addRouteToMap();
          }
        } else {
          console.log('⚠️ Map not ready yet, will update when map loads');
        }
      } else {
        console.log('⚠️ No driver found in database for driver ID:', driverId);
        console.log('❌ Database error:', error);
      }
    } catch (error) {
      console.error('❌ Error fetching driver location:', error);
    }
  };

  const createDriverMarker = () => {
    const el = document.createElement('div');
    el.className = 'driver-marker';
    el.innerHTML = `
      <div class="bg-blue-600 text-white rounded-full p-3 shadow-xl border-4 border-white animate-pulse">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
      </div>
    `;
    return el;
  };

  const addRouteToMap = async () => {
    if (!map.current || !currentOrder.driverLocation) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${currentOrder.driverLocation.lng},${currentOrder.driverLocation.lat};${userDeliveryLng},${userDeliveryLat}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          }
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#8B5CF6',
            'line-width': 4,
            'line-dasharray': [2, 2]
          }
        });

        routeLayer.current = map.current.getSource('route') as mapboxgl.GeoJSONSource;
      }
    } catch (error) {
      console.error('Failed to fetch route:', error);
    }
  };

  const updateRoute = async () => {
    if (!map.current || !currentOrder.driverLocation || !routeLayer.current) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${currentOrder.driverLocation.lng},${currentOrder.driverLocation.lat};${userDeliveryLng},${userDeliveryLat}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        routeLayer.current.setData({
          type: 'Feature',
          properties: {},
          geometry: data.routes[0].geometry
        });
      }
    } catch (error) {
      console.error('Failed to update route:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-bold">Live Delivery Tracking</h2>
              <p className="text-blue-100">
                {currentOrder.driver} • ETA {calculatedETA}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="w-full h-full rounded-b-3xl" />
          
          {/* Driver Info Overlay */}
          {currentOrder.driverLocation && (
            <div className="absolute top-4 left-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{currentOrder.driver}</h3>
                  <p className="text-sm text-gray-600">{currentOrder.vehicle}</p>
                  <p className="text-sm text-blue-600 font-medium">
                    {calculatedDistance ? `${calculatedDistance} mi away` : 'Location updating...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metrics Overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">ETA</span>
                </div>
                <p className="font-bold text-lg text-gray-900">{calculatedETA}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-medium">Distance</span>
                </div>
                <p className="font-bold text-lg text-gray-900">
                  {calculatedDistance ? `${calculatedDistance} mi` : 
                   currentOrder.driverLocation ? 'Calculating...' : 'Driver location updating...'}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-600 mb-1">
                  <Navigation className="w-4 h-4" />
                  <span className="text-xs font-medium">Speed</span>
                </div>
                <p className="font-bold text-lg text-gray-900">25 mph</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-4">
              <button className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Message Driver</span>
              </button>
              <button className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Call Driver</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Toast component - moved outside
const Toast = React.memo(({ showToast, toastMessage }: { showToast: boolean; toastMessage: string }) => (
  showToast && (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300">
      <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl border border-emerald-500 flex items-center space-x-3">
        <CheckCircle className="w-6 h-6" />
        <span className="font-semibold">{toastMessage}</span>
      </div>
    </div>
  )
));

// ProductCard component - moved outside
const ProductCard = React.memo(({ product, addToCart, addingToCart }: { 
  product: Product; 
  addToCart: (product: Product) => void;
  addingToCart: number | null;
}) => (
  <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
    {product.featured && (
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
        FEATURED
      </div>
    )}
    
    <div className="relative mb-4">
      <img 
        src={product.imageUrl} 
        alt={product.name}
        className="w-full h-32 object-cover rounded-2xl"
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBWMTMwTTcwIDEwMEgxMzAiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+';
        }}
      />
      {!product.inStock && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
          <span className="text-white font-bold">OUT OF STOCK</span>
        </div>
      )}
      {product.labTested && (
        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          LAB TESTED
        </div>
      )}
    </div>
    
    <h3 className="font-bold text-gray-900 mb-2 leading-tight">{product.name}</h3>
    
    <div className="flex items-center justify-between mb-3">
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
        product.strain === 'Sativa' ? 'bg-green-100 text-green-800' :
        product.strain === 'Indica' ? 'bg-purple-100 text-purple-800' :
        'bg-blue-100 text-blue-800'
      }`}>
        {product.strain}
      </span>
      <div className="text-right">
        <div className="font-bold text-sm text-gray-900">THC: {product.thc}</div>
        {product.cbd && <div className="text-xs text-gray-600">CBD: {product.cbd}</div>}
      </div>
    </div>
    
    <div className="flex items-center mb-3">
      <div className="flex items-center mr-3">
        <Star className="w-4 h-4 text-yellow-400 fill-current" />
        <span className="text-sm font-semibold text-gray-700 ml-1">{product.rating}</span>
      </div>
      <span className="text-xs text-gray-500">({product.reviewCount} reviews)</span>
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <span className="font-black text-xl text-gray-900">${product.price}</span>
        {product.originalPrice && (
          <span className="text-sm text-gray-500 line-through ml-2">${product.originalPrice}</span>
        )}
      </div>
      {product.inStock ? (
        <button
          type="button"
          onClick={() => addToCart(product)}
          disabled={addingToCart === product.id}
          className={`p-3 rounded-full transition-all shadow-lg transform focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
            addingToCart === product.id 
              ? 'bg-green-500 scale-110' 
              : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 hover:scale-110 active:scale-95 hover:shadow-xl'
          } text-white`}
        >
          {addingToCart === product.id ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="bg-gray-300 text-gray-500 p-3 rounded-full cursor-not-allowed opacity-50"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}
    </div>
  </div>
));

const FadedSkiesApp = () => {
  // Initialize Stripe for test mode
  const stripePromise = loadStripe('pk_test_51S06B0RrDiazxIUvu0HeQXVHvLss5BT8sb0K98q4yagKmWUUzOkA9ZYe2pxVsVueZSoNud3FRjVE6mOkE8uTJKTf00MOofPfc1');
  
  const [currentView, setCurrentView] = useState<string>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  // const [idVerified] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    dateOfBirth: ''
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User>({
    name: '',
    email: '',
    address: '',
    rewards: 0,
    age: 0,
    idVerified: false
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [realProducts, setRealProducts] = useState<RealTimeProduct[]>([]);
  // const [loading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [trackingModal, setTrackingModal] = useState<{ isOpen: boolean; order: Order | null }>({ isOpen: false, order: null });
  const [mapModal, setMapModal] = useState<{ isOpen: boolean; order: Order | null }>({ isOpen: false, order: null });
  const [deliveryTrackerModal, setDeliveryTrackerModal] = useState<{ isOpen: boolean; order: Order | null }>({ isOpen: false, order: null });
  const [profileModal, setProfileModal] = useState<{ isOpen: boolean; type: string | null }>({ isOpen: false, type: null });
  const [rewardsModal, setRewardsModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [paymentMethodsModal, setPaymentMethodsModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [notificationsModal, setNotificationsModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [privacySecurityModal, setPrivacySecurityModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [deliveryAddressesModal, setDeliveryAddressesModal] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    age: 0,
    address: ''
  });
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number; heading: number; speed: number }>({
    lat: 30.2672,
    lng: -97.7431,
    heading: 45,
    speed: 25
  });

  // App preferences state
  const [appPreferences, setAppPreferences] = useState({
    darkMode: false,
    biometricLogin: true,
    soundEffects: true,
    analytics: false
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    promotionsDeals: true,
    newProducts: false,
    deliveryReminders: true,
    fsRewards: true,
    smsNotifications: false,
    emailUpdates: true
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    locationTracking: true,
    purchaseHistory: true,
    analytics: false,
    thirdPartySharing: false,
    biometricLogin: true
  });

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'Apple Pay', icon: '🍎', status: 'Connected', primary: true, details: '' },
    { id: 2, type: 'Visa', icon: '💳', status: 'Active', primary: false, details: '•••• 4242' },
    { id: 3, type: 'FS Coin', icon: '🪙', status: 'Available', primary: false, details: `${user.rewards} coins` }
  ]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  // const [editingPayment] = useState(null);
  const [newPaymentForm, setNewPaymentForm] = useState({
    type: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });

  // Database functions for user data management
  const updateUserProfile = async (profileData: any) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('users')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          age: profileData.age,
          address: profileData.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id)
        .select()
        .single();

      if (error) throw error;
      
      setUser(prev => ({
        ...prev,
        name: data.name,
        phone: data.phone,
        age: data.age,
        address: data.address
      }));
      
      setToastMessage('Profile updated successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      setToastMessage('Failed to update profile');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      throw error;
    }
  };

  const updateNotificationSettings = async (settings: any) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: authUser.id,
          notification_settings: settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setNotificationSettings(settings);
      setToastMessage('Notification settings updated!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      return data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setToastMessage('Failed to update notification settings');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      throw error;
    }
  };

  const updatePrivacySettings = async (settings: any) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: authUser.id,
          privacy_settings: settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setPrivacySettings(settings);
      setToastMessage('Privacy settings updated!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      return data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      setToastMessage('Failed to update privacy settings');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      throw error;
    }
  };

  const updateAppPreferences = async (preferences: any) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: authUser.id,
          app_preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setAppPreferences(preferences);
      setToastMessage('App preferences updated!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      return data;
    } catch (error) {
      console.error('Error updating app preferences:', error);
      setToastMessage('Failed to update app preferences');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      throw error;
    }
  };

  // Secure payment method functions with database integration
  const loadUserPaymentMethods = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error('No authenticated user');

      // Use the clean function that automatically handles expired cards and gets current user's UUID
      const { data, error } = await supabase.rpc('get_user_payment_methods_auto');

      if (error) {
        console.error('❌ Error loading payment methods from database:', error.message);
        setToastMessage('Failed to load payment methods');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      if (data && data.length > 0) {
        console.log('💳 Loaded payment methods from database:', data);
        const formattedMethods = data.map((method: any) => ({
          id: method.id,
          type: method.payment_type,
          icon: method.icon || '💳',
          status: method.status || 'Active',
          primary: method.is_primary,
          details: method.masked_details || method.details || ''
        }));
        setPaymentMethods(formattedMethods);
      } else {
        console.log('💳 No payment methods found in database');
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('❌ Error loading payment methods:', error);
      setPaymentMethods([]);
    }
  };

  const addPaymentMethodToDatabase = async (paymentData: any) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error('No authenticated user');

      if (paymentData.type === 'card') {
        // Use the automatic card management function with current user's UUID
        const { data, error } = await supabase.rpc('add_or_update_card_auto', {
          p_card_number: paymentData.cardNumber,
          p_expiry_month: paymentData.expiryDate.split('/')[0],
          p_expiry_year: '20' + paymentData.expiryDate.split('/')[1],
          p_cvv: paymentData.cvv,
          p_cardholder_name: paymentData.name
        });

        if (error) throw error;
        
        console.log('💳 Card automatically managed in database:', data);
        return { id: data };
      } else {
        // Handle non-card payment methods with automatic UUID
        const { data, error } = await supabase.rpc('add_payment_method_auto', {
          p_payment_type: paymentData.type,
          p_masked_details: paymentData.details,
          p_icon: paymentData.icon,
          p_is_primary: paymentData.primary
        });

        if (error) throw error;
        
        console.log('💳 Payment method added to database:', data);
        return data;
      }
    } catch (error) {
      console.error('❌ Error adding payment method to database:', error);
      throw error;
    }
  };

  const removePaymentMethodFromDatabase = async (methodId: number) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId)
        .eq('user_id', authUser.id); // Ensure user can only delete their own payment methods

      if (error) throw error;
      
      console.log('💳 Payment method removed from database:', methodId);
    } catch (error) {
      console.error('❌ Error removing payment method from database:', error);
      throw error;
    }
  };

  const setPrimaryPaymentMethodInDatabase = async (methodId: number) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) throw new Error('No authenticated user');

      // First, remove primary from all user's payment methods
      const { error: resetError } = await supabase
        .from('payment_methods')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('user_id', authUser.id);

      if (resetError) throw resetError;

      // Then set the selected method as primary
      const { error: updateError } = await supabase
        .from('payment_methods')
        .update({ is_primary: true, updated_at: new Date().toISOString() })
        .eq('id', methodId)
        .eq('user_id', authUser.id); // Ensure user can only update their own payment methods

      if (updateError) throw updateError;
      
      console.log('💳 Primary payment method updated in database:', methodId);
    } catch (error) {
      console.error('❌ Error setting primary payment method in database:', error);
      throw error;
    }
  };

  const toggleAppPreference = async (key: keyof typeof appPreferences) => {
    const newPreferences = {
      ...appPreferences,
      [key]: !appPreferences[key]
    };
    
    try {
      await updateAppPreferences(newPreferences);
    } catch (error) {
      console.error('Error toggling app preference:', error);
    }
  };

  // Initialize edit profile data when user changes
  useEffect(() => {
    setEditProfileData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      age: user.age,
      address: user.address || ''
    });
  }, [user]);

  // Load real-time data and set up connections
  useEffect(() => {
    const loadData = async () => {
      try {
        // setLoading(true);
        
        // Load products from Supabase - no fallback to mock data
        const productsData = await realTimeService.getProducts();
        console.log('Loaded products from Supabase:', productsData?.length);
        setRealProducts(productsData);
        
        // Load user payment methods if authenticated
        if (isAuthenticated && user.email) {
          await loadUserPaymentMethods();
        }
        
        // Load user orders if authenticated
        if (isAuthenticated && user.email) {
          try {
            const ordersData = await realTimeService.getOrders(user.email);
            
            // Process orders with real-time driver location data
            const processedOrders = await Promise.all(ordersData.map(async (order: RealTimeOrder) => {
              // Get user's delivery address (Austin downtown - replace with actual user location)
              const userDeliveryLat = 30.2672;
              const userDeliveryLng = -97.7431;
              
              let estimatedDelivery = getStatusBasedETA(order.status);
              let distance: number | undefined = undefined;
              let driverLocation = order.driver_location;
              
              // If order has a driver assigned, try to get the latest driver location
              if (order.driver_id && order.driver_id !== 'Driver Assigned') {
                try {
                  // Fetch latest driver location from database
                  const { data: driverData } = await supabase
                    .from('drivers')
                    .select('current_location')
                    .eq('id', order.driver_id)
                    .single();
                  
                  if (driverData && driverData.current_location) {
                    driverLocation = driverData.current_location;
                    console.log(`📍 Found driver location for order ${order.order_id}:`, driverLocation);
                  }
                } catch (error) {
                  console.log(`⚠️ Could not fetch driver location for order ${order.order_id}:`, error);
                }
              }
              
              // Calculate real-time delivery time if we have driver location
              if (driverLocation && driverLocation.lat && driverLocation.lng) {
                distance = calculateDistance(
                  driverLocation.lat,
                  driverLocation.lng,
                  userDeliveryLat,
                  userDeliveryLng
                );
                
                const etaMinutes = calculateDeliveryTime(distance, order.status);
                estimatedDelivery = formatDeliveryTime(etaMinutes);
                
                console.log(`🚚 Order ${order.order_id} - Real Distance: ${distance}mi, ETA: ${estimatedDelivery}`);
              } else {
                console.log(`⚠️ Order ${order.order_id} - No driver location, using status-based ETA: ${estimatedDelivery}`);
              }
              
              return {
                id: order.order_id,
                status: order.status,
                items: order.items.map((item: any) => item.name),
                total: order.total,
                date: order.created_at,
                estimatedDelivery,
                distance,
                driver: order.driver_id ? 'Driver Assigned' : 'Awaiting Driver',
                vehicle: order.driver_id ? 'Vehicle Info' : 'Not Assigned',
                driverLocation: driverLocation
              };
            }));
            
            setOrders(processedOrders);
          } catch (orderError) {
            console.warn('Failed to load orders:', orderError);
            // Keep empty orders array
          }
        }
        
        // Connect to real-time service
        if (isAuthenticated && user.email) {
          realTimeService.connect(user.email);
        }
        
        // Check connection status
        const connectionStatus = realTimeService.isSocketConnected();
        console.log('Supabase real-time connection status:', connectionStatus);
        
        // Set up real-time listeners with delivery time calculations
        realTimeService.onOrderUpdate((order: RealTimeOrder) => {
          setOrders(prev => prev.map(o => {
            if (o.id === order.order_id) {
              // Get user's delivery address (you might want to store this in user profile)
              const userDeliveryLat = 30.2672; // Austin downtown - replace with actual user location
              const userDeliveryLng = -97.7431;
              
              let updatedOrder = { ...o, status: order.status };
              
              // If we have driver location, calculate real-time delivery time
              if (order.driver_location && order.driver_location.lat && order.driver_location.lng) {
                const distance = calculateDistance(
                  order.driver_location.lat,
                  order.driver_location.lng,
                  userDeliveryLat,
                  userDeliveryLng
                );
                
                const etaMinutes = calculateDeliveryTime(distance, order.status);
                const formattedEta = formatDeliveryTime(etaMinutes);
                
                updatedOrder = {
                  ...updatedOrder,
                  distance,
                  etaMinutes,
                  estimatedDelivery: formattedEta,
                  driverLocation: order.driver_location,
                  lastUpdated: new Date().toISOString()
                };
                
                console.log(`🚚 Order ${order.order_id} - Distance: ${distance}mi, ETA: ${formattedEta}`);
              } else {
                // Use status-based ETA when no GPS is available
                const statusBasedETA = getStatusBasedETA(order.status);
                updatedOrder = {
                  ...updatedOrder,
                  estimatedDelivery: statusBasedETA,
                  lastUpdated: new Date().toISOString()
                };
              }
              
              return updatedOrder;
            }
            return o;
          }));
        });

        // Listen for order cancellations
        realTimeService.onOrderCancelled((order: RealTimeOrder) => {
          // Update order status in the list
          setOrders(prev => prev.map(o => 
            o.id === order.order_id 
              ? { ...o, status: 'cancelled' }
              : o
          ));
          
          // Show cancellation notification to user
          setToastMessage(`Order ${order.order_id} has been cancelled by admin.`);
          setShowToast(true);
        });
        
        // Set up periodic order updates to refresh driver location data
        const orderUpdateInterval = setInterval(async () => {
          if (isAuthenticated && user.email && orders.length > 0) {
            try {
              const updatedOrdersData = await realTimeService.getOrders(user.email);
              
              // Process orders with latest driver location data
              const updatedOrders = await Promise.all(updatedOrdersData.map(async (order: RealTimeOrder) => {
                const existingOrder = orders.find(o => o.id === order.order_id);
                if (!existingOrder) return null;
                
                // Get user's delivery address
                const userDeliveryLat = 30.2672;
                const userDeliveryLng = -97.7431;
                
                let driverLocation = order.driver_location;
                let estimatedDelivery = existingOrder.estimatedDelivery;
                let distance = existingOrder.distance;
                
                // If order has a driver assigned, try to get the latest driver location
                if (order.driver_id && order.driver_id !== 'Driver Assigned') {
                  try {
                    const { data: driverData } = await supabase
                      .from('drivers')
                      .select('current_location')
                      .eq('id', order.driver_id)
                      .single();
                    
                    if (driverData && driverData.current_location) {
                      driverLocation = driverData.current_location;
                    }
                  } catch (error) {
                    console.log(`⚠️ Could not fetch driver location for order ${order.order_id}:`, error);
                  }
                }
                
                // Calculate real-time delivery time if we have driver location
                if (driverLocation && driverLocation.lat && driverLocation.lng) {
                  distance = calculateDistance(
                    driverLocation.lat,
                    driverLocation.lng,
                    userDeliveryLat,
                    userDeliveryLng
                  );
                  
                  const etaMinutes = calculateDeliveryTime(distance, order.status);
                  estimatedDelivery = formatDeliveryTime(etaMinutes);
                  
                  console.log(`🔄 Order ${order.order_id} - Updated Distance: ${distance}mi, ETA: ${estimatedDelivery}`);
                }
                
                return {
                  ...existingOrder,
                  status: order.status,
                  estimatedDelivery,
                  distance,
                  driverLocation,
                  lastUpdated: new Date().toISOString()
                };
              }));
              
              // Filter out null values and update orders
              const validOrders = updatedOrders.filter(order => order !== null);
              setOrders(validOrders);
            } catch (error) {
              console.log('Periodic order update failed:', error);
            }
          }
        }, 30000); // Update every 30 seconds

        // Cleanup interval on unmount
        return () => clearInterval(orderUpdateInterval);
        
        // realTimeService.onOrderDelivered((order: RealTimeOrder) => {
        //   setOrders(prev => prev.map(o => 
        //     o.id === order.order_id 
        //       ? { ...o, status: order.status, deliveredAt: new Date().toLocaleTimeString() }
        //       : o
        //   ));
        //   setToastMessage(`Order ${order.order_id} delivered!`);
        //   setShowToast(true);
        // });
        
        // Data loading completed successfully
        console.log('Data loading completed');
        
        // Set up auto-refresh for delivery times every minute
        const deliveryTimeInterval = setInterval(() => {
          if (isAuthenticated && user.email) {
            setOrders(prev => prev.map(order => {
              // Only update active orders (not delivered or cancelled)
              if (order.status === 'delivered' || order.status === 'cancelled') {
                return order;
              }

              // Get user's delivery address
              const userDeliveryLat = 30.2672;
              const userDeliveryLng = -97.7431;
              
              let updatedOrder = { ...order };
              
              // Recalculate delivery time based on current status
              if (order.driverLocation && order.driverLocation.lat && order.driverLocation.lng) {
                const distance = calculateDistance(
                  order.driverLocation.lat,
                  order.driverLocation.lng,
                  userDeliveryLat,
                  userDeliveryLng
                );
                
                const etaMinutes = calculateDeliveryTime(distance, order.status);
                const formattedEta = formatDeliveryTime(etaMinutes);
                
                updatedOrder = {
                  ...order,
                  distance,
                  etaMinutes,
                  estimatedDelivery: formattedEta,
                  lastUpdated: new Date().toISOString()
                };
              } else if (order.status === 'in_transit' || order.status === 'accepted') {
                const defaultDistance = 2.5;
                const etaMinutes = calculateDeliveryTime(defaultDistance, order.status);
                const formattedEta = formatDeliveryTime(etaMinutes);
                
                updatedOrder = {
                  ...order,
                  distance: defaultDistance,
                  etaMinutes,
                  estimatedDelivery: formattedEta,
                  lastUpdated: new Date().toISOString()
                };
              }
              
              return updatedOrder;
            }));
          }
        }, 60000); // Update every minute

        // Cleanup interval on unmount
        return () => clearInterval(deliveryTimeInterval);
        setToastMessage('Live data loaded successfully!');
        setShowToast(true);
        
      } catch (error) {
        console.error('Failed to load live data:', error);
        setToastMessage('Failed to load live data. Please check your connection.');
        setShowToast(true);
      } finally {
        // setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      loadData();
    }
    
    // Cleanup
    return () => {
      realTimeService.removeAllListeners();
      realTimeService.disconnect();
    };
  }, [isAuthenticated, user.email]);

  // Update FS Coin balance when user rewards change
  useEffect(() => {
    setPaymentMethods(prev => prev.map(method => 
      method.type === 'FS Coin' 
        ? { ...method, details: `${user.rewards} coins` }
        : method
    ));
  }, [user.rewards]);

  // Delivery addresses state - start with just the user's main address
  const [deliveryAddresses, setDeliveryAddresses] = useState([
    { id: 1, name: 'Home', address: user.address || '', primary: true, type: 'home', instructions: '' }
  ]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddressForm, setNewAddressForm] = useState({
    name: '',
    address: '',
    city: '',
    state: 'TX',
    zipCode: '',
    type: 'home',
    instructions: ''
  });

  // Production-ready address loading with database integration
  useEffect(() => {
    const loadUserAddresses = async () => {
      if (!isAuthenticated || !user.email) return;
      
      try {
        console.log('📋 Loading user addresses for:', user.email);
        
        // First try to load from addresses table
        const { data: addresses, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.email)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: true });
        
        if (error) {
          console.log('⚠️ Addresses table not available, using fallback:', error.message);
          // Fallback to main user address
          setDeliveryAddresses([
            { id: 1, name: 'Home', address: user.address || 'Austin, TX', primary: true, type: 'home', instructions: '' }
          ]);
        } else if (addresses && addresses.length > 0) {
          console.log('📋 Loaded addresses from database:', addresses);
          const formattedAddresses = addresses.map(addr => ({
            id: addr.id,
            name: addr.label || 'Home',
            address: `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip_code}`,
            primary: addr.is_default,
            type: addr.label?.toLowerCase() || 'home',
            instructions: addr.instructions || ''
          }));
          setDeliveryAddresses(formattedAddresses);
        } else {
          console.log('📋 No addresses in database, using main user address');
          setDeliveryAddresses([
            { id: 1, name: 'Home', address: user.address || 'Austin, TX', primary: true, type: 'home', instructions: '' }
          ]);
        }
      } catch (error) {
        console.error('❌ Error loading user addresses:', error);
        // Fallback to default address
        setDeliveryAddresses([
          { id: 1, name: 'Home', address: 'Austin, TX', primary: true, type: 'home', instructions: '' }
        ]);
      }
    };
    
    loadUserAddresses();
  }, [isAuthenticated, user.email, user.address]);

  // Live chat state
  const [liveChatModal, setLiveChatModal] = useState({ isOpen: false });
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'agent', name: 'Sarah from Support', message: 'Hi! How can I help you today?', time: '2:34 PM', avatar: '👩‍💼' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [agentTyping, setAgentTyping] = useState(false);
  const [chatStatus, setChatStatus] = useState('online'); // online, away, busy



  const toggleNotificationSetting = useCallback(async (key: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    
    try {
      await updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }, [notificationSettings, updateNotificationSettings]);

  const togglePrivacySetting = useCallback(async (key: keyof typeof privacySettings) => {
    const newSettings = {
      ...privacySettings,
      [key]: !privacySettings[key]
    };
    
    try {
      await updatePrivacySettings(newSettings);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    }
  }, [privacySettings, updatePrivacySettings]);

  // Secure payment methods functions with database integration
  const addPaymentMethod = useCallback(async () => {
    if (newPaymentForm.type === 'card' && (!newPaymentForm.cardNumber || !newPaymentForm.expiryDate || !newPaymentForm.cvv || !newPaymentForm.name)) {
      setToastMessage('Please fill in all card details');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const paymentData = {
        type: newPaymentForm.type,
        cardNumber: newPaymentForm.cardNumber,
        expiryDate: newPaymentForm.expiryDate,
        cvv: newPaymentForm.cvv,
        name: newPaymentForm.name,
        icon: newPaymentForm.type === 'card' ? '💳' : newPaymentForm.type === 'paypal' ? '💙' : '🔵',
        primary: paymentMethods.length === 0,
        details: newPaymentForm.type === 'card' ? `Expires ${newPaymentForm.expiryDate}` : 'Connected'
      };

      // Add to database first
      const dbMethod = await addPaymentMethodToDatabase(paymentData);

      // Update local state
      const newMethod = {
        id: dbMethod.id,
        type: newPaymentForm.type === 'card' ? `${newPaymentForm.cardNumber.slice(0, 4)} •••• ${newPaymentForm.cardNumber.slice(-4)}` : 
              newPaymentForm.type === 'paypal' ? 'PayPal' : 'Google Pay',
        icon: paymentData.icon,
        status: 'Active',
        primary: paymentData.primary,
        details: paymentData.details
      };

      setPaymentMethods(prev => [...prev, newMethod]);
      setNewPaymentForm({ type: 'card', cardNumber: '', expiryDate: '', cvv: '', name: '' });
      setShowAddPayment(false);
      setToastMessage('Payment method added successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error adding payment method:', error);
      setToastMessage('Failed to add payment method. Please try again.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [newPaymentForm, paymentMethods.length, addPaymentMethodToDatabase]);

  const removePaymentMethod = useCallback(async (id: number) => {
    try {
      // Remove from database first
      await removePaymentMethodFromDatabase(id);

      // Update local state
      setPaymentMethods(prev => {
        const filtered = prev.filter(method => method.id !== id);
        // If we removed the primary method, make the first remaining method primary
        if (filtered.length > 0 && !filtered.some(method => method.primary)) {
          filtered[0].primary = true;
          // Update primary in database
          setPrimaryPaymentMethodInDatabase(filtered[0].id).catch(console.error);
        }
        return filtered;
      });
      setToastMessage('Payment method removed');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error removing payment method:', error);
      setToastMessage('Failed to remove payment method. Please try again.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [removePaymentMethodFromDatabase, setPrimaryPaymentMethodInDatabase]);

  const setPrimaryPaymentMethod = useCallback(async (id: number) => {
    try {
      // Update in database first
      await setPrimaryPaymentMethodInDatabase(id);

      // Update local state
      setPaymentMethods(prev => prev.map(method => ({
        ...method,
        primary: method.id === id
      })));
      setToastMessage('Primary payment method updated');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error setting primary payment method:', error);
      setToastMessage('Failed to update primary payment method. Please try again.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [setPrimaryPaymentMethodInDatabase]);

  // Delivery address functions
  const addDeliveryAddress = useCallback(() => {
    if (!newAddressForm.name || !newAddressForm.address || !newAddressForm.city || !newAddressForm.zipCode) {
      alert('Please fill in all required fields');
      return;
    }

    const fullAddress = `${newAddressForm.address}, ${newAddressForm.city}, ${newAddressForm.state} ${newAddressForm.zipCode}`;
    const newAddress = {
      id: Date.now(),
      name: newAddressForm.name,
      address: fullAddress,
      primary: deliveryAddresses.length === 0,
      type: newAddressForm.type,
      instructions: newAddressForm.instructions
    };

    setDeliveryAddresses(prev => [...prev, newAddress]);
    setNewAddressForm({ name: '', address: '', city: '', state: 'TX', zipCode: '', type: 'home', instructions: '' });
    setShowAddAddress(false);
    setEditingAddress(null);
    setToastMessage('Delivery address added successfully');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, [newAddressForm, deliveryAddresses.length]);

  const updateDeliveryAddress = useCallback(() => {
    if (!newAddressForm.name || !newAddressForm.address || !newAddressForm.city || !newAddressForm.zipCode) {
      alert('Please fill in all required fields');
      return;
    }

    const fullAddress = `${newAddressForm.address}, ${newAddressForm.city}, ${newAddressForm.state} ${newAddressForm.zipCode}`;
    setDeliveryAddresses(prev => prev.map(addr => 
      addr.id === editingAddress 
        ? { ...addr, name: newAddressForm.name, address: fullAddress, type: newAddressForm.type, instructions: newAddressForm.instructions }
        : addr
    ));
    setNewAddressForm({ name: '', address: '', city: '', state: 'TX', zipCode: '', type: 'home', instructions: '' });
    setShowAddAddress(false);
    setEditingAddress(null);
    setToastMessage('Address updated successfully');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, [newAddressForm, editingAddress]);

  const removeDeliveryAddress = useCallback((id: number) => {
    setDeliveryAddresses(prev => {
      const filtered = prev.filter(addr => addr.id !== id);
      // If we removed the primary address, make the first remaining address primary
      if (filtered.length > 0 && !filtered.some(addr => addr.primary)) {
        filtered[0].primary = true;
        // Update user's main address if home address was made primary
        if (filtered[0].type === 'home') {
          setUser(prevUser => ({ ...prevUser, address: filtered[0].address }));
        }
      }
      return filtered;
    });
    setToastMessage('Address removed');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const setPrimaryDeliveryAddress = useCallback((id: number) => {
    setDeliveryAddresses(prev => prev.map(addr => {
      const updated = { ...addr, primary: addr.id === id };
      // Update user's main address if this becomes the primary address
      if (updated.primary && updated.type === 'home') {
        setUser(prevUser => ({ ...prevUser, address: updated.address }));
      }
      return updated;
    }));
    setToastMessage('Primary delivery address updated');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  const editDeliveryAddress = useCallback((address: any) => {
    const addressParts = address.address.split(', ');
    const stateZip = addressParts[addressParts.length - 1].split(' ');
    
    setNewAddressForm({
      name: address.name,
      address: addressParts.slice(0, -2).join(', '),
      city: addressParts[addressParts.length - 2],
      state: stateZip[0] || 'TX',
      zipCode: stateZip[1] || '',
      type: address.type,
      instructions: address.instructions || ''
    });
    setEditingAddress(address.id);
    setShowAddAddress(true);
  }, []);

  // Live chat functions
  const openLiveChat = useCallback(() => {
    setLiveChatModal({ isOpen: true });
    // Simulate agent availability check
    const statuses = ['online', 'away', 'busy'];
    setChatStatus(statuses[Math.floor(Math.random() * statuses.length)]);
  }, []);

  const closeLiveChat = useCallback(() => {
    setLiveChatModal({ isOpen: false });
    setChatInput('');
    setAgentTyping(false);
  }, []);

  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: 'user',
      name: user.name,
      message: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: '👤'
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Simulate agent typing and response
    setAgentTyping(true);
    
    setTimeout(() => {
      setAgentTyping(false);
      
      const responses = [
        "Thanks for reaching out! I'm looking into that for you.",
        "Let me check on that order status for you right away.",
        "I understand your concern. I'll help you resolve this quickly.",
        "That's a great question! Here's what I can tell you...",
        "I see you're asking about delivery. Let me get those details.",
        "Perfect! I can definitely help you with that request.",
        "Thanks for being patient. I have some good news for you!"
      ];
      
      const agentResponse = {
        id: Date.now() + 1,
        sender: 'agent',
        name: 'Sarah from Support',
        message: responses[Math.floor(Math.random() * responses.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: '👩‍💼'
      };
      
      setChatMessages(prev => [...prev, agentResponse]);
    }, 1500 + Math.random() * 2000);
  }, [chatInput, user.name]);

  const handleChatKeyPress = useCallback((e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }, [sendChatMessage]);

  const categories = [
    { id: 'all', name: 'All Products', icon: '🌿', gradient: 'from-green-400 to-emerald-500' },
    { id: 'flower', name: 'Flower', icon: '🌸', gradient: 'from-pink-400 to-rose-500' },
    { id: 'vapes', name: 'Vapes', icon: '💨', gradient: 'from-blue-400 to-cyan-500' },
    { id: 'prerolls', name: 'Pre-rolls', icon: '🚬', gradient: 'from-orange-400 to-amber-500' },
    { id: 'edibles', name: 'Edibles', icon: '🍯', gradient: 'from-purple-400 to-violet-500' }
  ];

  // Use only real products from Supabase - no mock data fallback
  console.log('realProducts from Supabase:', realProducts);
  
  // Show message if no products are available
  if (realProducts.length === 0) {
    console.log('No products available from Supabase');
  }
  
  const products = realProducts.map((product: RealTimeProduct) => ({
    id: parseInt(product.id) || 1,
    name: product.name,
    category: product.category,
    price: product.price,
    originalPrice: null,
    thc: product.thc,
    cbd: product.cbd,
    strain: 'Hybrid',
    rating: 4.8,
    reviewCount: 100,
    imageUrl: product.image_url || 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=400&fit=crop&crop=center',
    description: `${product.name} - Premium quality cannabis product.`,
    effects: ['Relaxed', 'Happy', 'Creative'],
    labTested: true,
    inStock: product.stock > 0,
    featured: false
  }));

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = useCallback((product: Product) => {
    if (!product.inStock) return;
    
    // Set loading state for visual feedback
    setAddingToCart(product.id);
    setTimeout(() => setAddingToCart(null), 500);
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Show toast for quantity increase
        setToastMessage(`Added another ${product.name} to cart!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // Show toast for new item
      setToastMessage(`${product.name} added to cart!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id: number, change: number) => {
    setCart(prev => {
      const updatedCart = prev.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + change;
          if (newQuantity <= 0) {
            setToastMessage(`${item.name} removed from cart`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
            return null;
          }
          if (change > 0) {
            setToastMessage(`Increased ${item.name} quantity`);
          } else {
            setToastMessage(`Decreased ${item.name} quantity`);
          }
          setShowToast(true);
          setTimeout(() => setShowToast(false), 2000);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
      
      return updatedCart;
    });
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAuthSubmit = useCallback(async () => {
    if (authMode === 'login') {
      if (authForm.email && authForm.email.trim() && authForm.password && authForm.password.trim()) {
        try {
          console.log('🔐 Attempting login with:', authForm.email);
          const { data, error } = await supabase.auth.signInWithPassword({
            email: authForm.email,
            password: authForm.password
          });

          if (error) {
            console.error('Login error:', error);
            
            // Provide more specific error messages
            if (error.message.includes('Invalid login credentials')) {
              setToastMessage('Invalid email or password. Please try again.');
            } else if (error.message.includes('Email not confirmed')) {
              setToastMessage('Please check your email and confirm your account before logging in.');
            } else {
              setToastMessage(`Login failed: ${error.message}`);
            }
            setShowToast(true);
            return;
          }

          console.log('✅ Login successful:', data);
          
          // Load full user profile from database
          try {
            console.log('🔍 Loading user profile for auth user ID:', data.user.id);
            console.log('🔍 Auth user email:', data.user.email);
            
            // First try to find user by auth ID
            let { data: userProfile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();
            
            if (profileError) {
              console.log('⚠️ User profile not found by auth ID, trying by email...');
              // If not found by ID, try to find by email
              const { data: userByEmail, error: emailError } = await supabase
                .from('users')
                .select('*')
                .eq('email', data.user.email)
                .single();
              
              if (emailError) {
                console.error('❌ User profile not found by email either:', emailError);
                console.log('💡 Creating user profile in database...');
                
                // Create user profile in database
                const { data: newUserProfile, error: createError } = await supabase
                  .from('users')
                  .insert([{
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user?.user_metadata?.name || authForm.name || 'User',
                    phone: data.user?.user_metadata?.phone || '',
                    is_verified: true
                  }])
                  .select()
                  .single();
                
                if (createError) {
                  console.error('❌ Failed to create user profile:', createError);
                  // Fallback to auth data
                  setUser(prev => ({ 
                    ...prev, 
                    email: authForm.email, 
                    name: data.user?.user_metadata?.name || authForm.name || 'User'
                  }));
                } else {
                  console.log('✅ User profile created:', newUserProfile);
                  userProfile = newUserProfile;
                }
              } else {
                console.log('✅ User profile found by email:', userByEmail);
                userProfile = userByEmail;
              }
            } else {
              console.log('✅ User profile found by auth ID:', userProfile);
            }
            
            if (userProfile) {
              console.log('✅ Setting user data from profile:', userProfile);
              // Set user data from database
              setUser(prev => ({ 
                ...prev, 
                email: userProfile.email,
                name: userProfile.name,
                phone: userProfile.phone || '',
                age: userProfile.age || 0,
                address: userProfile.address || '',
                rewards: userProfile.loyalty_points || 0,
                idVerified: userProfile.is_verified || false
              }));
            }
          } catch (profileError) {
            console.error('❌ Error loading user profile:', profileError);
            // Fallback to auth data
            setUser(prev => ({ 
              ...prev, 
              email: authForm.email, 
              name: data.user?.user_metadata?.name || authForm.name || 'User'
            }));
          }
          
          setIsAuthenticated(true);
          setCurrentView('home');
          setToastMessage('Successfully logged in!');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
          console.error('Login error:', error);
          setToastMessage('Login failed. Please try again.');
          setShowToast(true);
        }
      } else {
        setToastMessage('Please enter email and password');
        setShowToast(true);
      }
    } else if (authMode === 'signup') {
      if (!authForm.name || !authForm.dateOfBirth || !authForm.phone || !authForm.email || !authForm.password) {
        setToastMessage('Please fill in all required fields');
        setShowToast(true);
        return;
      }
      
      if (authForm.password !== authForm.confirmPassword) {
        setToastMessage('Passwords do not match');
        setShowToast(true);
        return;
      }
      
      const birthDate = new Date(authForm.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 21) {
        setToastMessage('You must be 21 or older to use this service');
        setShowToast(true);
        return;
      }
      
      try {
        console.log('🔐 Attempting signup with:', authForm.email);
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              name: authForm.name,
              phone: authForm.phone,
              age: age,
              address: '123 Main St, Austin, TX'
            },
            emailRedirectTo: window.location.origin
          }
        });

        if (error) {
          console.error('Signup error:', error);
          setToastMessage('Signup failed. Please try again.');
          setShowToast(true);
          return;
        }

        console.log('✅ Signup successful:', data);
        
        // Check if email confirmation is required
        if (data.user && !data.user.email_confirmed_at) {
          setToastMessage('Account created! Please check your email (including spam folder) and click the confirmation link, then try logging in again.');
          setShowToast(true);
          setAuthMode('login');
          
          // Show a more detailed message
          setTimeout(() => {
            setToastMessage('If you don\'t see the email, check your spam folder or try creating the account again.');
            setShowToast(true);
          }, 5000);
          return;
        }
        
        // If email is already confirmed or confirmation not required, proceed
        setIsAuthenticated(true);
        setCurrentView('home');
        setUser(prev => ({ 
          ...prev, 
          email: authForm.email, 
          name: authForm.name,
          phone: authForm.phone,
          age: age
        }));
        setToastMessage('Account created and logged in successfully!');
        setShowToast(true);
      } catch (error) {
        console.error('Signup error:', error);
        setToastMessage('Signup failed. Please try again.');
        setShowToast(true);
      }
    } else if (authMode === 'forgot') {
      if (authForm.email && authForm.email.trim()) {
        setToastMessage('Password reset link sent to your email!');
        setAuthMode('login');
        setShowToast(true);
      } else {
        setToastMessage('Please enter your email address');
        setShowToast(true);
      }
    }
  }, [authMode, authForm]);



  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
            // setIdVerified(false);
    setCurrentView('auth');
    setAuthMode('login');
    setCart([]);
    setAuthForm({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      dateOfBirth: ''
    });
  }, []);

  const resetAuthForm = useCallback(() => {
    setAuthForm({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      dateOfBirth: ''
    });
  }, []);

  const handleIdVerification = useCallback(() => {
            // setIdVerified(true);
    setUser(prev => ({ ...prev, idVerified: true }));
    setCurrentView('cart');
  }, []);

  const proceedToCheckout = useCallback(async () => {
    if (!user.idVerified) {
      setCurrentView('id-verification');
    } else {
      // Show payment form instead of creating order directly
      setPaymentAmount(cartTotal + (cartTotal >= 100 ? 0 : 5));
      setShowPayment(true);
    }
  }, [user.idVerified, cartTotal]);

  const handlePaymentSuccess = useCallback(async (paymentIntent: any) => {
    try {
      // Get the authenticated user's UUID
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // Create order through real-time service after successful payment
      const orderData = {
        user_id: authUser.id, // Use UUID instead of email
        customer_name: user.name,
        customer_phone: user.phone || '+1234567890',
        address: user.address,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: paymentAmount,
        payment_intent_id: paymentIntent.id
      };

      const newOrder = await realTimeService.createOrder(orderData);
      
      // Add to local orders
      const localOrder: Order = {
        id: newOrder.order_id,
        status: newOrder.status,
        items: cart.map(item => item.name),
        total: newOrder.total,
        date: newOrder.created_at,
        estimatedDelivery: '1-2 hours',
        driver: 'Driver Assigned',
        vehicle: 'Vehicle Info'
      };
      
      setOrders(prev => [localOrder, ...prev]);
      setCart([]);
      setShowPayment(false);
      setCurrentView('orders');
      
      setToastMessage('Payment successful! Order placed successfully!');
      setShowToast(true);
    } catch (error) {
      console.error('Failed to create order after payment:', error);
      setToastMessage('Payment successful but failed to create order. Please contact support.');
      setShowToast(true);
    }
  }, [user.name, user.phone, user.address, cart, paymentAmount]);

  const handlePaymentError = useCallback((error: string) => {
    console.error('Payment failed:', error);
    setToastMessage(`Payment failed: ${error}`);
    setShowToast(true);
  }, []);

  const handlePaymentCancel = useCallback(() => {
    setShowPayment(false);
  }, []);

  // Simulate live driver location updates
  useEffect(() => {
    if (mapModal.isOpen && mapModal.order?.status === 'in-transit') {
      const interval = setInterval(() => {
        setDriverLocation(prev => ({
          ...prev,
          lat: prev.lat + (Math.random() - 0.5) * 0.002,
          lng: prev.lng + (Math.random() - 0.5) * 0.002,
          heading: prev.heading + (Math.random() - 0.5) * 10,
          speed: Math.max(15, Math.min(35, prev.speed + (Math.random() - 0.5) * 5))
        }));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [mapModal.isOpen, mapModal.order?.status]);

  // Auto-scroll chat to bottom when new messages are added
  useEffect(() => {
    if (liveChatModal.isOpen) {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [chatMessages, agentTyping, liveChatModal.isOpen]);

  return (
    <Elements stripe={stripePromise}>
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        <Toast showToast={showToast} toastMessage={toastMessage} />
        
        {/* Payment Modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md">
              <StripePayment
                amount={paymentAmount}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </div>
          </div>
        )}
      
      {!isAuthenticated ? (
        <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-2xl font-bold">FS</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {authMode === 'login' ? 'Welcome Back' : 
                 authMode === 'signup' ? 'Join Faded Skies' : 
                 'Reset Password'}
              </h1>
              <p className="text-gray-600 font-medium">
                {authMode === 'login' ? 'Sign in to your account' : 
                 authMode === 'signup' ? 'Create your premium account' : 
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
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      value={authForm.dateOfBirth}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
                      autoComplete="bday"
                    />
                    <p className="text-xs text-amber-600 font-medium mt-1">Must be 21+ to use this service</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
                      placeholder="(555) 123-4567"
                      autoComplete="tel"
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
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
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
                      className="w-full px-4 py-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
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

              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white text-gray-900 font-medium"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleAuthSubmit}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {authMode === 'login' ? 'Sign In' : 
                 authMode === 'signup' ? 'Create Account' : 
                 'Send Reset Link'}
              </button>
            </div>

            <div className="mt-8 text-center">
              {authMode === 'login' && (
                <>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold"
                  >
                    Forgot your password?
                  </button>
                  <div className="mt-4">
                    <span className="text-gray-600 text-sm">Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        resetAuthForm();
                      }}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold"
                    >
                      Sign up
                    </button>
                  </div>
                </>
              )}

              {authMode === 'signup' && (
                <div>
                  <span className="text-gray-600 text-sm">Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      resetAuthForm();
                    }}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold"
                  >
                    Sign in
                  </button>
                </div>
              )}

              {authMode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    resetAuthForm();
                  }}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold"
                >
                  Back to sign in
                </button>
              )}
            </div>

            {authMode === 'login' && (
              <div className="mt-6 text-xs text-gray-500 text-center bg-gray-50 p-4 rounded-xl">
                Secure login powered by Supabase. Your data is protected.
              </div>
            )}

            {authMode === 'signup' && (
              <div className="mt-6 text-xs text-gray-500 text-center bg-gray-50 p-4 rounded-xl">
                By creating an account, you agree to our Terms of Service and Privacy Policy. 
                You must be 21+ to use this service.
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Nav Bar */}
          <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white px-6 py-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg font-black">FS</span>
                  </div>
                  <div>
                    <div className="text-xl font-black tracking-tight">Faded Skies</div>
                    <div className="text-xs text-green-100 font-semibold">Premium Cannabis</div>
                  </div>
                </div>
                {user.idVerified && (
                  <div className="flex items-center space-x-1 text-xs bg-green-700/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    <span className="font-semibold">Verified</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  <span>Austin, TX</span>
                </div>
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setCurrentView('cart')}
                    className="relative p-3 bg-emerald-700/80 backdrop-blur-sm rounded-xl hover:bg-emerald-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {currentView === 'home' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-xl">
                <h1 className="text-3xl font-black mb-2">Welcome back, {user.name}!</h1>
                <p className="text-green-100 text-lg mb-6 font-medium">Premium cannabis delivered to your door</p>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl border border-white/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">Rewards Balance</span>
                    <span className="font-black text-2xl">{user.rewards} FS Coins</span>
                  </div>
                  <div className="bg-emerald-600/80 backdrop-blur-sm p-3 rounded-2xl text-center">
                    <span className="text-sm font-bold">🚚 Free delivery on orders $100+</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search premium products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white shadow-sm font-medium"
                  />
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Categories</h3>
                  <div className="flex space-x-3 overflow-x-auto pb-2">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-full whitespace-nowrap transition-all font-semibold shadow-lg ${
                          selectedCategory === category.id
                            ? `bg-gradient-to-r ${category.gradient} text-white shadow-xl transform scale-105`
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl text-gray-900">Premium Products</h3>
                    <button type="button" className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm">
                      View All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filteredProducts.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        addToCart={addToCart}
                        addingToCart={addingToCart}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {currentView === 'cart' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-b-3xl shadow-xl">
                <h1 className="text-3xl font-bold">Your Cart</h1>
                <p className="text-green-100 text-lg">{cartCount} items • ${cartTotal.toFixed(2)}</p>
              </div>

              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <ShoppingCart className="w-16 h-16 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h3>
                    <p className="text-gray-600 mb-8 text-lg">Discover our premium cannabis products</p>
                    <button
                      type="button"
                      onClick={() => setCurrentView('home')}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      🌿 Start Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-8">
                      {cart.map(item => (
                        <div key={item.id} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                          <div className="flex items-center space-x-4">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-2xl"
                            />
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900">{item.name}</h3>
                              <p className="text-gray-600 font-medium">${item.price} each</p>
                              <p className="text-sm text-gray-500">{item.strain} • {item.thc} THC</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-3xl p-6 mb-8 border border-emerald-100">
                      <h3 className="font-bold text-lg mb-4 text-gray-900">Order Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Subtotal:</span>
                          <span className="font-bold">${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Delivery:</span>
                          <span className={`font-bold ${cartTotal >= 100 ? 'text-green-600' : ''}`}>
                            {cartTotal >= 100 ? 'FREE' : '$5.00'}
                          </span>
                        </div>
                        <div className="border-t border-emerald-200 pt-2 flex justify-between items-center">
                          <span className="font-bold text-lg">Total:</span>
                          <span className="font-black text-2xl text-emerald-600">
                            ${(cartTotal + (cartTotal >= 100 ? 0 : 5)).toFixed(2)}
                          </span>
                        </div>
                        {cartTotal < 100 && (
                          <p className="text-sm text-amber-700 mt-3 text-center bg-amber-50 p-3 rounded-xl">
                            Add ${(100 - cartTotal).toFixed(2)} more for free delivery! 🚚
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-gray-900">Payment Methods</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: 'Apple Pay', icon: '🍎' },
                          { name: 'Google Pay', icon: '🔵' },
                          { name: 'Aeropay', icon: '💳' },
                          { name: 'FS Coin', icon: '🪙' }
                        ].map(method => (
                          <button
                            key={method.name}
                            type="button"
                            className="flex items-center justify-center space-x-2 bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-emerald-300 transition-colors font-semibold"
                          >
                            <span className="text-lg">{method.icon}</span>
                            <span>{method.name}</span>
                          </button>
                        ))}
                      </div>
                      <button 
                        type="button"
                        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
                        onClick={proceedToCheckout}
                      >
                        {user.idVerified ? 'Place Order' : '🆔 Verify Age & Place Order'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {currentView === 'id-verification' && (
            <div className="pb-20 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-b-3xl shadow-lg">
                <h1 className="text-3xl font-bold mb-2">ID Verification</h1>
                <p className="text-green-100 text-lg">Verify your age to complete purchase</p>
              </div>

              <div className="p-6">
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 mb-8 shadow-sm">
                  <div className="flex items-center space-x-3 text-amber-800 mb-3">
                    <Shield className="w-6 h-6" />
                    <span className="font-bold text-lg">Age Verification Required</span>
                  </div>
                  <p className="text-amber-700 leading-relaxed">
                    Please upload a valid government-issued ID to verify you are 21 or older. 
                    Your information is secure and encrypted.
                  </p>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="font-bold text-xl mb-4 text-gray-900">Acceptable ID Types</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { name: "Driver's License", icon: "🚗" },
                        { name: "State ID Card", icon: "🆔" },
                        { name: "Passport", icon: "📘" },
                        { name: "Military ID", icon: "🎖️" }
                      ].map(idType => (
                        <div key={idType.name} className="bg-white border-2 border-gray-100 rounded-2xl p-4 text-center hover:border-emerald-200 transition-colors shadow-sm">
                          <div className="text-2xl mb-2">{idType.icon}</div>
                          <span className="text-sm font-semibold text-gray-800">{idType.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-bold text-xl text-gray-900">Upload Your ID</h3>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center bg-gradient-to-br from-gray-50 to-white hover:border-emerald-300 transition-colors">
                      <div className="space-y-6">
                        <div className="flex justify-center space-x-4">
                          <button 
                            type="button"
                            onClick={() => alert('Camera functionality would open here')}
                            className="flex flex-col items-center space-y-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-6 rounded-2xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <Camera className="w-8 h-8" />
                            <span className="text-sm font-bold">Take Photo</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => alert('File upload would open here')}
                            className="flex flex-col items-center space-y-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-6 rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <Upload className="w-8 h-8" />
                            <span className="text-sm font-bold">Upload File</span>
                          </button>
                        </div>
                        <p className="text-gray-600 font-medium">
                          Make sure your ID is clearly visible and not blurry
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                      <h4 className="font-bold mb-3 text-blue-900 text-lg">Photo Guidelines:</h4>
                      <ul className="text-blue-800 space-y-2 font-medium">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span>Ensure all text is clearly readable</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span>Include all four corners of the ID</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span>Avoid glare and shadows</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span>Use a dark background</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setCurrentView('cart')}
                        className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleIdVerification}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-2xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        Verify ID
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'orders' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-b-3xl shadow-xl">
                <h1 className="text-3xl font-bold">Your Orders</h1>
                <p className="text-green-100 text-lg">Track your deliveries</p>
              </div>

              <div className="p-6 space-y-6">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{order.id}</h3>
                        <p className="text-gray-600 font-medium">{formatOrderDate(order.date)}</p>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-500">ETA: {order.estimatedDelivery}</span>
                          {order.distance && (
                            <span className="text-blue-600 font-medium">({order.distance.toFixed(1)} mi)</span>
                          )}
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-bold ${getDisplayStatus(order.status).color}`}>
                        {getDisplayStatus(order.status).icon} {getDisplayStatus(order.status).text}
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-600 font-medium mb-2">Items</p>
                      <p className="font-semibold text-gray-900">{order.items.join(', ')}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xl text-gray-900">${order.total}</span>
                      <button 
                        type="button" 
                        onClick={() => setDeliveryTrackerModal({ isOpen: true, order })}
                        className={`px-6 py-3 rounded-2xl font-bold transition-colors shadow-lg hover:shadow-xl ${
                          order.driverLocation && order.driverLocation.lat && order.driverLocation.lng
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                            : 'bg-gray-400 text-white hover:bg-gray-500'
                        }`}
                      >
                        {order.driverLocation && order.driverLocation.lat && order.driverLocation.lng 
                          ? '📍 Live Track' 
                          : '📍 Track Order'
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentView === 'profile' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-b-3xl shadow-xl">
                <h1 className="text-3xl font-bold">Profile</h1>
                <p className="text-green-100 text-lg">Manage your account & preferences</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Profile Header */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900">{user.name}</h3>
                      <p className="text-gray-600 font-medium">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        {user.idVerified && (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>ID Verified</span>
                          </span>
                        )}
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                          Premium Member
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileModal({ isOpen: true, type: 'edit-profile' })}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* FS Coin Rewards */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-3xl p-6 border border-emerald-100 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl text-gray-900">🪙 FS Coin Rewards</h3>
                    <button
                      type="button"
                      onClick={() => setRewardsModal({ isOpen: true })}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
                    >
                      View Details
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl font-black text-emerald-600">{user.rewards}</span>
                    <span className="font-semibold text-gray-600">Available Balance</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Earn 1 FS Coin for every $1 spent</p>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Account Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: '💳', title: 'Payment Methods', desc: 'Manage cards & payment', modal: 'paymentMethodsModal' },
                      { icon: '🔔', title: 'Notifications', desc: 'Push & email settings', modal: 'notificationsModal' },
                      { icon: '🔒', title: 'Privacy & Security', desc: 'Account protection', modal: 'privacySecurityModal' },
                      { icon: '📍', title: 'Delivery Addresses', desc: 'Manage locations', modal: 'deliveryAddressesModal' }
                    ].map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (item.modal === 'paymentMethodsModal') setPaymentMethodsModal({ isOpen: true });
                          else if (item.modal === 'notificationsModal') setNotificationsModal({ isOpen: true });
                          else if (item.modal === 'privacySecurityModal') setPrivacySecurityModal({ isOpen: true });
                          else if (item.modal === 'deliveryAddressesModal') setDeliveryAddressesModal({ isOpen: true });
                        }}
                        className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all transform hover:scale-[1.02] text-left"
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* App Preferences */}
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-4">App Preferences</h3>
                  <div className="space-y-3">
                    {[
                      { 
                        key: 'darkMode' as keyof typeof appPreferences,
                        icon: '🌙', 
                        title: 'Dark Mode', 
                        desc: 'Switch to dark theme', 
                        enabled: appPreferences.darkMode
                      },
                      { 
                        key: 'biometricLogin' as keyof typeof appPreferences,
                        icon: '📱', 
                        title: 'Biometric Login', 
                        desc: 'Use Face ID / Touch ID', 
                        enabled: appPreferences.biometricLogin
                      },
                      { 
                        key: 'soundEffects' as keyof typeof appPreferences,
                        icon: '🔊', 
                        title: 'Sound Effects', 
                        desc: 'App sounds & notifications', 
                        enabled: appPreferences.soundEffects
                      },
                      { 
                        key: 'analytics' as keyof typeof appPreferences,
                        icon: '📊', 
                        title: 'Usage Analytics', 
                        desc: 'Help improve the app', 
                        enabled: appPreferences.analytics
                      }
                    ].map((item, index) => (
                      <div key={index} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{item.icon}</span>
                          <div>
                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleAppPreference(item.key)}
                          className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                            item.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                            item.enabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`}></div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Support & Help */}
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Support & Help</h3>
                  <div className="space-y-3">
                    {[
                      { icon: '❓', title: 'Help Center', desc: 'FAQs and guides', type: 'help' },
                      { icon: '💬', title: 'Contact Support', desc: 'Get help from our team', type: 'support' },
                      { icon: '⭐', title: 'Rate App', desc: 'Share your feedback', type: 'rate' },
                      { icon: 'ℹ️', title: 'About Faded Skies', desc: 'App info and version', type: 'about' }
                    ].map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setProfileModal({ isOpen: true, type: item.type })}
                        className="w-full bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all text-left flex items-center space-x-4"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <h4 className="font-bold text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('orders')}
                    className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 rounded-2xl p-5 text-left border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors font-bold shadow-sm flex items-center space-x-3"
                  >
                    <Truck className="w-6 h-6" />
                    <span>View Order History</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-red-50 to-red-100 text-red-600 rounded-2xl p-5 text-left border border-red-200 hover:from-red-100 hover:to-red-200 transition-colors font-bold shadow-sm flex items-center space-x-3"
                  >
                    <span className="text-xl">🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentView === 'support' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-b-3xl shadow-xl">
                <h1 className="text-3xl font-bold">Support Center</h1>
                <p className="text-green-100 text-lg">We're here to help 24/7</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={openLiveChat}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 text-left hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <MessageCircle className="w-6 h-6" />
                      <span className="font-bold text-lg">Live Chat</span>
                    </div>
                    <p className="text-blue-100 text-sm">Get instant help from our team</p>
                    <div className="flex items-center space-x-1 mt-2 text-xs">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Online now</span>
                    </div>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => alert('Call initiated: +1 (512) 555-WEED')}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 text-left hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xl">📞</span>
                      <span className="font-bold text-lg">Call Us</span>
                    </div>
                    <p className="text-green-100 text-sm">Speak with support directly</p>
                    <p className="text-xs text-green-200 mt-2">(512) 555-WEED</p>
                  </button>
                </div>

                {/* Help Categories */}
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-4">How can we help?</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { icon: '📦', title: 'Order Issues', desc: 'Track orders, delivery problems, returns', color: 'from-orange-500 to-red-500' },
                      { icon: '💳', title: 'Payment & Billing', desc: 'Payment methods, refunds, FS Coins', color: 'from-blue-500 to-indigo-500' },
                      { icon: '🆔', title: 'Account & Verification', desc: 'ID verification, account settings', color: 'from-purple-500 to-pink-500' },
                      { icon: '🌿', title: 'Product Questions', desc: 'Strains, effects, lab results', color: 'from-green-500 to-emerald-500' },
                      { icon: '🚚', title: 'Delivery Areas', desc: 'Service areas, delivery times', color: 'from-yellow-500 to-orange-500' },
                      { icon: '⚖️', title: 'Legal & Compliance', desc: 'Laws, regulations, licensing', color: 'from-gray-500 to-gray-600' }
                    ].map((category, index) => (
                      <button 
                        key={index}
                        type="button"
                        onClick={() => alert(`Opening ${category.title} help section...`)}
                        className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all text-left flex items-center space-x-4"
                      >
                        <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center text-white text-xl shadow-md`}>
                          {category.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{category.title}</h4>
                          <p className="text-sm text-gray-600">{category.desc}</p>
                        </div>
                        <span className="text-gray-400">›</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* FAQ Section */}
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-3">
                    {[
                      {
                        question: "How long does delivery take?",
                        answer: "Most deliveries arrive within 1-2 hours. Express delivery is available for orders over $150."
                      },
                      {
                        question: "What's the minimum order amount?",
                        answer: "Our minimum order is $25. Free delivery on orders over $100."
                      },
                      {
                        question: "Do I need to show ID upon delivery?",
                        answer: "Yes, you must show a valid government-issued ID proving you're 21+ at the time of delivery."
                      },
                      {
                        question: "What payment methods do you accept?",
                        answer: "We accept cash, debit cards, Aeropay, Apple Pay, Google Pay, and FS Coins."
                      },
                      {
                        question: "Can I return products?",
                        answer: "Due to cannabis regulations, we cannot accept returns. However, we'll replace any defective products."
                      }
                    ].map((faq, index) => (
                      <details key={index} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                        <summary className="font-semibold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors">
                          {faq.question}
                        </summary>
                        <p className="text-gray-600 mt-3 leading-relaxed">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>

                {/* Contact Options */}
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Other Ways to Reach Us</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      type="button"
                      onClick={() => alert('Email form opened: support@fadedskies.com')}
                      className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all text-left flex items-center space-x-4"
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl">
                        ✉️
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">Email Support</h4>
                        <p className="text-sm text-gray-600">support@fadedskies.com • Response within 2 hours</p>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => alert('Opening WhatsApp chat...')}
                      className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all text-left flex items-center space-x-4"
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-xl">
                        💬
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">WhatsApp</h4>
                        <p className="text-sm text-gray-600">Quick messaging support</p>
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => alert('Opening ticket submission form...')}
                      className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all text-left flex items-center space-x-4"
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white text-xl">
                        🎫
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">Submit a Ticket</h4>
                        <p className="text-sm text-gray-600">For complex issues requiring investigation</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
                  <h3 className="font-bold text-lg text-emerald-800 mb-3">🕒 Support Hours</h3>
                  <div className="space-y-2 text-emerald-700">
                    <div className="flex justify-between">
                      <span className="font-medium">Monday - Friday:</span>
                      <span>8:00 AM - 10:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Saturday - Sunday:</span>
                      <span>9:00 AM - 9:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Emergency Line:</span>
                      <span className="font-bold">24/7 Available</span>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Quick Links</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Terms of Service', icon: '📄' },
                      { name: 'Privacy Policy', icon: '🔒' },
                      { name: 'Delivery Areas', icon: '🗺️' },
                      { name: 'Product Lab Results', icon: '🧪' },
                      { name: 'Cannabis Education', icon: '📚' },
                      { name: 'Loyalty Program', icon: '🪙' }
                    ].map((link, index) => (
                      <button 
                        key={index}
                        type="button"
                        onClick={() => alert(`Opening ${link.name}...`)}
                        className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left flex items-center space-x-3"
                      >
                        <span className="text-lg">{link.icon}</span>
                        <span className="font-medium text-gray-900 text-sm">{link.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100">
                  <h3 className="font-bold text-lg text-red-800 mb-2">🚨 Emergency Support</h3>
                  <p className="text-red-700 text-sm mb-3">For urgent delivery issues or safety concerns</p>
                  <button 
                    type="button"
                    onClick={() => alert('Emergency line: +1 (512) 555-911')}
                    className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    📞 Call Emergency Line
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-4 flex justify-around shadow-xl">
            {[
              { id: 'home', icon: Menu, label: 'Shop' },
              { id: 'orders', icon: Truck, label: 'Orders' },
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'support', icon: MessageCircle, label: 'Support' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  currentView === item.id 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
      
      {/* Track Order Modal */}
      {trackingModal.isOpen && trackingModal.order && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Track Order</h2>
                <button
                  type="button"
                  onClick={() => setTrackingModal({ isOpen: false, order: null })}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-100 text-lg">{trackingModal.order.id}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getDisplayStatus(trackingModal.order.status).color.replace('100', '600').replace('800', 'white')}`}>
                  {getDisplayStatus(trackingModal.order.status).icon} {getDisplayStatus(trackingModal.order.status).text}
                </span>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {/* Cancelled Order Message */}
              {trackingModal.order.status === 'cancelled' && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 mb-6 border border-red-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                      <X className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">Order Cancelled</h4>
                      <p className="text-red-600 font-semibold">This order has been cancelled by admin</p>
                      <p className="text-sm text-gray-600 mt-2">If you have any questions, please contact support</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Driver Info for Active Orders */}
              {(trackingModal.order.status === 'assigned' || trackingModal.order.status === 'accepted' || 
                trackingModal.order.status === 'picked_up' || trackingModal.order.status === 'in_transit') && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900">{trackingModal.order.driver}</h4>
                        <p className="text-blue-600 font-semibold">Your Delivery Driver</p>
                        <p className="text-sm text-gray-600">{trackingModal.order.vehicle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-green-600 font-bold">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                      {trackingModal.order.currentLocation || 'Driver location updating...'}
                      {trackingModal.order.distance && (
                        <span className="ml-2 text-blue-600 font-medium">
                          • {trackingModal.order.distance} mi away
                        </span>
                      )}
                    </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => alert('Message sent to driver!')}
                      className="bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setMapModal({ isOpen: true, order: trackingModal.order })}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center justify-center space-x-2"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Live Map</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Detailed Tracking Timeline */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-lg mb-4 text-gray-900">Tracking Timeline</h4>
                  <div className="space-y-4">
                    {[
                      { 
                        title: 'Order Confirmed', 
                        description: 'Your order has been received and confirmed',
                        time: '2:15 PM',
                        completed: true,
                        icon: '✅'
                      },
                      { 
                        title: 'Age Verification Complete', 
                        description: 'ID verification successful',
                        time: '2:16 PM',
                        completed: true,
                        icon: '🆔'
                      },
                      { 
                        title: 'Preparing Order', 
                        description: 'Your items are being carefully prepared',
                        time: '2:20 PM',
                        completed: true,
                        icon: '📦'
                      },
                      trackingModal.order.status === 'delivered' ? {
                        title: 'Out for Delivery', 
                        description: `Driver ${trackingModal.order.driver} is on the way`,
                        time: '2:45 PM',
                        completed: true,
                        icon: '🚗'
                      } : {
                        title: 'Out for Delivery', 
                        description: `Driver ${trackingModal.order.driver} is ${trackingModal.order.currentLocation}`,
                        time: `ETA ${trackingModal.order.estimatedDelivery}`,
                        completed: false,
                        icon: '🚗',
                        current: true
                      },
                      {
                        title: trackingModal.order.status === 'delivered' ? 'Delivered' : 'Delivery', 
                        description: trackingModal.order.status === 'delivered' ? 'Order delivered successfully' : 'We\'ll notify you when delivered',
                        time: trackingModal.order.deliveredAt || 'Pending',
                        completed: trackingModal.order.status === 'delivered',
                        icon: '🏠'
                      }
                    ].map((step, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${
                          step.completed 
                            ? 'bg-green-500 text-white' 
                            : step.current 
                              ? 'bg-blue-500 text-white animate-pulse' 
                              : 'bg-gray-200 text-gray-500'
                        }`}>
                          {step.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className={`font-bold ${
                              step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {step.title}
                            </h5>
                            <span className={`text-sm font-medium ${
                              step.completed || step.current ? 'text-gray-700' : 'text-gray-400'
                            }`}>
                              {step.time}
                            </span>
                          </div>
                          <p className={`text-sm ${
                            step.completed || step.current ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-lg text-gray-900">Order Items</h4>
                  {trackingModal.order.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="font-medium text-gray-900">{item}</span>
                      <span className="text-sm text-gray-600">1x</span>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Total Amount</p>
                      <p className="text-2xl font-black text-emerald-600">${trackingModal.order.total}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-600">Delivery Address</p>
                      <p className="font-bold text-gray-900">{user.address}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                {trackingModal.order.status === 'in-transit' && (
                  <button 
                    type="button"
                    onClick={() => alert('Support contacted! We\'ll help resolve any issues.')}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
                  >
                    📞 Contact Support
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setTrackingModal({ isOpen: false, order: null })}
                  className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {profileModal.isOpen && profileModal.type && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            {(() => {
              switch (profileModal.type) {
                case 'edit-profile':
                  return (
                    <>
                      <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">✏️ Edit Profile</h2>
                          <button
                            type="button"
                            onClick={() => setProfileModal({ isOpen: false, type: null })}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-green-100">Update your personal information</p>
                      </div>
                      <div className="p-6 max-h-96 overflow-y-auto">
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <User className="w-12 h-12 text-white" />
                            </div>
                            <button type="button" className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-200 transition-colors">
                              Change Photo
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                              <input
                                type="text"
                                value={editProfileData.name}
                                onChange={(e) => setEditProfileData({...editProfileData, name: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                              <input
                                type="email"
                                value={editProfileData.email}
                                onChange={(e) => setEditProfileData({...editProfileData, email: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                              <input
                                type="tel"
                                value={editProfileData.phone}
                                onChange={(e) => setEditProfileData({...editProfileData, phone: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                placeholder="(555) 123-4567"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                              <input
                                type="number"
                                value={editProfileData.age || ''}
                                onChange={(e) => setEditProfileData({...editProfileData, age: parseInt(e.target.value) || 0})}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                placeholder="Enter your age"
                                min="21"
                                max="120"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                              <input
                                type="text"
                                value={editProfileData.address}
                                onChange={(e) => setEditProfileData({...editProfileData, address: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                                placeholder="Enter your delivery address"
                              />
                            </div>
                          </div>
                          
                          <button 
                            type="button" 
                            onClick={async () => {
                              try {
                                await updateUserProfile(editProfileData);
                                setProfileModal({ isOpen: false, type: null });
                              } catch (error) {
                                console.error('Profile update error:', error);
                              }
                            }}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-2xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </>
                  );

                case 'about':
                  return (
                    <>
                      <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">ℹ️ About Faded Skies</h2>
                          <button
                            type="button"
                            onClick={() => setProfileModal({ isOpen: false, type: null })}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-green-100">Premium cannabis delivery app</p>
                      </div>
                      <div className="p-6 max-h-96 overflow-y-auto">
                        <div className="text-center mb-6">
                          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-white text-2xl font-bold">FS</span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">Faded Skies</h3>
                          <p className="text-gray-600 font-medium">Version 2.1.0</p>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-100">
                            <h4 className="font-bold text-emerald-800 mb-2">🌿 Our Mission</h4>
                            <p className="text-emerald-700 text-sm">
                              Providing safe, legal access to premium cannabis products with fast, 
                              reliable delivery and exceptional customer service.
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2">
                              <span className="font-semibold text-gray-900">Founded</span>
                              <span className="text-gray-600">2020</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="font-semibold text-gray-900">Headquarters</span>
                              <span className="text-gray-600">Austin, Texas</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="font-semibold text-gray-900">Licensed</span>
                              <span className="text-green-600 font-bold">✅ Fully Compliant</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="font-semibold text-gray-900">Delivery Areas</span>
                              <span className="text-gray-600">15+ Cities</span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <button type="button" className="w-full bg-emerald-100 text-emerald-700 py-3 rounded-2xl font-bold hover:bg-emerald-200 transition-colors">
                              📄 Terms of Service
                            </button>
                            <button type="button" className="w-full bg-blue-100 text-blue-700 py-3 rounded-2xl font-bold hover:bg-blue-200 transition-colors">
                              🔒 Privacy Policy  
                            </button>
                            <button type="button" className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                              📜 Licenses & Compliance
                            </button>
                          </div>
                          
                          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                            <p>© 2025 Faded Skies. All rights reserved.</p>
                            <p className="mt-1">Licensed cannabis retailer • 21+ only</p>
                          </div>
                        </div>
                      </div>
                    </>
                  );

                case 'payment':
                  return (
                    <div className="text-center py-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">💳 Payment Methods</h3>
                      <p className="text-gray-600 mb-6">Use the dedicated Payment Methods section to manage your payment options.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileModal({ isOpen: false, type: null });
                          setPaymentMethodsModal({ isOpen: true });
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg"
                      >
                        Open Payment Methods
                      </button>
                    </div>
                  );

                case 'addresses':
                  return (
                    <>
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">📍 Delivery Addresses</h2>
                          <button
                            type="button"
                            onClick={() => setProfileModal({ isOpen: false, type: null })}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-green-100">Manage your delivery locations</p>
                      </div>
                      <div className="p-6 max-h-96 overflow-y-auto">
                        {!showAddAddress ? (
                          <>
                            <div className="space-y-4 mb-6">
                              {deliveryAddresses.map((addr) => (
                                <div key={addr.id} className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-green-200 transition-colors">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-2xl">
                                        {addr.type === 'home' ? '🏠' : addr.type === 'work' ? '🏢' : '📍'}
                                      </span>
                                      <h4 className="font-bold text-gray-900">{addr.name}</h4>
                                      {addr.primary && (
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">PRIMARY</span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {!addr.primary && (
                                        <button 
                                          type="button" 
                                          onClick={() => setPrimaryDeliveryAddress(addr.id)}
                                          className="text-green-600 hover:text-green-700 text-xs font-semibold"
                                        >
                                          Set Primary
                                        </button>
                                      )}
                                      <button 
                                        type="button" 
                                        onClick={() => editDeliveryAddress(addr)}
                                        className="text-blue-500 hover:text-blue-600"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => removeDeliveryAddress(addr.id)}
                                        className="text-red-500 hover:text-red-600"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-gray-600 text-sm">{addr.address}</p>
                                  {addr.instructions && (
                                    <p className="text-gray-500 text-xs mt-2 italic">Instructions: {addr.instructions}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setShowAddAddress(true)}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                            >
                              ➕ Add New Address
                            </button>
                          </>
                        ) : (
                          <div className="space-y-6">
                            <h3 className="font-bold text-xl text-gray-900">
                              {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </h3>
                            
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Name *</label>
                                  <input
                                    type="text"
                                    value={newAddressForm.name}
                                    onChange={(e) => setNewAddressForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    placeholder="Home, Work, etc."
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                                  <select
                                    value={newAddressForm.type}
                                    onChange={(e) => setNewAddressForm(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                  >
                                    <option value="home">🏠 Home</option>
                                    <option value="work">🏢 Work</option>
                                    <option value="other">📍 Other</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address *</label>
                                <input
                                  type="text"
                                  value={newAddressForm.address}
                                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, address: e.target.value }))}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                  placeholder="Enter your delivery address"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                                  <input
                                    type="text"
                                    value={newAddressForm.city}
                                    onChange={(e) => setNewAddressForm(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    placeholder="Austin"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                                  <select
                                    value={newAddressForm.state}
                                    onChange={(e) => setNewAddressForm(prev => ({ ...prev, state: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                  >
                                    <option value="TX">Texas</option>
                                    <option value="CA">California</option>
                                    <option value="CO">Colorado</option>
                                    <option value="NY">New York</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code *</label>
                                <input
                                  type="text"
                                  value={newAddressForm.zipCode}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                                    setNewAddressForm(prev => ({ ...prev, zipCode: value }));
                                  }}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                  placeholder="78701"
                                  maxLength={5}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Instructions</label>
                                <textarea
                                  value={newAddressForm.instructions}
                                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, instructions: e.target.value }))}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                                  placeholder="Ring doorbell, leave at door, etc."
                                  rows={3}
                                />
                              </div>

                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <h4 className="font-bold text-amber-800 mb-2">🚚 Delivery Zone Check</h4>
                                <p className="text-amber-700 text-sm">
                                  We'll verify this address is in our delivery area before saving.
                                  Current service areas: Austin, Round Rock, Cedar Park, Lakeway.
                                </p>
                              </div>
                            </div>

                            <div className="flex space-x-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddAddress(false);
                                  setEditingAddress(null);
                                  setNewAddressForm({ name: '', address: '', city: '', state: 'TX', zipCode: '', type: 'home', instructions: '' });
                                }}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={editingAddress ? updateDeliveryAddress : addDeliveryAddress}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                              >
                                {editingAddress ? 'Update Address' : 'Save Address'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );

                case 'notifications':
                  return (
                    <>
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">🔔 Notifications</h2>
                          <button
                            type="button"
                            onClick={() => setProfileModal({ isOpen: false, type: null })}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-purple-100">Customize your notification preferences</p>
                      </div>
                      <div className="p-6 max-h-96 overflow-y-auto">
                        {[
                          { 
                            key: 'orderUpdates' as keyof typeof notificationSettings,
                            title: 'Order Updates', 
                            desc: 'Status changes and delivery notifications', 
                            enabled: notificationSettings.orderUpdates 
                          },
                          { 
                            key: 'promotionsDeals' as keyof typeof notificationSettings,
                            title: 'Promotions & Deals', 
                            desc: 'Special offers and discounts', 
                            enabled: notificationSettings.promotionsDeals 
                          },
                          { 
                            key: 'newProducts' as keyof typeof notificationSettings,
                            title: 'New Products', 
                            desc: 'Notifications about new arrivals', 
                            enabled: notificationSettings.newProducts 
                          },
                          { 
                            key: 'deliveryReminders' as keyof typeof notificationSettings,
                            title: 'Delivery Reminders', 
                            desc: 'Reminders before delivery windows', 
                            enabled: notificationSettings.deliveryReminders 
                          },
                          { 
                            key: 'fsRewards' as keyof typeof notificationSettings,
                            title: 'FS Coin Rewards', 
                            desc: 'Updates about your rewards balance', 
                            enabled: notificationSettings.fsRewards 
                          },
                          { 
                            key: 'smsNotifications' as keyof typeof notificationSettings,
                            title: 'SMS Notifications', 
                            desc: 'Text message updates', 
                            enabled: notificationSettings.smsNotifications 
                          },
                          { 
                            key: 'emailUpdates' as keyof typeof notificationSettings,
                            title: 'Email Updates', 
                            desc: 'Email notifications and newsletters', 
                            enabled: notificationSettings.emailUpdates 
                          }
                        ].map((setting, index) => (
                          <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900">{setting.title}</h4>
                              <p className="text-sm text-gray-600">{setting.desc}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleNotificationSetting(setting.key)}
                              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                                setting.enabled ? 'bg-purple-500' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                setting.enabled ? 'translate-x-6' : 'translate-x-0.5'
                              }`}></div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  );

                case 'privacy':
                  return (
                    <>
                      <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">🔒 Privacy & Security</h2>
                          <button
                            type="button"
                            onClick={() => setProfileModal({ isOpen: false, type: null })}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-gray-100">Control your privacy and data settings</p>
                      </div>
                      <div className="p-6 max-h-96 overflow-y-auto">
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
                            <div className="flex items-center space-x-3 mb-2">
                              <Shield className="w-5 h-5 text-amber-600" />
                              <h4 className="font-bold text-amber-800">Data Protection</h4>
                            </div>
                            <p className="text-amber-700 text-sm">Your personal information is encrypted and securely stored.</p>
                          </div>
                          
                          {[
                            { 
                              key: 'locationTracking' as keyof typeof privacySettings,
                              title: 'Location Tracking', 
                              desc: 'Allow location access for delivery', 
                              enabled: privacySettings.locationTracking 
                            },
                            { 
                              key: 'purchaseHistory' as keyof typeof privacySettings,
                              title: 'Purchase History', 
                              desc: 'Store order history for recommendations', 
                              enabled: privacySettings.purchaseHistory 
                            },
                            { 
                              key: 'analytics' as keyof typeof privacySettings,
                              title: 'Analytics', 
                              desc: 'Help improve the app with usage data', 
                              enabled: privacySettings.analytics 
                            },
                            { 
                              key: 'thirdPartySharing' as keyof typeof privacySettings,
                              title: 'Third-party Sharing', 
                              desc: 'Share data with partners for offers', 
                              enabled: privacySettings.thirdPartySharing 
                            },
                            { 
                              key: 'biometricLogin' as keyof typeof privacySettings,
                              title: 'Biometric Login', 
                              desc: 'Use fingerprint/face ID for login', 
                              enabled: privacySettings.biometricLogin 
                            }
                          ].map((setting, index) => (
                            <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{setting.title}</h4>
                                <p className="text-sm text-gray-600">{setting.desc}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => togglePrivacySetting(setting.key)}
                                className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                                  setting.enabled ? 'bg-gray-500' : 'bg-gray-300'
                                }`}
                              >
                                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                                  setting.enabled ? 'translate-x-6' : 'translate-x-0.5'
                                }`}></div>
                              </button>
                            </div>
                          ))}
                          
                          <div className="space-y-3 pt-4">
                            <button type="button" className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors">
                              📄 View Privacy Policy
                            </button>
                            <button type="button" className="w-full bg-amber-600 text-white py-3 rounded-2xl font-bold hover:bg-amber-700 transition-colors">
                              🔑 Change Password
                            </button>
                            <button type="button" className="w-full bg-red-100 text-red-600 py-3 rounded-2xl font-bold hover:bg-red-200 transition-colors">
                              🗑️ Delete My Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  );

                case 'rewards':
                  return (
                    <>
                      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">🪙 FS Coin Rewards</h2>
                          <button
                            type="button"
                            onClick={() => setProfileModal({ isOpen: false, type: null })}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-amber-100">Your rewards program details</p>
                      </div>
                      <div className="p-6 max-h-96 overflow-y-auto">
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="text-6xl font-black text-amber-600 mb-2">{user.rewards}</div>
                            <p className="text-gray-600 font-semibold">FS Coins Available</p>
                            <p className="text-sm text-gray-500 mt-1">Worth ${(user.rewards * 0.01).toFixed(2)} in credits</p>
                          </div>
                          
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200">
                            <h4 className="font-bold text-amber-800 mb-3">How to Earn FS Coins:</h4>
                            <ul className="text-amber-700 text-sm space-y-2">
                              <li>• Earn 1 coin for every $1 spent</li>
                              <li>• Get 100 bonus coins on first order</li>
                              <li>• Earn 50 coins for each friend referral</li>
                              <li>• Special promotions and events</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-gray-900 mb-3">Recent Activity:</h4>
                            <div className="space-y-2">
                              {[
                                { action: 'Purchase reward', amount: '+45', date: '2 days ago' },
                                { action: 'Referral bonus', amount: '+50', date: '1 week ago' },
                                { action: 'Used for discount', amount: '-25', date: '2 weeks ago' }
                              ].map((activity, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                  <div>
                                    <p className="font-medium text-gray-900">{activity.action}</p>
                                    <p className="text-sm text-gray-500">{activity.date}</p>
                                  </div>
                                  <span className={`font-bold ${
                                    activity.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {activity.amount} coins
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <button type="button" className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-4 rounded-2xl font-bold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg">
                            Redeem Rewards
                          </button>
                        </div>
                      </div>
                    </>
                  );

                case 'help':
                  return (
                    <>
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">❓ Help Center</h2>
                          <button
                            type="button"
                            onClick={() => setProfileModal({ isOpen: false, type: null })}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-blue-100">Find answers to common questions</p>
                      </div>
                      <div className="p-6 max-h-96 overflow-y-auto">
                        <div className="space-y-4">
                          {[
                            {
                              category: "Getting Started",
                              questions: [
                                { q: "How do I verify my age?", a: "Upload a government-issued ID in the verification section." },
                                { q: "What areas do you deliver to?", a: "We deliver throughout Austin and surrounding areas." }
                              ]
                            },
                            {
                              category: "Ordering",
                              questions: [
                                { q: "What's the minimum order?", a: "$25 minimum, free delivery over $100." },
                                { q: "How do I use FS Coins?", a: "Apply coins at checkout - 100 coins = $1 credit." }
                              ]
                            },
                            {
                              category: "Delivery",
                              questions: [
                                { q: "How long does delivery take?", a: "Typically 1-2 hours, trackable in real-time." },
                                { q: "Do I need to be present?", a: "Yes, valid ID required at delivery for age verification." }
                              ]
                            }
                          ].map((section, index) => (
                            <div key={index}>
                              <h4 className="font-bold text-gray-900 mb-2 text-lg">{section.category}</h4>
                              <div className="space-y-2">
                                {section.questions.map((qa, qIndex) => (
                                  <details key={qIndex} className="bg-gray-50 rounded-xl p-3">
                                    <summary className="font-semibold text-gray-800 cursor-pointer text-sm">
                                      {qa.q}
                                    </summary>
                                    <p className="text-gray-600 mt-2 text-sm">{qa.a}</p>
                                  </details>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button 
                            type="button"
                            onClick={() => {
                              setProfileModal({ isOpen: false, type: null });
                              setCurrentView('support');
                            }}
                            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors"
                          >
                            View Full Help Center
                          </button>
                        </div>
                      </div>
                    </>
                  );

                case 'support':
                  return (
                    <>
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">💬 Contact Support</h2>
                          <button
                            type="button"
                            onClick={() => setProfileModal({ isOpen: false, type: null })}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-green-100">Get help from our support team</p>
                      </div>
                      <div className="p-6 max-h-96 overflow-y-auto">
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100">
                            <div className="flex items-center space-x-2 text-green-700 mb-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="font-bold">Support is online</span>
                            </div>
                            <p className="text-green-600 text-sm">Average response time: 2 minutes</p>
                          </div>
                          
                          <div className="space-y-3">
                            <button 
                              type="button"
                              onClick={openLiveChat}
                              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span>Start Live Chat</span>
                            </button>
                            
                            <button 
                              type="button"
                              onClick={() => alert('Calling: +1 (512) 555-WEED')}
                              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                            >
                              <span className="text-lg">📞</span>
                              <span>Call Support</span>
                            </button>
                            
                            <button 
                              type="button"
                              onClick={() => alert('Email form opened: support@fadedskies.com')}
                              className="w-full bg-gray-600 text-white py-4 rounded-2xl font-bold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                            >
                              <span className="text-lg">✉️</span>
                              <span>Send Email</span>
                            </button>
                          </div>
                          
                          <div className="bg-gray-50 rounded-2xl p-4">
                            <h4 className="font-bold text-gray-900 mb-2">Support Hours</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex justify-between">
                                <span>Monday - Friday:</span>
                                <span>8 AM - 10 PM</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Weekends:</span>
                                <span>9 AM - 9 PM</span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              setProfileModal({ isOpen: false, type: null });
                              setCurrentView('support');
                            }}
                            className="w-full bg-emerald-100 text-emerald-700 py-3 rounded-2xl font-bold hover:bg-emerald-200 transition-colors"
                          >
                            Visit Support Center
                          </button>
                        </div>
                      </div>
                    </>
                  );

                case 'rate':
                  return (
                    <>
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">⭐ Rate Our App</h2>
                          <button
                            type="button"
                            onClick={() => setProfileModal({ isOpen: false, type: null })}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-orange-100">Help us improve with your feedback</p>
                      </div>
                      <div className="p-6 max-h-96 overflow-y-auto">
                        <div className="space-y-6">
                          <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">How would you rate Faded Skies?</h3>
                            <p className="text-gray-600 mb-4">Your feedback helps us serve you better</p>
                            
                            <div className="flex justify-center space-x-2 mb-6">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => alert(`You rated us ${star} star${star > 1 ? 's' : ''}! Thank you for your feedback.`)}
                                  className="text-4xl text-yellow-400 hover:text-yellow-500 transition-colors"
                                >
                                  ⭐
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-bold text-gray-900">Quick Feedback</h4>
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { emoji: '🚀', text: 'Fast Delivery' },
                                { emoji: '🌿', text: 'Great Products' },
                                { emoji: '💯', text: 'Easy to Use' },
                                { emoji: '💰', text: 'Good Prices' },
                                { emoji: '🏆', text: 'Excellent Service' },
                                { emoji: '📱', text: 'Love the App' }
                              ].map((feedback, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => alert(`Thanks for the "${feedback.text}" feedback!`)}
                                  className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 text-center transition-colors border border-gray-200"
                                >
                                  <div className="text-2xl mb-1">{feedback.emoji}</div>
                                  <div className="text-sm font-semibold text-gray-800">{feedback.text}</div>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <button 
                              type="button"
                              onClick={() => alert('Opening App Store for rating...')}
                              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors"
                            >
                              📱 Rate on App Store
                            </button>
                            
                            <button 
                              type="button"
                              onClick={() => alert('Opening Google Play for rating...')}
                              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-colors"
                            >
                              🤖 Rate on Google Play
                            </button>
                            
                            <button 
                              type="button"
                              onClick={() => alert('Opening detailed feedback form...')}
                              className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                            >
                              ✍️ Detailed Feedback
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  );

                default:
                  return (
                    <>
                      <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold">Settings</h2>
                          <button
                            type="button"
                            onClick={() => setProfileModal({ isOpen: false, type: null })}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <p className="text-green-100">Feature coming soon!</p>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-600 text-center py-8">This feature is currently under development.</p>
                      </div>
                    </>
                  );
              }
            })()}
            <div className="p-4">
              <button 
                type="button"
                onClick={() => setProfileModal({ isOpen: false, type: null })}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Tracker Modal */}
      {deliveryTrackerModal.isOpen && deliveryTrackerModal.order && (
        <DeliveryTracker
          order={deliveryTrackerModal.order}
          isOpen={deliveryTrackerModal.isOpen}
          onClose={() => setDeliveryTrackerModal({ isOpen: false, order: null })}
        />
      )}

      {/* Live Map Modal */}
      {mapModal.isOpen && mapModal.order && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
          {/* Map Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setMapModal({ isOpen: false, order: null })}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-xl font-bold">Live Tracking</h2>
                  <p className="text-blue-100 text-sm">{mapModal.order.driver} • ETA {mapModal.order.estimatedDelivery}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-green-500 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">LIVE</span>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative bg-gray-100">
            {/* Simulated Interactive Map */}
            <div className="w-full h-full relative bg-gradient-to-br from-green-100 via-blue-50 to-gray-100">
              {/* Map Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" className="absolute inset-0">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Street Names */}
              <div className="absolute top-20 left-8 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-lg">
                <span className="text-sm font-bold text-gray-800">South Lamar Blvd</span>
              </div>
              <div className="absolute top-40 right-12 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-lg rotate-45">
                <span className="text-sm font-bold text-gray-800">Barton Springs Rd</span>
              </div>
              <div className="absolute bottom-32 left-16 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-lg">
                <span className="text-sm font-bold text-gray-800">Zilker Park Dr</span>
              </div>

              {/* Route Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                    <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8"/>
                  </linearGradient>
                </defs>
                <path 
                  d="M 80 120 Q 150 180, 220 140 T 320 200 Q 380 240, 420 180" 
                  stroke="url(#routeGradient)" 
                  strokeWidth="4" 
                  fill="none"
                  strokeDasharray="10,5"
                  className="animate-pulse"
                />
              </svg>

              {/* Driver Location */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000"
                style={{ 
                  left: `${30 + Math.sin(Date.now() / 10000) * 20}%`, 
                  top: `${40 + Math.cos(Date.now() / 8000) * 15}%` 
                }}
              >
                <div className="relative">
                  {/* Driver Marker */}
                  <div className="w-12 h-12 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-bounce">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Driver Info Popup */}
                  <div className="absolute -top-16 -left-8 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl min-w-max">
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm">{mapModal.order.driver}</p>
                      <p className="text-blue-600 text-xs font-semibold">{Math.round(driverLocation.speed)} mph</p>
                      <p className="text-gray-600 text-xs">{mapModal.order.currentLocation}</p>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95"></div>
                  </div>

                  {/* Pulse Effect */}
                  <div className="absolute inset-0 w-12 h-12 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>

              {/* Delivery Destination */}
              <div className="absolute bottom-20 right-20 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="w-10 h-10 bg-green-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-14 -left-12 bg-green-600 text-white rounded-xl p-2 shadow-xl min-w-max">
                    <p className="font-bold text-sm">Your Address</p>
                    <p className="text-xs opacity-90">{user.address}</p>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-600"></div>
                  </div>
                </div>
              </div>

              {/* Traffic Indicators */}
              <div className="absolute top-24 left-1/3 w-8 h-2 bg-yellow-400 rounded-full shadow-sm"></div>
              <div className="absolute top-48 right-1/4 w-12 h-2 bg-red-500 rounded-full shadow-sm"></div>
              <div className="absolute bottom-40 left-1/4 w-6 h-2 bg-green-500 rounded-full shadow-sm"></div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              <button className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg hover:bg-white transition-colors">
                <Plus className="w-5 h-5 text-gray-800" />
              </button>
              <button className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg hover:bg-white transition-colors">
                <Minus className="w-5 h-5 text-gray-800" />
              </button>
            </div>

            {/* Compass */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
              <div className="w-8 h-8 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 bg-red-500 h-4 rounded-full"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center rotate-180">
                  <div className="w-1 bg-gray-400 h-3 rounded-full"></div>
                </div>
                <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-500">N</span>
              </div>
            </div>
          </div>

          {/* Bottom Info Panel */}
          <div className="bg-white p-4 shadow-xl">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold text-sm">ETA</span>
                </div>
                <p className="font-black text-lg text-gray-900">{mapModal.order.estimatedDelivery}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="font-bold text-sm">Distance</span>
                </div>
                <p className="font-black text-lg text-gray-900">{mapModal.order.currentLocation}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-purple-600 mb-1">
                  <Truck className="w-4 h-4" />
                  <span className="font-bold text-sm">Speed</span>
                </div>
                <p className="font-black text-lg text-gray-900">{Math.round(driverLocation.speed)} mph</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => alert('Message sent to driver: "Hi! Just checking on delivery status."')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Message Driver</span>
              </button>
              <button 
                type="button"
                onClick={() => setMapModal({ isOpen: false, order: null })}
                className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Close Map
              </button>
            </div>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                🛰️ GPS accurate to 3 meters • Last updated {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Chat Modal */}
      {liveChatModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-t-3xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Live Support</h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        chatStatus === 'online' ? 'bg-green-400 animate-pulse' :
                        chatStatus === 'away' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <span className="text-blue-100">
                        {chatStatus === 'online' ? 'Agent available' :
                         chatStatus === 'away' ? 'Slower responses' : 'High volume'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeLiveChat}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 chat-messages">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm flex-shrink-0">
                      {message.avatar}
                    </div>
                    <div className={`rounded-2xl p-3 ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-md' 
                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                    }`}>
                      {message.sender === 'agent' && (
                        <div className="text-xs font-semibold text-blue-600 mb-1">{message.name}</div>
                      )}
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      <div className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {agentTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm">
                      👩‍💼
                    </div>
                    <div className="bg-white text-gray-900 rounded-2xl rounded-bl-md p-3 shadow-sm border border-gray-100">
                      <div className="text-xs font-semibold text-blue-600 mb-1">Sarah from Support</div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Type your message..."
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                    chatInput.trim() 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Send
                </button>
              </div>
              
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  💬 Average response time: 2 minutes • Powered by Faded Skies Support
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FS Coin Rewards Modal */}
      {rewardsModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">🪙 FS Coin Rewards</h2>
                <button
                  type="button"
                  onClick={() => setRewardsModal({ isOpen: false })}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-green-100">Track your rewards and earnings</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-6">
                {/* Current Balance */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-emerald-600 mb-2">{user.rewards}</div>
                    <div className="text-lg font-semibold text-gray-700">Available Balance</div>
                    <div className="text-sm text-gray-600 mt-1">FS Coins</div>
                  </div>
                </div>

                {/* Earning Rate */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3">💎 Earning Rate</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Per $1 spent</span>
                      <span className="font-bold text-emerald-600">1 FS Coin</span>
                    </div>
                    <div className="flex items-center justify-between">
                                              <span className="text-gray-600">Bonus on orders &gt;$100</span>
                      <span className="font-bold text-emerald-600">+10%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Referral bonus</span>
                      <span className="font-bold text-emerald-600">50 FS Coins</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3">📊 Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Order #ORD-1756148478</span>
                      <span className="font-bold text-emerald-600">+74 FS Coins</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Referral bonus</span>
                      <span className="font-bold text-emerald-600">+50 FS Coins</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Order #ORD-1755781255</span>
                      <span className="font-bold text-emerald-600">+74 FS Coins</span>
                    </div>
                  </div>
                </div>

                {/* How to Use */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-3">💡 How to Use</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• 1 FS Coin = $0.10 off your next order</p>
                    <p>• Minimum 10 FS Coins to redeem</p>
                    <p>• Coins expire after 1 year</p>
                    <p>• Can be combined with other offers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {paymentMethodsModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">💳 Payment Methods</h2>
                <button
                  type="button"
                  onClick={() => setPaymentMethodsModal({ isOpen: false })}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-green-100">Manage your payment options</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {!showAddPayment ? (
                <div className="space-y-4">
                  {/* Current Payment Methods */}
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{method.icon}</span>
                          <div>
                            <div className="font-bold text-gray-900">{method.type}</div>
                            <div className="text-sm text-gray-600">{method.details}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {method.primary && (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                              Primary
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removePaymentMethod(method.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {!method.primary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryPaymentMethod(method.id)}
                          className="mt-3 w-full bg-emerald-50 text-emerald-700 py-2 rounded-xl font-semibold hover:bg-emerald-100 transition-colors"
                        >
                          Set as Primary
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add New Payment Method */}
                  <button
                    type="button"
                    onClick={() => setShowAddPayment(true)}
                    className="w-full bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl p-4 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    + Add Payment Method
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="font-bold text-xl text-gray-900">Add Payment Method</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Type</label>
                      <select
                        value={newPaymentForm.type}
                        onChange={(e) => setNewPaymentForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      >
                        <option value="card">Credit/Debit Card</option>
                        <option value="paypal">PayPal</option>
                        <option value="googlepay">Google Pay</option>
                      </select>
                    </div>

                    {newPaymentForm.type === 'card' && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Cardholder Name</label>
                          <input
                            type="text"
                            value={newPaymentForm.name}
                            onChange={(e) => setNewPaymentForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                          <input
                            type="text"
                            value={newPaymentForm.cardNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                              setNewPaymentForm(prev => ({ ...prev, cardNumber: value }));
                            }}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                            <input
                              type="text"
                              value={newPaymentForm.expiryDate}
                              onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, '');
                                if (value.length >= 2) {
                                  value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                }
                                setNewPaymentForm(prev => ({ ...prev, expiryDate: value }));
                              }}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                              placeholder="MM/YY"
                              maxLength={5}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">CVV</label>
                            <input
                              type="text"
                              value={newPaymentForm.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                                setNewPaymentForm(prev => ({ ...prev, cvv: value }));
                              }}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                              placeholder="123"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {newPaymentForm.type !== 'card' && (
                      <div className="bg-emerald-50 rounded-xl p-4 text-center">
                        <p className="text-emerald-800 font-semibold mb-2">
                          {newPaymentForm.type === 'paypal' ? '💙 PayPal' : '🔵 Google Pay'} Integration
                        </p>
                        <p className="text-emerald-600 text-sm">
                          You'll be redirected to complete the setup
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPayment(false);
                        setNewPaymentForm({ type: 'card', cardNumber: '', expiryDate: '', cvv: '', name: '' });
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addPaymentMethod}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg"
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

      {/* Notifications Modal */}
      {notificationsModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">🔔 Notifications</h2>
                <button
                  type="button"
                  onClick={() => setNotificationsModal({ isOpen: false })}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-green-100">Manage your notification preferences</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {[
                  { key: 'orderUpdates', title: 'Order Updates', desc: 'Track your delivery progress' },
                  { key: 'promotionsDeals', title: 'Promotions & Deals', desc: 'Get notified about special offers' },
                  { key: 'newProducts', title: 'New Products', desc: 'Be the first to know about new items' },
                  { key: 'deliveryReminders', title: 'Delivery Reminders', desc: 'Get reminded about your orders' },
                  { key: 'fsRewards', title: 'FS Rewards', desc: 'Earn and redeem your coins' },
                  { key: 'smsNotifications', title: 'SMS Notifications', desc: 'Receive text messages' },
                  { key: 'emailUpdates', title: 'Email Updates', desc: 'Get updates via email' }
                ].map((setting) => (
                  <div key={setting.key} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{setting.title}</div>
                      <div className="text-sm text-gray-600">{setting.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotificationSetting(setting.key as keyof typeof notificationSettings)}
                      className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                        notificationSettings[setting.key as keyof typeof notificationSettings] ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                        notificationSettings[setting.key as keyof typeof notificationSettings] ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Security Modal */}
      {privacySecurityModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">🔒 Privacy & Security</h2>
                <button
                  type="button"
                  onClick={() => setPrivacySecurityModal({ isOpen: false })}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-green-100">Manage your account protection</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {[
                  { key: 'locationTracking', title: 'Location Tracking', desc: 'Allow location for delivery tracking' },
                  { key: 'purchaseHistory', title: 'Purchase History', desc: 'Save your order history' },
                  { key: 'analytics', title: 'Usage Analytics', desc: 'Help improve the app' },
                  { key: 'thirdPartySharing', title: 'Third Party Sharing', desc: 'Share data with partners' },
                  { key: 'biometricLogin', title: 'Biometric Login', desc: 'Use Face ID / Touch ID' }
                ].map((setting) => (
                  <div key={setting.key} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{setting.title}</div>
                      <div className="text-sm text-gray-600">{setting.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePrivacySetting(setting.key as keyof typeof privacySettings)}
                      className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                        privacySettings[setting.key as keyof typeof privacySettings] ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                        privacySettings[setting.key as keyof typeof privacySettings] ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Addresses Modal */}
      {deliveryAddressesModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">📍 Delivery Addresses</h2>
                <button
                  type="button"
                  onClick={() => setDeliveryAddressesModal({ isOpen: false })}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-green-100">Manage your delivery locations</p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {/* Current Addresses */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🏠</span>
                      <div>
                        <div className="font-bold text-gray-900">Home</div>
                        <div className="text-sm text-gray-600">123 Main St, Austin, TX 78701</div>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                      Default
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-emerald-50 text-emerald-700 py-2 rounded-xl font-semibold hover:bg-emerald-100 transition-colors">
                      Edit
                    </button>
                    <button className="flex-1 bg-red-50 text-red-700 py-2 rounded-xl font-semibold hover:bg-red-100 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>

                {/* Add New Address */}
                <button
                  type="button"
                  className="w-full bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl p-4 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors"
                >
                  + Add New Address
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </Elements>
  );
};

export default FadedSkiesApp;