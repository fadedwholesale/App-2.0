import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut, 
  Navigation,
  Play,
  Pause,
  Bell,
  Clock,
  Star,
  Edit,
  MapPin,
  Route,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  X,
  Save
} from 'lucide-react';

const FadedSkiesTrackingAdmin = () => {
  // Add custom styles for Mapbox markers
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      .mapbox-marker {
        transition: all 0.2s ease;
      }
      .mapbox-marker:hover {
        z-index: 1000;
      }
      .driver-marker:hover {
        transform: scale(1.1) !important;
      }
      .delivery-marker:hover {
        transform: scale(1.15) !important;
      }
      .mapboxgl-popup-content {
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .mapboxgl-popup-close-button {
        font-size: 16px;
        padding: 4px 8px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [currentView, setCurrentView] = useState('tracking');
  const [isTrackingLive, setIsTrackingLive] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [routeOptimizationEnabled, setRouteOptimizationEnabled] = useState(true);
  const [priorityBoostEnabled, setPriorityBoostEnabled] = useState(true);
  const [routeForm, setRouteForm] = useState({
    priority: '',
    estimatedTime: '',
    alternateRoute: '',
    specialInstructions: '',
    deliveryWindow: ''
  });

  // Products Management State
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Premium Cannabis Flower - Blue Dream',
      category: 'Flower',
      price: 45.00,
      stock: 150,
      thc: '18%',
      cbd: '2%',
      description: 'Premium indoor grown Blue Dream with euphoric effects. This sativa-dominant hybrid offers a perfect balance of cerebral stimulation and full-body relaxation. Known for its sweet berry aroma and smooth smoke.',
      image: '🌿',
      status: 'active',
      supplier: 'Green Valley Farms',
      dateAdded: '2025-01-10',
      imageUrl: '',
      strainType: 'hybrid',
      effects: 'Euphoric, Creative, Relaxing',
      batchNumber: 'BD-2025-001',
      harvestDate: '2024-12-15',
      labResults: ''
    },
    {
      id: 2,
      name: 'Artisan Edibles - Gummy Bears 10mg',
      category: 'Edibles',
      price: 25.00,
      stock: 85,
      thc: '10mg per piece',
      cbd: '0mg',
      description: 'Delicious fruit-flavored gummies, perfect for beginners. Each gummy contains precisely 10mg of THC for consistent dosing. Made with all-natural ingredients and real fruit flavors.',
      image: '🍯',
      status: 'active',
      supplier: 'Sweet Relief Co.',
      dateAdded: '2025-01-08',
      imageUrl: '',
      strainType: '',
      effects: 'Relaxing, Mood Lifting, Pain Relief',
      batchNumber: 'GB-2025-003',
      harvestDate: '',
      labResults: ''
    },
    {
      id: 3,
      name: 'Concentrate - Live Resin Cart',
      category: 'Concentrates',
      price: 65.00,
      stock: 45,
      thc: '85%',
      cbd: '1%',
      description: 'High-quality live resin vape cartridge extracted from fresh-frozen flowers. Preserves the full terpene profile for maximum flavor and effects. Compatible with standard 510 thread batteries.',
      image: '💨',
      status: 'active',
      supplier: 'Pure Extracts',
      dateAdded: '2025-01-05',
      imageUrl: '',
      strainType: 'hybrid',
      effects: 'Intense, Fast-acting, Clear-headed',
      batchNumber: 'LR-2025-012',
      harvestDate: '2024-12-20',
      labResults: ''
    },
    {
      id: 4,
      name: 'CBD Tincture - Full Spectrum',
      category: 'CBD Products',
      price: 35.00,
      stock: 25,
      thc: '0.3%',
      cbd: '1000mg',
      description: 'Full spectrum CBD tincture for wellness and therapeutic benefits. Contains the complete range of cannabinoids, terpenes, and flavonoids. Perfect for daily wellness routines.',
      image: '💧',
      status: 'low_stock',
      supplier: 'Wellness Labs',
      dateAdded: '2025-01-03',
      imageUrl: '',
      strainType: 'cbd',
      effects: 'Calming, Anti-inflammatory, Therapeutic',
      batchNumber: 'FS-2025-007',
      harvestDate: '',
      labResults: ''
    }
  ]);

  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 234-5678',
      address: '456 Oak Ave, Austin, TX 78701',
      dateJoined: '2024-12-15',
      totalOrders: 12,
      totalSpent: 540.00,
      status: 'verified',
      lastOrder: '2025-01-10',
      preferences: ['Flower', 'Edibles'],
      loyaltyPoints: 270
    },
    {
      id: 2,
      name: 'Mike Rodriguez',
      email: 'mike.r@email.com',
      phone: '+1 (555) 345-6789',
      address: '789 Pine St, Austin, TX 78702',
      dateJoined: '2024-11-20',
      totalOrders: 8,
      totalSpent: 320.00,
      status: 'verified',
      lastOrder: '2025-01-08',
      preferences: ['Concentrates'],
      loyaltyPoints: 160
    },
    {
      id: 3,
      name: 'Emma Davis',
      email: 'emma.davis@email.com',
      phone: '+1 (555) 567-8901',
      address: '321 Elm St, Austin, TX 78703',
      dateJoined: '2025-01-01',
      totalOrders: 3,
      totalSpent: 105.00,
      status: 'pending_verification',
      lastOrder: '2025-01-05',
      preferences: ['CBD Products'],
      loyaltyPoints: 52
    }
  ]);

  const [orders, setOrders] = useState([
    {
      id: 1,
      orderId: '#FS2025001',
      customerId: 1,
      customerName: 'Sarah Johnson',
      items: [
        { productId: 1, name: 'Premium Cannabis Flower - Blue Dream', quantity: 2, price: 45.00 },
        { productId: 2, name: 'Artisan Edibles - Gummy Bears 10mg', quantity: 1, price: 25.00 }
      ],
      total: 115.00,
      status: 'delivered',
      paymentStatus: 'paid',
      orderDate: '2025-01-10',
      deliveryDate: '2025-01-10',
      address: '456 Oak Ave, Austin, TX 78701',
      notes: 'Customer preferred afternoon delivery'
    },
    {
      id: 2,
      orderId: '#FS2025002',
      customerId: 2,
      customerName: 'Mike Rodriguez',
      items: [
        { productId: 3, name: 'Concentrate - Live Resin Cart', quantity: 1, price: 65.00 }
      ],
      total: 65.00,
      status: 'en-route',
      paymentStatus: 'paid',
      orderDate: '2025-01-11',
      deliveryDate: '2025-01-11',
      address: '789 Pine St, Austin, TX 78702',
      notes: 'Ring doorbell twice'
    },
    {
      id: 3,
      orderId: '#FS2025003',
      customerId: 3,
      customerName: 'Emma Davis',
      items: [
        { productId: 4, name: 'CBD Tincture - Full Spectrum', quantity: 1, price: 35.00 }
      ],
      total: 35.00,
      status: 'processing',
      paymentStatus: 'paid',
      orderDate: '2025-01-11',
      deliveryDate: null,
      address: '321 Elm St, Austin, TX 78703',
      notes: 'First-time customer'
    }
  ]);

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  // Force re-render state for debugging
  const [forceRender, setForceRender] = useState(0);

  // Debug modal state changes
  useEffect(() => {
    console.log('🔴 MODAL STATE CHANGED:', {
      showOrderModal,
      showProductModal,
      showCustomerModal,
      showRouteModal,
      editingOrder: editingOrder?.orderId
    });
  }, [showOrderModal, showProductModal, showCustomerModal, showRouteModal, editingOrder]);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Flower',
    price: '',
    stock: '',
    thc: '',
    cbd: '',
    description: '',
    supplier: '',
    status: 'active',
    imageUrl: '',
    strainType: '',
    effects: '',
    batchNumber: '',
    harvestDate: '',
    labResults: ''
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'pending_verification'
  });

  const [orderForm, setOrderForm] = useState({
    customerId: '',
    items: [],
    status: 'processing',
    paymentStatus: 'pending',
    address: '',
    notes: ''
  });

  const [drivers, setDrivers] = useState([
    {
      id: 1,
      name: 'Marcus Johnson',
      phone: '+1 (555) 234-5678',
      vehicle: 'Honda Civic - ABC123',
      status: 'delivering',
      ordersToday: 8,
      rating: 4.9,
      online: true,
      currentLocation: 'Downtown Austin',
      batteryLevel: 85,
      lastUpdate: '2 mins ago',
      currentLoad: 2,
      maxLoad: 3,
      efficiency: 0.92,
      zone: 'central'
    },
    {
      id: 2,
      name: 'Sarah Williams',
      phone: '+1 (555) 345-6789',
      vehicle: 'Toyota Prius - XYZ789',
      status: 'available',
      ordersToday: 12,
      rating: 4.8,
      online: true,
      currentLocation: 'East Austin',
      batteryLevel: 92,
      lastUpdate: '1 min ago',
      currentLoad: 0,
      maxLoad: 4,
      efficiency: 0.95,
      zone: 'east'
    },
    {
      id: 3,
      name: 'David Kim',
      phone: '+1 (555) 567-8901',
      vehicle: 'Subaru Outback - DEF456',
      status: 'offline',
      ordersToday: 5,
      rating: 4.7,
      online: false,
      currentLocation: 'Unknown',
      batteryLevel: 15,
      lastUpdate: '45 mins ago',
      currentLoad: 0,
      maxLoad: 3,
      efficiency: 0.88,
      zone: 'south'
    },
    {
      id: 4,
      name: 'Lisa Chen',
      phone: '+1 (555) 321-9876',
      vehicle: 'Tesla Model 3 - ELC456',
      status: 'available',
      ordersToday: 15,
      rating: 4.9,
      online: true,
      currentLocation: 'West Austin',
      batteryLevel: 78,
      lastUpdate: '30 secs ago',
      currentLoad: 1,
      maxLoad: 5,
      efficiency: 0.98,
      zone: 'west'
    }
  ]);

  const [activeDeliveries, setActiveDeliveries] = useState([
    {
      orderId: '#FS2025002',
      customer: 'Sarah Johnson',
      address: '456 Oak Ave, Austin, TX',
      estimatedTime: '12 minutes',
      progress: 65,
      status: 'en-route',
      priority: 'normal',
      driverId: 1,
      route: 'Main St → Oak Ave',
      alternateRoutes: ['Highway 35 → Oak Ave', 'Riverside Dr → Oak Ave'],
      specialInstructions: 'Ring doorbell twice',
      deliveryWindow: '2:00 PM - 4:00 PM',
      issues: [],
      zone: 'central',
      orderTime: Date.now() - 1800000,
      autoAssigned: true
    },
    {
      orderId: '#FS2025004',
      customer: 'Emma Davis',
      address: '321 Elm St, Austin, TX',
      estimatedTime: '18 minutes',
      progress: 40,
      status: 'en-route',
      priority: 'high',
      driverId: 1,
      route: 'Downtown → Elm St',
      alternateRoutes: ['I-35 → Elm St', 'MLK Blvd → Elm St'],
      specialInstructions: 'Leave at front desk',
      deliveryWindow: '1:00 PM - 3:00 PM',
      issues: ['Traffic delay reported'],
      zone: 'central',
      orderTime: Date.now() - 2700000,
      autoAssigned: true
    },
    {
      orderId: '#FS2025005',
      customer: 'Mike Rodriguez',
      address: '789 Pine St, Austin, TX',
      estimatedTime: '25 minutes',
      progress: 15,
      status: 'preparing',
      priority: 'urgent',
      driverId: null,
      route: 'Not assigned',
      alternateRoutes: ['Direct route via Congress', 'Scenic route via Zilker'],
      specialInstructions: 'Customer will meet in lobby',
      deliveryWindow: '3:00 PM - 5:00 PM',
      issues: ['Needs driver assignment'],
      zone: 'south',
      orderTime: Date.now() - 300000,
      autoAssigned: false
    },
    {
      orderId: '#FS2025006',
      customer: 'Jennifer Taylor',
      address: '654 Maple Dr, Austin, TX',
      estimatedTime: '20 minutes',
      progress: 0,
      status: 'pending',
      priority: 'normal',
      driverId: null,
      route: 'Not assigned',
      alternateRoutes: ['MoPac → Maple Dr', 'Lamar Blvd → Maple Dr'],
      specialInstructions: 'Call upon arrival',
      deliveryWindow: '4:00 PM - 6:00 PM',
      issues: [],
      zone: 'west',
      orderTime: Date.now() - 120000,
      autoAssigned: false
    }
  ]);

  // Mapbox setup
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Mapbox
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // Load Mapbox GL JS
    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Initialize map with public token (demo token)
      window.mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
      
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-97.7431, 30.2672], // Austin, TX coordinates
        zoom: 11
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        addMarkersToMap();
      });

      // Add navigation controls
      map.current.addControl(new window.mapboxgl.NavigationControl());
    };
    document.head.appendChild(script);

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Austin area coordinates for drivers and deliveries
  const austinCoordinates = {
    central: [-97.7431, 30.2672],
    east: [-97.7031, 30.2672],
    west: [-97.7831, 30.2672],
    south: [-97.7431, 30.2372],
    north: [-97.7431, 30.2972]
  };

  const getCoordinatesForZone = (zone, index = 0) => {
    const base = austinCoordinates[zone] || austinCoordinates.central;
    // Add small random offset for multiple items in same zone
    return [
      base[0] + (Math.random() - 0.5) * 0.02 + (index * 0.005),
      base[1] + (Math.random() - 0.5) * 0.02 + (index * 0.005)
    ];
  };

  const addMarkersToMap = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapbox-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add driver markers
    drivers.filter(d => d.online).forEach((driver, index) => {
      const coordinates = getCoordinatesForZone(driver.zone, index);
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'mapbox-marker driver-marker';
      el.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        color: white;
        transition: transform 0.2s;
        background-color: ${driver.status === 'delivering' ? '#2563eb' : '#16a34a'};
        ${driver.status === 'delivering' ? 'animation: pulse 2s infinite;' : ''}
        ${selectedDriver?.id === driver.id ? 'transform: scale(1.2); box-shadow: 0 0 0 4px #fbbf24;' : ''}
      `;
      el.textContent = driver.name.charAt(0);
      el.title = `${driver.name} - ${driver.status} - ${driver.currentLocation}`;

      // Add click handler
      el.addEventListener('click', () => {
        setSelectedDriver(driver);
      });

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        if (selectedDriver?.id !== driver.id) {
          el.style.transform = 'scale(1.1)';
        }
      });
      el.addEventListener('mouseleave', () => {
        if (selectedDriver?.id !== driver.id) {
          el.style.transform = 'scale(1)';
        }
      });

      new window.mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .addTo(map.current);

      // Add popup with driver info
      const popup = new window.mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold;">${driver.name}</h4>
            <p style="margin: 0; font-size: 12px;">📍 ${driver.currentLocation}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px;">🔋 ${driver.batteryLevel}% • ${driver.lastUpdate}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px;">📦 ${driver.currentLoad}/${driver.maxLoad} deliveries</p>
          </div>
        `);

      el.addEventListener('mouseenter', () => {
        popup.setLngLat(coordinates).addTo(map.current);
      });
      el.addEventListener('mouseleave', () => {
        popup.remove();
      });
    });

    // Add delivery markers
    activeDeliveries.forEach((delivery, index) => {
      const coordinates = getCoordinatesForZone(delivery.zone, index);
      
      const el = document.createElement('div');
      el.className = 'mapbox-marker delivery-marker';
      el.style.cssText = `
        width: 35px;
        height: 35px;
        border-radius: 8px;
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: transform 0.2s;
        background-color: ${
          delivery.priority === 'urgent' ? '#dc2626' : 
          delivery.priority === 'high' ? '#ea580c' : '#ef4444'
        };
        ${delivery.priority === 'urgent' ? 'animation: pulse 2s infinite;' : ''}
      `;
      el.innerHTML = '📦';
      el.title = `${delivery.customer} - ${delivery.address} - Priority: ${delivery.priority}`;

      // Add click handler
      el.addEventListener('click', () => {
        alert(`📦 Delivery Details:\nOrder: ${delivery.orderId}\nCustomer: ${delivery.customer}\nAddress: ${delivery.address}\nETA: ${delivery.estimatedTime}\nPriority: ${delivery.priority.toUpperCase()}\nRoute: ${delivery.route}`);
      });

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.15)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      new window.mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .addTo(map.current);

      // Add popup with delivery info
      const popup = new window.mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold;">${delivery.orderId}</h4>
            <p style="margin: 0; font-size: 12px;"><strong>${delivery.customer}</strong></p>
            <p style="margin: 4px 0; font-size: 11px;">${delivery.address}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px;">⏱️ ETA: ${delivery.estimatedTime}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px;">
              🚨 Priority: <span style="color: ${
                delivery.priority === 'urgent' ? '#dc2626' : 
                delivery.priority === 'high' ? '#ea580c' : '#6b7280'
              }; font-weight: bold;">${delivery.priority.toUpperCase()}</span>
            </p>
          </div>
        `);

      el.addEventListener('mouseenter', () => {
        popup.setLngLat(coordinates).addTo(map.current);
      });
      el.addEventListener('mouseleave', () => {
        popup.remove();
      });
    });
  }, [drivers, activeDeliveries, selectedDriver, mapLoaded]);

  // Update markers when data changes
  useEffect(() => {
    if (mapLoaded) {
      addMarkersToMap();
    }
  }, [drivers, activeDeliveries, selectedDriver, mapLoaded, addMarkersToMap]);

  // Products Management Functions - SIMPLIFIED FOR REAL FORMS
  const openProductModal = (product = null) => {
    console.log('🟢 OPENING PRODUCT MODAL WITH:', product);
    
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        price: product.price.toString(),
        stock: product.stock.toString(),
        thc: product.thc,
        cbd: product.cbd,
        description: product.description,
        supplier: product.supplier,
        status: product.status,
        imageUrl: product.imageUrl || '',
        strainType: product.strainType || '',
        effects: product.effects || '',
        batchNumber: product.batchNumber || '',
        harvestDate: product.harvestDate || '',
        labResults: product.labResults || ''
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category: 'Flower',
        price: '',
        stock: '',
        thc: '',
        cbd: '',
        description: '',
        supplier: '',
        status: 'active',
        imageUrl: '',
        strainType: '',
        effects: '',
        batchNumber: '',
        harvestDate: '',
        labResults: ''
      });
    }
    console.log('🟢 OPENING PRODUCT MODAL');
    setShowProductModal(true);
  };

  const saveProduct = useCallback(() => {
    if (!productForm.name || !productForm.price || !productForm.stock) {
      alert('Please fill in all required fields (Name, Price, Stock)');
      return;
    }

    if (!productForm.description.trim()) {
      alert('Please provide a product description');
      return;
    }

    const productData = {
      ...productForm,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock),
      image: productForm.imageUrl || (productForm.category === 'Flower' ? '🌿' : 
              productForm.category === 'Edibles' ? '🍯' :
              productForm.category === 'Concentrates' ? '💨' : '💧'),
      dateAdded: editingProduct ? editingProduct.dateAdded : new Date().toISOString().split('T')[0]
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? { ...p, ...productData } : p
      ));
      alert(`✅ Product "${productForm.name}" updated successfully`);
    } else {
      const newProduct = {
        id: Math.max(...products.map(p => p.id), 0) + 1,
        ...productData
      };
      setProducts(prev => [...prev, newProduct]);
      alert(`✅ Product "${productForm.name}" added successfully`);
    }

    setShowProductModal(false);
    setEditingProduct(null);
  }, [productForm, editingProduct, products]);

  const deleteProduct = useCallback((productId) => {
    const product = products.find(p => p.id === productId);
    if (window.confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`)) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert(`🗑️ Product "${product.name}" deleted successfully`);
    }
  }, [products]);

  // Customer Management Functions - SIMPLIFIED FOR REAL FORMS
  const openCustomerModal = (customer = null) => {
    console.log('🟢 OPENING CUSTOMER MODAL WITH:', customer);
    
    if (customer) {
      setEditingCustomer(customer);
      setCustomerForm({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        status: customer.status
      });
    } else {
      setEditingCustomer(null);
      setCustomerForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        status: 'pending_verification'
      });
    }
    console.log('🟢 OPENING CUSTOMER MODAL');
    setShowCustomerModal(true);
  };

  const saveCustomer = useCallback(() => {
    if (!customerForm.name || !customerForm.email || !customerForm.phone) {
      alert('Please fill in all required fields (Name, Email, Phone)');
      return;
    }

    const customerData = {
      ...customerForm,
      dateJoined: editingCustomer ? editingCustomer.dateJoined : new Date().toISOString().split('T')[0],
      totalOrders: editingCustomer ? editingCustomer.totalOrders : 0,
      totalSpent: editingCustomer ? editingCustomer.totalSpent : 0,
      lastOrder: editingCustomer ? editingCustomer.lastOrder : null,
      preferences: editingCustomer ? editingCustomer.preferences : [],
      loyaltyPoints: editingCustomer ? editingCustomer.loyaltyPoints : 0
    };

    if (editingCustomer) {
      setCustomers(prev => prev.map(c => 
        c.id === editingCustomer.id ? { ...c, ...customerData } : c
      ));
      alert(`✅ Customer "${customerForm.name}" updated successfully`);
    } else {
      const newCustomer = {
        id: Math.max(...customers.map(c => c.id), 0) + 1,
        ...customerData
      };
      setCustomers(prev => [...prev, newCustomer]);
      alert(`✅ Customer "${customerForm.name}" added successfully`);
    }

    setShowCustomerModal(false);
    setEditingCustomer(null);
  }, [customerForm, editingCustomer, customers]);

  const deleteCustomer = useCallback((customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}"?\n\nThis will also delete all their orders and cannot be undone.`)) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      setOrders(prev => prev.filter(o => o.customerId !== customerId));
      alert(`🗑️ Customer "${customer.name}" deleted successfully`);
    }
  }, [customers]);

  // COMPLETELY REBUILT ORDER MODAL SYSTEM WITH FULL FORMS
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderModalData, setOrderModalData] = useState(null);
  const [orderModalForm, setOrderModalForm] = useState({
    customerId: '',
    items: [],
    status: 'processing',
    paymentStatus: 'pending',
    address: '',
    notes: ''
  });

  // Simple modal controls
  const handleOpenOrderModal = (orderData = null) => {
    console.log('🟢 OPENING ORDER MODAL WITH:', orderData);
    setOrderModalData(orderData);
    
    if (orderData) {
      // Editing existing order
      setOrderModalForm({
        customerId: orderData.customerId.toString(),
        items: [...orderData.items],
        status: orderData.status,
        paymentStatus: orderData.paymentStatus,
        address: orderData.address,
        notes: orderData.notes
      });
    } else {
      // Creating new order
      setOrderModalForm({
        customerId: '',
        items: [],
        status: 'processing',
        paymentStatus: 'pending',
        address: '',
        notes: ''
      });
    }
    
    setOrderModalOpen(true);
    console.log('🟢 Modal state set to OPEN');
  };

  const handleCloseOrderModal = () => {
    console.log('🟢 CLOSING ORDER MODAL');
    setOrderModalOpen(false);
    setOrderModalData(null);
    setOrderModalForm({
      customerId: '',
      items: [],
      status: 'processing',
      paymentStatus: 'pending',
      address: '',
      notes: ''
    });
  };

  // Form helpers
  const addItemToOrderModal = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const existingItem = orderModalForm.items.find(item => item.productId === productId);
      if (existingItem) {
        setOrderModalForm(prev => ({
          ...prev,
          items: prev.items.map(item =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }));
      } else {
        setOrderModalForm(prev => ({
          ...prev,
          items: [...prev.items, {
            productId: product.id,
            name: product.name,
            quantity: 1,
            price: product.price
          }]
        }));
      }
    }
  };

  const removeItemFromOrderModal = (productId) => {
    setOrderModalForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const updateItemQuantityModal = (productId, quantity) => {
    if (quantity <= 0) {
      removeItemFromOrderModal(productId);
      return;
    }
    setOrderModalForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, quantity: parseInt(quantity) }
          : item
      )
    }));
  };

  const saveOrderModal = () => {
    if (!orderModalForm.customerId || orderModalForm.items.length === 0) {
      alert('Please select a customer and add at least one item');
      return;
    }

    const customer = customers.find(c => c.id === parseInt(orderModalForm.customerId));
    const total = orderModalForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
      ...orderModalForm,
      customerId: parseInt(orderModalForm.customerId),
      customerName: customer.name,
      total: total,
      orderDate: orderModalData ? orderModalData.orderDate : new Date().toISOString().split('T')[0],
      deliveryDate: orderModalForm.status === 'delivered' ? 
        (orderModalData?.deliveryDate || new Date().toISOString().split('T')[0]) : 
        null
    };

    if (orderModalData) {
      // Editing existing order
      setOrders(prev => prev.map(o => 
        o.id === orderModalData.id ? { ...o, ...orderData } : o
      ));
      alert(`✅ Order ${orderModalData.orderId} updated successfully`);
    } else {
      // Creating new order
      const newOrderId = `#FS2025${String(Math.max(...orders.map(o => o.id), 0) + 1).padStart(3, '0')}`;
      const newOrder = {
        id: Math.max(...orders.map(o => o.id), 0) + 1,
        orderId: newOrderId,
        ...orderData
      };
      setOrders(prev => [...prev, newOrder]);
      
      // Update customer stats
      setCustomers(prev => prev.map(c => 
        c.id === parseInt(orderModalForm.customerId)
          ? { 
              ...c, 
              totalOrders: c.totalOrders + 1,
              totalSpent: c.totalSpent + total,
              lastOrder: new Date().toISOString().split('T')[0],
              loyaltyPoints: c.loyaltyPoints + Math.floor(total / 2)
            }
          : c
      ));
      
      alert(`✅ Order ${newOrderId} created successfully`);
    }

    handleCloseOrderModal();
  };

  // Test function to verify modal works
  const testModal = () => {
    console.log('🟢 TEST MODAL FUNCTION CALLED');
    setOrderModalOpen(true);
  };

  const saveOrder = () => {
    if (!orderForm.customerId || orderForm.items.length === 0) {
      alert('Please select a customer and add at least one item');
      return;
    }

    const customer = customers.find(c => c.id === parseInt(orderForm.customerId));
    const total = orderForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
      ...orderForm,
      customerId: parseInt(orderForm.customerId),
      customerName: customer.name,
      total: total,
      orderDate: editingOrder ? editingOrder.orderDate : new Date().toISOString().split('T')[0],
      deliveryDate: orderForm.status === 'delivered' ? 
        (editingOrder?.deliveryDate || new Date().toISOString().split('T')[0]) : 
        null
    };

    if (editingOrder) {
      setOrders(prev => prev.map(o => 
        o.id === editingOrder.id ? { ...o, ...orderData } : o
      ));
      
      // Update active deliveries if this order is being tracked
      setActiveDeliveries(prev => prev.map(delivery => 
        delivery.orderId === editingOrder.orderId 
          ? { 
              ...delivery, 
              customer: customer.name,
              address: orderForm.address,
              status: orderForm.status === 'processing' ? 'preparing' : 
                     orderForm.status === 'en-route' ? 'en-route' : 'delivered',
              specialInstructions: orderForm.notes
            }
          : delivery
      ));
      
      alert(`✅ Order ${editingOrder.orderId} updated successfully`);
    } else {
      const newOrderId = `#FS2025${String(Math.max(...orders.map(o => o.id), 0) + 1).padStart(3, '0')}`;
      const newOrder = {
        id: Math.max(...orders.map(o => o.id), 0) + 1,
        orderId: newOrderId,
        ...orderData
      };
      setOrders(prev => [...prev, newOrder]);
      
      // Add to active deliveries if not delivered
      if (orderForm.status !== 'delivered' && orderForm.status !== 'cancelled') {
        const newDelivery = {
          orderId: newOrderId,
          customer: customer.name,
          address: orderForm.address,
          estimatedTime: '25 minutes',
          progress: orderForm.status === 'processing' ? 0 : 50,
          status: orderForm.status === 'processing' ? 'preparing' : 'en-route',
          priority: 'normal',
          driverId: null,
          route: 'Not assigned',
          alternateRoutes: ['Direct route', 'Optimized route'],
          specialInstructions: orderForm.notes || 'Standard delivery',
          deliveryWindow: '2:00 PM - 4:00 PM',
          issues: [],
          zone: 'central',
          orderTime: Date.now(),
          autoAssigned: false
        };
        setActiveDeliveries(prev => [...prev, newDelivery]);
      }
      
      // Update customer stats
      setCustomers(prev => prev.map(c => 
        c.id === parseInt(orderForm.customerId)
          ? { 
              ...c, 
              totalOrders: c.totalOrders + 1,
              totalSpent: c.totalSpent + total,
              lastOrder: new Date().toISOString().split('T')[0],
              loyaltyPoints: c.loyaltyPoints + Math.floor(total / 2)
            }
          : c
      ));
      
      alert(`✅ Order ${newOrderId} created successfully`);
    }

    closeOrderModal();
  };

  const deleteOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (window.confirm(`Are you sure you want to delete order "${order.orderId}"?\n\nThis will also remove it from active deliveries.`)) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      // Remove from active deliveries
      setActiveDeliveries(prev => prev.filter(d => d.orderId !== order.orderId));
      alert(`🗑️ Order "${order.orderId}" deleted successfully`);
    }
  };

  const duplicateOrder = (order) => {
    console.log('🔴 DUPLICATING ORDER:', order);
    const customer = customers.find(c => c.id === order.customerId);
    if (customer) {
      setEditingOrder(null);
      setOrderForm({
        customerId: order.customerId.toString(),
        items: [...order.items],
        status: 'processing',
        paymentStatus: 'pending',
        address: order.address,
        notes: `Duplicate of ${order.orderId}: ${order.notes}`
      });
      console.log('🔴 OPENING MODAL FOR DUPLICATE');
      setShowOrderModal(true);
    } else {
      console.error('🔴 Customer not found for duplicate order');
      alert('Error: Customer not found for this order');
    }
  };

  const quickUpdateOrderStatus = (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { 
              ...o, 
              status: newStatus,
              deliveryDate: newStatus === 'delivered' ? new Date().toISOString().split('T')[0] : o.deliveryDate
            }
          : o
      ));
      
      // Update active deliveries
      setActiveDeliveries(prev => prev.map(delivery => 
        delivery.orderId === order.orderId 
          ? { 
              ...delivery, 
              status: newStatus === 'processing' ? 'preparing' : 
                     newStatus === 'en-route' ? 'en-route' : 'delivered',
              progress: newStatus === 'delivered' ? 100 : 
                       newStatus === 'en-route' ? 50 : 0
            }
          : delivery
      ));
      
      alert(`📦 Order ${order.orderId} status updated to ${newStatus.toUpperCase()}`);
    }
  };

  const addItemToOrder = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const existingItem = orderForm.items.find(item => item.productId === productId);
      if (existingItem) {
        setOrderForm(prev => ({
          ...prev,
          items: prev.items.map(item =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }));
      } else {
        setOrderForm(prev => ({
          ...prev,
          items: [...prev.items, {
            productId: product.id,
            name: product.name,
            quantity: 1,
            price: product.price
          }]
        }));
      }
    }
  };

  const removeItemFromOrder = (productId) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const updateItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItemFromOrder(productId);
      return;
    }
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, quantity: parseInt(quantity) }
          : item
      )
    }));
  };

  // Enhanced delivery management functions
  const updateDeliveryProgress = useCallback((orderId, newProgress) => {
    setActiveDeliveries(prev => prev.map(delivery => 
      delivery.orderId === orderId 
        ? { ...delivery, progress: Math.min(100, Math.max(0, newProgress)) }
        : delivery
    ));
  }, []);

  const changeDeliveryPriority = useCallback((orderId, newPriority) => {
    setActiveDeliveries(prev => prev.map(delivery => 
      delivery.orderId === orderId 
        ? { ...delivery, priority: newPriority }
        : delivery
    ));
    alert(`🚨 Priority changed to ${newPriority.toUpperCase()} for ${orderId}`);
  }, []);

  const reassignDriver = useCallback((orderId, newDriverId) => {
    const driver = drivers.find(d => d.id === newDriverId);
    setActiveDeliveries(prev => prev.map(delivery => 
      delivery.orderId === orderId 
        ? { ...delivery, driverId: newDriverId, status: 'en-route' }
        : delivery
    ));
    alert(`🚗 ${orderId} reassigned to ${driver?.name || 'Unknown Driver'}`);
  }, [drivers]);

  const addDeliveryIssue = useCallback((orderId, issue) => {
    setActiveDeliveries(prev => prev.map(delivery => 
      delivery.orderId === orderId 
        ? { ...delivery, issues: [...delivery.issues, issue] }
        : delivery
    ));
  }, []);

  const resolveDeliveryIssue = useCallback((orderId, issueIndex) => {
    setActiveDeliveries(prev => prev.map(delivery => 
      delivery.orderId === orderId 
        ? { ...delivery, issues: delivery.issues.filter((_, i) => i !== issueIndex) }
        : delivery
    ));
  }, []);

  const optimizeRoute = useCallback((orderId) => {
    const delivery = activeDeliveries.find(d => d.orderId === orderId);
    if (delivery) {
      const newTime = Math.max(5, parseInt(delivery.estimatedTime) - Math.floor(Math.random() * 8) - 2);
      setActiveDeliveries(prev => prev.map(d => 
        d.orderId === orderId 
          ? { ...d, estimatedTime: `${newTime} minutes`, route: 'Optimized route via GPS' }
          : d
      ));
      alert(`🛣️ Route optimized for ${orderId}! New ETA: ${newTime} minutes`);
    }
  }, [activeDeliveries]);

  // Advanced Auto-Assignment Algorithm
  const findBestDriver = useCallback((delivery, availableDrivers) => {
    if (availableDrivers.length === 0) return null;

    const scoredDrivers = availableDrivers.map(driver => {
      let score = 0;
      
      if (driver.zone === delivery.zone) score += 30;
      score += driver.efficiency * 25;
      score += (driver.maxLoad - driver.currentLoad) * 5;
      score += (driver.rating / 5) * 15;
      score += (driver.batteryLevel / 100) * 10;
      
      if (delivery.priority === 'urgent' && driver.efficiency > 0.9) score += 15;
      if (delivery.priority === 'high' && driver.efficiency > 0.85) score += 10;

      return { driver, score };
    });

    const bestMatch = scoredDrivers.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return bestMatch.driver;
  }, []);

  const assignDeliveryToDriver = useCallback((orderId, driverId, isAutoAssigned = false) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    setActiveDeliveries(prev => prev.map(delivery => 
      delivery.orderId === orderId 
        ? { 
            ...delivery, 
            driverId: driverId, 
            status: 'en-route',
            autoAssigned: isAutoAssigned,
            route: isAutoAssigned ? `Auto-route to ${delivery.address.split(',')[0]}` : delivery.route
          }
        : delivery
    ));

    setDrivers(prev => prev.map(d => 
      d.id === driverId 
        ? { ...d, currentLoad: d.currentLoad + 1 }
        : d
    ));

    if (isAutoAssigned) {
      alert(`🤖 AUTO-ASSIGNED: ${orderId} → ${driver.name} (Score-based matching)`);
    } else {
      alert(`🚗 ${orderId} assigned to ${driver.name}`);
    }
  }, [drivers]);

  const autoAssignDeliveries = useCallback(() => {
    const unassignedDeliveries = activeDeliveries.filter(d => !d.driverId && d.status !== 'delivered');
    const availableDrivers = drivers.filter(d => d.online && d.currentLoad < d.maxLoad);

    unassignedDeliveries.forEach(delivery => {
      const bestDriver = findBestDriver(delivery, availableDrivers);
      if (bestDriver) {
        assignDeliveryToDriver(delivery.orderId, bestDriver.id, true);
      }
    });
  }, [activeDeliveries, drivers, findBestDriver, assignDeliveryToDriver]);

  const autoOptimizeRoutes = useCallback(() => {
    const activeRoutes = activeDeliveries.filter(d => d.driverId && d.status === 'en-route');
    
    activeRoutes.forEach(delivery => {
      if (Math.random() > 0.95) {
        const currentTime = parseInt(delivery.estimatedTime);
        const optimizedTime = Math.max(5, currentTime - Math.floor(Math.random() * 5) - 1);
        
        setActiveDeliveries(prev => prev.map(d => 
          d.orderId === delivery.orderId 
            ? { 
                ...d, 
                estimatedTime: `${optimizedTime} minutes`,
                route: `${d.route} (Auto-optimized)`
              }
            : d
        ));
        
        console.log(`🛣️ Auto-optimized route for ${delivery.orderId}: ${optimizedTime} minutes`);
      }
    });
  }, [activeDeliveries]);

  const autoPriorityBoost = useCallback(() => {
    const currentTime = Date.now();
    
    setActiveDeliveries(prev => prev.map(delivery => {
      const orderAge = currentTime - delivery.orderTime;
      const hoursOld = orderAge / (1000 * 60 * 60);
      
      if (hoursOld > 1 && delivery.priority === 'normal') {
        console.log(`⬆️ Auto-boosted ${delivery.orderId} priority: normal → high`);
        return { ...delivery, priority: 'high' };
      } else if (hoursOld > 1.5 && delivery.priority === 'high') {
        console.log(`🚨 Auto-boosted ${delivery.orderId} priority: high → urgent`);
        return { ...delivery, priority: 'urgent' };
      }
      
      return delivery;
    }));
  }, []);

  const bulkAutoAssign = useCallback(() => {
    const unassigned = activeDeliveries.filter(d => !d.driverId);
    if (unassigned.length === 0) {
      alert('📋 No unassigned deliveries found');
      return;
    }
    
    autoAssignDeliveries();
    alert(`🤖 Bulk auto-assignment completed for ${unassigned.length} deliveries`);
  }, [activeDeliveries, autoAssignDeliveries]);

  const optimizeAllRoutes = useCallback(() => {
    const activeRoutes = activeDeliveries.filter(d => d.driverId && d.status === 'en-route');
    
    activeRoutes.forEach(delivery => {
      const currentTime = parseInt(delivery.estimatedTime);
      const optimizedTime = Math.max(5, currentTime - Math.floor(Math.random() * 8) - 2);
      
      setActiveDeliveries(prev => prev.map(d => 
        d.orderId === delivery.orderId 
          ? { 
              ...d, 
              estimatedTime: `${optimizedTime} minutes`,
              route: `Optimized route to ${d.address.split(',')[0]}`
            }
          : d
      ));
    });
    
    alert(`🛣️ Optimized ${activeRoutes.length} active routes`);
  }, [activeDeliveries]);

  const rebalanceDriverLoads = useCallback(() => {
    const overloadedDrivers = drivers.filter(d => d.online && d.currentLoad > d.maxLoad - 1);
    const underutilizedDrivers = drivers.filter(d => d.online && d.currentLoad < 2);
    
    if (overloadedDrivers.length === 0) {
      alert('⚖️ All driver loads are balanced');
      return;
    }
    
    alert(`⚖️ Rebalanced loads across ${overloadedDrivers.length} drivers`);
  }, [drivers]);

  const openRouteEditor = useCallback((delivery) => {
    setSelectedDelivery(delivery);
    setRouteForm({
      priority: delivery.priority,
      estimatedTime: delivery.estimatedTime.replace(' minutes', ''),
      alternateRoute: delivery.alternateRoutes[0] || '',
      specialInstructions: delivery.specialInstructions,
      deliveryWindow: delivery.deliveryWindow
    });
    setShowRouteModal(true);
  }, []);

  const saveRouteChanges = useCallback(() => {
    if (!selectedDelivery) return;
    
    setActiveDeliveries(prev => prev.map(delivery => 
      delivery.orderId === selectedDelivery.orderId 
        ? {
            ...delivery,
            priority: routeForm.priority,
            estimatedTime: `${routeForm.estimatedTime} minutes`,
            route: routeForm.alternateRoute,
            specialInstructions: routeForm.specialInstructions,
            deliveryWindow: routeForm.deliveryWindow
          }
        : delivery
    ));
    
    setShowRouteModal(false);
    alert(`✅ Route updated for ${selectedDelivery.orderId}`);
  }, [selectedDelivery, routeForm]);

  // Driver management functions
  const sendDriverMessage = useCallback((driver, message) => {
    alert(`📱 Message sent to ${driver.name}: "${message}"`);
  }, []);

  const callDriver = useCallback((driver) => {
    alert(`📞 Calling ${driver.name} at ${driver.phone}...`);
  }, []);

  const assignOrder = useCallback((driver, orderId) => {
    reassignDriver(orderId, driver.id);
  }, [reassignDriver]);

  const sendLocationRequest = useCallback((driver) => {
    alert(`📍 Location update requested from ${driver.name}`);
  }, []);

  const sendEmergencyAlert = useCallback((driver) => {
    if (window.confirm(`🚨 Send emergency alert to ${driver.name}? This will notify them immediately.`)) {
      alert(`🚨 Emergency alert sent to ${driver.name}`);
    }
  }, []);

  const broadcastMessage = useCallback(() => {
    const message = prompt('📢 Broadcast message to all online drivers:', 'Important update from dispatch...');
    if (message) {
      const onlineDrivers = drivers.filter(d => d.online);
      alert(`📢 Message broadcasted to ${onlineDrivers.length} online drivers: "${message}"`);
    }
  }, [drivers]);

  const toggleDriverStatus = useCallback((driver) => {
    const newStatus = driver.online ? 'offline' : 'online';
    setDrivers(prev => prev.map(d => 
      d.id === driver.id 
        ? { ...d, online: !d.online, status: newStatus === 'online' ? 'available' : 'offline' }
        : d
    ));
    alert(`🔄 ${driver.name} status changed to ${newStatus}`);
  }, []);

  // Live tracking effect
  useEffect(() => {
    let interval;
    if (isTrackingLive) {
      interval = setInterval(() => {
        console.log('Live tracking update...');
        
        if (autoAssignEnabled) {
          autoAssignDeliveries();
        }
        
        if (routeOptimizationEnabled) {
          autoOptimizeRoutes();
        }
        
        if (priorityBoostEnabled) {
          autoPriorityBoost();
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isTrackingLive, autoAssignEnabled, routeOptimizationEnabled, priorityBoostEnabled, autoAssignDeliveries, autoOptimizeRoutes, autoPriorityBoost]);

  const Sidebar = () => (
    <div className="w-64 bg-gradient-to-b from-emerald-900 to-green-900 text-white min-h-screen p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-black">FS</span>
          </div>
          <div>
            <h1 className="text-xl font-black">Faded Skies</h1>
            <p className="text-xs text-green-200">Live Tracking Portal</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {[
          { id: 'dashboard', icon: Home, label: 'Dashboard' },
          { id: 'products', icon: Package, label: 'Products' },
          { id: 'orders', icon: ShoppingCart, label: 'Orders' },
          { id: 'tracking', icon: Navigation, label: 'Live Tracking' },
          { id: 'customers', icon: Users, label: 'Customers' },
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
        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-200 hover:text-red-100 hover:bg-red-900/20 transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );

  const RouteEditorModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Edit Route - {selectedDelivery?.orderId}</h2>
          <button
            onClick={() => setShowRouteModal(false)}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority Level</label>
              <select
                value={routeForm.priority}
                onChange={(e) => setRouteForm({ ...routeForm, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Time (minutes)</label>
              <input
                type="number"
                value={routeForm.estimatedTime}
                onChange={(e) => setRouteForm({ ...routeForm, estimatedTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                placeholder="15"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Route Selection</label>
            <select
              value={routeForm.alternateRoute}
              onChange={(e) => setRouteForm({ ...routeForm, alternateRoute: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select route</option>
              {selectedDelivery?.alternateRoutes.map((route, index) => (
                <option key={index} value={route}>{route}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Window</label>
            <input
              type="text"
              value={routeForm.deliveryWindow}
              onChange={(e) => setRouteForm({ ...routeForm, deliveryWindow: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              placeholder="2:00 PM - 4:00 PM"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Special Instructions</label>
            <textarea
              value={routeForm.specialInstructions}
              onChange={(e) => setRouteForm({ ...routeForm, specialInstructions: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Any special delivery instructions..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex space-x-4 flex-shrink-0">
          <button
            onClick={() => setShowRouteModal(false)}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveRouteChanges}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  const TrackingView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">AI-Powered Live Tracking & Auto-Dispatch</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={bulkAutoAssign}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            title="Auto-assign all unassigned deliveries"
          >
            🤖 Auto-Assign All
          </button>
          <button
            onClick={optimizeAllRoutes}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            title="Optimize all active routes"
          >
            🛣️ Optimize Routes
          </button>
          <button
            onClick={rebalanceDriverLoads}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            title="Rebalance driver workloads"
          >
            ⚖️ Rebalance
          </button>
          <button
            onClick={broadcastMessage}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>Broadcast</span>
          </button>
          <button
            onClick={() => setIsTrackingLive(!isTrackingLive)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
              isTrackingLive 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isTrackingLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isTrackingLive ? 'Stop AI Dispatch' : 'Start AI Dispatch'}</span>
          </button>
        </div>
      </div>

      {/* AI Automation Controls */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🤖 AI Automation Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Auto-Assignment</p>
              <p className="text-sm text-gray-600">Smart driver matching</p>
            </div>
            <button
              onClick={() => setAutoAssignEnabled(!autoAssignEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoAssignEnabled ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoAssignEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Route Optimization</p>
              <p className="text-sm text-gray-600">AI route improvements</p>
            </div>
            <button
              onClick={() => setRouteOptimizationEnabled(!routeOptimizationEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                routeOptimizationEnabled ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  routeOptimizationEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Priority Boost</p>
              <p className="text-sm text-gray-600">Auto-escalate delays</p>
            </div>
            <button
              onClick={() => setPriorityBoostEnabled(!priorityBoostEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                priorityBoostEnabled ? 'bg-orange-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  priorityBoostEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">AI Status:</span> 
            {isTrackingLive ? (
              <span className="text-green-600 ml-2">🟢 Active - Monitoring {activeDeliveries.filter(d => !d.driverId).length} unassigned deliveries</span>
            ) : (
              <span className="text-gray-500 ml-2">⚪ Standby - Click "Start AI Dispatch" to activate</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">Active Deliveries</h3>
          <p className="text-3xl font-black text-blue-600">{activeDeliveries.length}</p>
          <p className="text-xs text-blue-600 mt-1">
            {activeDeliveries.filter(d => d.autoAssigned).length} auto-assigned
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Drivers Online</h3>
          <p className="text-3xl font-black text-green-600">{drivers.filter(d => d.online).length}</p>
          <p className="text-xs text-green-600 mt-1">
            {drivers.filter(d => d.online && d.currentLoad < d.maxLoad).length} available
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-2">Avg Efficiency</h3>
          <p className="text-3xl font-black text-purple-600">
            {drivers.filter(d => d.online).length > 0 ? 
              Math.round(drivers.filter(d => d.online).reduce((sum, d) => sum + d.efficiency, 0) / drivers.filter(d => d.online).length * 100) 
              : 0}%
          </p>
          <p className="text-xs text-purple-600 mt-1">AI optimized</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-orange-800 mb-2">Unassigned</h3>
          <p className="text-3xl font-black text-orange-600">
            {activeDeliveries.filter(d => !d.driverId).length}
          </p>
          <p className="text-xs text-orange-600 mt-1">awaiting assignment</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-emerald-800 mb-2">Deliveries Today</h3>
          <p className="text-3xl font-black text-emerald-600">{drivers.reduce((sum, d) => sum + d.ordersToday, 0)}</p>
          <p className="text-xs text-emerald-600 mt-1">system wide</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Live Map View</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    const orderId = prompt('Enter Order ID to assign:', '#FS2025005');
                    if (orderId && selectedDriver) {
                      assignOrder(selectedDriver, orderId);
                    } else if (orderId) {
                      alert('Please select a driver first by clicking on the map');
                    }
                  }}
                  disabled={!selectedDriver}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDriver 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Assign Order
                </button>
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${isTrackingLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  <span className="text-sm font-medium text-gray-600">
                    {isTrackingLive ? 'Live Updates' : 'Static View'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative h-96 bg-gray-100 rounded-xl overflow-hidden">
            {/* Mapbox Container */}
            <div 
              ref={mapContainer} 
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
            
            {/* Loading overlay */}
            {!mapLoaded && (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading Mapbox...</p>
                </div>
              </div>
            )}

            {/* Selected driver info panel */}
            {selectedDriver && (
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
                <h4 className="font-bold text-gray-900">{selectedDriver.name}</h4>
                <p className="text-sm text-gray-600">📍 {selectedDriver.currentLocation}</p>
                <p className="text-xs text-gray-500">🔋 {selectedDriver.batteryLevel}% • Updated {selectedDriver.lastUpdate}</p>
                <p className="text-xs text-gray-500">📦 Load: {selectedDriver.currentLoad}/{selectedDriver.maxLoad}</p>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => callDriver(selectedDriver)}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                  >
                    📞 Call
                  </button>
                  <button
                    onClick={() => sendLocationRequest(selectedDriver)}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                  >
                    📍 Update
                  </button>
                  <button
                    onClick={() => setSelectedDriver(null)}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
            )}

            {/* Live tracking indicator */}
            {isTrackingLive && (
              <div className="absolute bottom-4 left-4 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live Tracking Active</span>
                </div>
              </div>
            )}

            {/* Map legend */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
              <h5 className="text-xs font-bold text-gray-900 mb-2">Map Legend</h5>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-600 rounded-full border border-white"></div>
                  <span>Available Driver</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-600 rounded-full border border-white"></div>
                  <span>Delivering</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-lg border border-white flex items-center justify-center text-white text-xs">📦</div>
                  <span>Normal Priority</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-600 rounded-lg border border-white flex items-center justify-center text-white text-xs">📦</div>
                  <span>High Priority</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded-lg border border-white flex items-center justify-center text-white text-xs">📦</div>
                  <span>Urgent</span>
                </div>
              </div>
            </div>

            {/* Map controls */}
            <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 z-10">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    if (map.current) {
                      map.current.flyTo({
                        center: [-97.7431, 30.2672],
                        zoom: 11,
                        duration: 1000
                      });
                    }
                  }}
                  className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200 transition-colors"
                  title="Reset View"
                >
                  🎯 Center
                </button>
                <button
                  onClick={() => {
                    if (map.current && drivers.filter(d => d.online).length > 0) {
                      const bounds = new window.mapboxgl.LngLatBounds();
                      drivers.filter(d => d.online).forEach((driver, index) => {
                        const coords = getCoordinatesForZone(driver.zone, index);
                        bounds.extend(coords);
                      });
                      map.current.fitBounds(bounds, { padding: 50 });
                    }
                  }}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                  title="Fit All Drivers"
                >
                  📍 Fit All
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enhanced Active Deliveries Panel */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Active Deliveries Control</h3>
            </div>
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {activeDeliveries.map(delivery => (
                <div key={delivery.orderId} className={`rounded-xl p-4 border-2 ${
                  delivery.priority === 'urgent' ? 'bg-red-50 border-red-200' :
                  delivery.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-blue-600">{delivery.orderId}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        delivery.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        delivery.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {delivery.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="font-medium text-gray-900 mb-1">{delivery.customer}</p>
                  <p className="text-sm text-gray-600 mb-2">{delivery.address}</p>
                  <p className="text-xs text-gray-500 mb-3">🛣️ {delivery.route}</p>
                  
                  {/* Issues display */}
                  {delivery.issues.length > 0 && (
                    <div className="mb-3">
                      {delivery.issues.map((issue, index) => (
                        <div key={index} className="flex items-center justify-between bg-yellow-100 rounded p-2 mb-1">
                          <span className="text-xs text-yellow-800 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {issue}
                          </span>
                          <button
                            onClick={() => resolveDeliveryIssue(delivery.orderId, index)}
                            className="text-green-600 hover:text-green-700"
                            title="Resolve Issue"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{delivery.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${delivery.progress}%` }}
                      ></div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={delivery.progress}
                      onChange={(e) => updateDeliveryProgress(delivery.orderId, parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      title="Adjust Progress"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>ETA: {delivery.estimatedTime}</span>
                    </div>
                    <span className="text-xs text-gray-500">{delivery.deliveryWindow}</span>
                  </div>

                  {/* Delivery Control Actions */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      onClick={() => openRouteEditor(delivery)}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition-colors flex items-center justify-center"
                      title="Edit Route & Settings"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit Route
                    </button>
                    <button
                      onClick={() => optimizeRoute(delivery.orderId)}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors flex items-center justify-center"
                      title="Optimize Route"
                    >
                      <Route className="w-3 h-3 mr-1" />
                      Optimize
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <select
                      value={delivery.priority}
                      onChange={(e) => changeDeliveryPriority(delivery.orderId, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                      title="Change Priority"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <select
                      value={delivery.driverId || ''}
                      onChange={(e) => reassignDriver(delivery.orderId, parseInt(e.target.value))}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500"
                      title="Reassign Driver"
                    >
                      <option value="">No Driver</option>
                      {drivers.filter(d => d.online).map(driver => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const issue = prompt('Add delivery issue:', 'Customer not available');
                        if (issue) addDeliveryIssue(delivery.orderId, issue);
                      }}
                      className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200 transition-colors flex-1"
                      title="Report Issue"
                    >
                      ⚠️ Add Issue
                    </button>
                    <button
                      onClick={() => {
                        const driver = drivers.find(d => d.id === delivery.driverId);
                        if (driver) {
                          sendLocationRequest(driver);
                        } else {
                          alert('No driver assigned to this delivery');
                        }
                      }}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors flex items-center justify-center"
                      title="Request Location Update"
                    >
                      <MapPin className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {activeDeliveries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No active deliveries</p>
                </div>
              )}
            </div>
          </div>

          {/* Driver Management Panel */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Driver Management</h3>
                <span className="text-sm text-gray-500">
                  {selectedDriver ? `Selected: ${selectedDriver.name}` : 'Click driver to select'}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {drivers.map(driver => (
                <div 
                  key={driver.id} 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedDriver?.id === driver.id 
                      ? 'border-emerald-300 bg-emerald-50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setSelectedDriver(driver)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{driver.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        driver.online ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        driver.status === 'delivering' ? 'bg-blue-100 text-blue-800' :
                        driver.status === 'available' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {driver.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{driver.vehicle}</p>
                  <p className="text-xs text-gray-500 mb-2">📍 {driver.currentLocation}</p>
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-600">Today: {driver.ordersToday} orders</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-gray-600">{driver.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>🔋 {driver.batteryLevel}%</span>
                    <span>Updated: {driver.lastUpdate}</span>
                  </div>

                  {/* Driver Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const message = prompt(`Send message to ${driver.name}:`, 'Please update your location');
                        if (message) sendDriverMessage(driver, message);
                      }}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                      title="Send Message"
                    >
                      💬 Message
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        callDriver(driver);
                      }}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                      title="Call Driver"
                    >
                      📞 Call
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendLocationRequest(driver);
                      }}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition-colors"
                      title="Request Location"
                    >
                      📍 Location
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendEmergencyAlert(driver);
                      }}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                      title="Emergency Alert"
                    >
                      🚨 Alert
                    </button>
                  </div>

                  {/* Status Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDriverStatus(driver);
                    }}
                    className={`w-full mt-2 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      driver.online 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {driver.online ? 'Set Offline' : 'Set Online'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PlaceholderView = ({ title }) => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title} Section</h3>
        <p className="text-gray-600 mb-4">This section will be implemented in future parts.</p>
        <button 
          onClick={() => setCurrentView('tracking')}
          className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Back to Live Tracking
        </button>
      </div>
    </div>
  );

  // Settings View with Comprehensive Management
  const SettingsView = () => {
    const [activeSettingsTab, setActiveSettingsTab] = useState('general');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showBackupModal, setShowBackupModal] = useState(false);
    
    // Settings state
    const [businessSettings, setBusinessSettings] = useState({
      businessName: 'Faded Skies Cannabis Delivery',
      address: '123 Main St, Austin, TX 78701',
      phone: '+1 (555) 420-WEED',
      email: 'contact@fadedskies.com',
      website: 'https://fadedskies.com',
      licenseNumber: 'TX-DEL-2025-001',
      operatingHours: {
        monday: { open: '09:00', close: '21:00', enabled: true },
        tuesday: { open: '09:00', close: '21:00', enabled: true },
        wednesday: { open: '09:00', close: '21:00', enabled: true },
        thursday: { open: '09:00', close: '21:00', enabled: true },
        friday: { open: '09:00', close: '22:00', enabled: true },
        saturday: { open: '10:00', close: '22:00', enabled: true },
        sunday: { open: '12:00', close: '20:00', enabled: true }
      }
    });

    const [systemSettings, setSystemSettings] = useState({
      autoAssignOrders: true,
      routeOptimization: true,
      priorityEscalation: true,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      darkMode: false,
      language: 'en',
      timezone: 'America/Chicago',
      currency: 'USD'
    });

    const [deliverySettings, setDeliverySettings] = useState({
      freeDeliveryThreshold: 50,
      deliveryFee: 5.99,
      maxDeliveryRadius: 25,
      estimatedDeliveryTime: 30,
      emergencyContactEnabled: true,
      gpsTrackingEnabled: true,
      photoConfirmation: true,
      signatureRequired: false
    });

    const [complianceSettings, setComplianceSettings] = useState({
      ageVerificationRequired: true,
      idScanningEnabled: true,
      purchaseLimits: {
        dailyLimit: 1000,
        monthlyLimit: 5000,
        flowerLimit: 28
      },
      taxRate: 8.25,
      labTestingRequired: true,
      batchTrackingEnabled: true,
      metrcIntegration: true
    });

    const [securitySettings, setSecuritySettings] = useState({
      twoFactorAuth: false,
      sessionTimeout: 60,
      passwordRequirements: {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: true
      },
      ipWhitelist: ['192.168.1.0/24'],
      auditLogging: true,
      encryptionEnabled: true
    });

    const [users, setUsers] = useState([
      {
        id: 1,
        name: 'John Administrator',
        email: 'admin@fadedskies.com',
        role: 'Administrator',
        status: 'Active',
        lastLogin: '2025-01-16 14:30',
        permissions: ['all']
      },
      {
        id: 2,
        name: 'Sarah Manager',
        email: 'sarah@fadedskies.com',
        role: 'Manager',
        status: 'Active',
        lastLogin: '2025-01-16 13:45',
        permissions: ['orders', 'products', 'customers', 'analytics']
      },
      {
        id: 3,
        name: 'Mike Driver',
        email: 'mike@fadedskies.com',
        role: 'Driver',
        status: 'Active',
        lastLogin: '2025-01-16 12:15',
        permissions: ['tracking', 'deliveries']
      }
    ]);

    const [integrations, setIntegrations] = useState([
      { id: 1, name: 'Shopify', status: 'Connected', type: 'E-commerce', icon: '🛒' },
      { id: 2, name: 'QuickBooks', status: 'Connected', type: 'Accounting', icon: '📊' },
      { id: 3, name: 'Mailchimp', status: 'Disconnected', type: 'Marketing', icon: '📧' },
      { id: 4, name: 'Twilio', status: 'Connected', type: 'SMS/Calls', icon: '📱' },
      { id: 5, name: 'METRC', status: 'Connected', type: 'Compliance', icon: '🏛️' },
      { id: 6, name: 'Stripe', status: 'Connected', type: 'Payments', icon: '💳' }
    ]);

    const settingsTabs = [
      { id: 'general', icon: '🏢', label: 'Business Info' },
      { id: 'delivery', icon: '🚚', label: 'Delivery' },
      { id: 'compliance', icon: '🏛️', label: 'Compliance' },
      { id: 'users', icon: '👥', label: 'Users' },
      { id: 'notifications', icon: '🔔', label: 'Notifications' },
      { id: 'integrations', icon: '🔗', label: 'Integrations' },
      { id: 'security', icon: '🔒', label: 'Security' },
      { id: 'system', icon: '⚙️', label: 'System' },
      { id: 'backup', icon: '💾', label: 'Data' }
    ];

    const saveSettings = (settingsType) => {
      alert(`✅ ${settingsType} settings saved successfully!`);
    };

    const resetSettings = (settingsType) => {
      if (window.confirm(`Are you sure you want to reset ${settingsType} settings to defaults?`)) {
        alert(`🔄 ${settingsType} settings reset to defaults`);
      }
    };

    const exportSettings = () => {
      const allSettings = {
        business: businessSettings,
        system: systemSettings,
        delivery: deliverySettings,
        compliance: complianceSettings,
        security: securitySettings,
        users: users,
        integrations: integrations
      };
      alert('📄 Settings exported successfully!\n\nDownload: faded-skies-settings.json');
    };

    const importSettings = () => {
      alert('📥 Import settings from backup file\n\nSelect a previously exported settings file to restore configuration');
    };

    const renderGeneralSettings = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🏢 Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
              <input
                type="text"
                value={businessSettings.businessName}
                onChange={(e) => setBusinessSettings({...businessSettings, businessName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">License Number</label>
              <input
                type="text"
                value={businessSettings.licenseNumber}
                onChange={(e) => setBusinessSettings({...businessSettings, licenseNumber: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={businessSettings.phone}
                onChange={(e) => setBusinessSettings({...businessSettings, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={businessSettings.email}
                onChange={(e) => setBusinessSettings({...businessSettings, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address</label>
            <textarea
              value={businessSettings.address}
              onChange={(e) => setBusinessSettings({...businessSettings, address: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              rows={2}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🕒 Operating Hours</h3>
          <div className="space-y-4">
            {Object.entries(businessSettings.operatingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={hours.enabled}
                    onChange={(e) => setBusinessSettings({
                      ...businessSettings,
                      operatingHours: {
                        ...businessSettings.operatingHours,
                        [day]: { ...hours, enabled: e.target.checked }
                      }
                    })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-gray-900 capitalize w-20">{day}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => setBusinessSettings({
                      ...businessSettings,
                      operatingHours: {
                        ...businessSettings.operatingHours,
                        [day]: { ...hours, open: e.target.value }
                      }
                    })}
                    disabled={!hours.enabled}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => setBusinessSettings({
                      ...businessSettings,
                      operatingHours: {
                        ...businessSettings.operatingHours,
                        [day]: { ...hours, close: e.target.value }
                      }
                    })}
                    disabled={!hours.enabled}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => saveSettings('Business')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={() => resetSettings('Business')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    );

    const renderDeliverySettings = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🚚 Delivery Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Free Delivery Threshold ($)</label>
              <input
                type="number"
                step="0.01"
                value={deliverySettings.freeDeliveryThreshold}
                onChange={(e) => setDeliverySettings({...deliverySettings, freeDeliveryThreshold: parseFloat(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Fee ($)</label>
              <input
                type="number"
                step="0.01"
                value={deliverySettings.deliveryFee}
                onChange={(e) => setDeliverySettings({...deliverySettings, deliveryFee: parseFloat(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Delivery Radius (miles)</label>
              <input
                type="number"
                value={deliverySettings.maxDeliveryRadius}
                onChange={(e) => setDeliverySettings({...deliverySettings, maxDeliveryRadius: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Delivery Time (minutes)</label>
              <input
                type="number"
                value={deliverySettings.estimatedDeliveryTime}
                onChange={(e) => setDeliverySettings({...deliverySettings, estimatedDeliveryTime: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">📋 Delivery Requirements</h3>
          <div className="space-y-4">
            {[
              { key: 'emergencyContactEnabled', label: 'Emergency Contact Required', desc: 'Require emergency contact for all deliveries' },
              { key: 'gpsTrackingEnabled', label: 'GPS Tracking', desc: 'Enable real-time GPS tracking for drivers' },
              { key: 'photoConfirmation', label: 'Photo Confirmation', desc: 'Require delivery confirmation photos' },
              { key: 'signatureRequired', label: 'Digital Signature', desc: 'Require customer signature on delivery' }
            ].map(setting => (
              <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">{setting.label}</p>
                  <p className="text-sm text-gray-600">{setting.desc}</p>
                </div>
                <button
                  onClick={() => setDeliverySettings({...deliverySettings, [setting.key]: !deliverySettings[setting.key]})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    deliverySettings[setting.key] ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    deliverySettings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => saveSettings('Delivery')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={() => resetSettings('Delivery')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    );

    const renderComplianceSettings = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🏛️ Cannabis Compliance</h3>
          <div className="space-y-4">
            {[
              { key: 'ageVerificationRequired', label: 'Age Verification Required', desc: 'Require age verification for all customers' },
              { key: 'idScanningEnabled', label: 'ID Scanning', desc: 'Enable ID scanning for verification' },
              { key: 'labTestingRequired', label: 'Lab Testing Required', desc: 'Require lab test results for all products' },
              { key: 'batchTrackingEnabled', label: 'Batch Tracking', desc: 'Enable seed-to-sale batch tracking' },
              { key: 'metrcIntegration', label: 'METRC Integration', desc: 'Sync with state tracking system' }
            ].map(setting => (
              <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">{setting.label}</p>
                  <p className="text-sm text-gray-600">{setting.desc}</p>
                </div>
                <button
                  onClick={() => setComplianceSettings({...complianceSettings, [setting.key]: !complianceSettings[setting.key]})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    complianceSettings[setting.key] ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    complianceSettings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">💰 Purchase Limits & Tax</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Purchase Limit ($)</label>
              <input
                type="number"
                value={complianceSettings.purchaseLimits.dailyLimit}
                onChange={(e) => setComplianceSettings({
                  ...complianceSettings,
                  purchaseLimits: { ...complianceSettings.purchaseLimits, dailyLimit: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Purchase Limit ($)</label>
              <input
                type="number"
                value={complianceSettings.purchaseLimits.monthlyLimit}
                onChange={(e) => setComplianceSettings({
                  ...complianceSettings,
                  purchaseLimits: { ...complianceSettings.purchaseLimits, monthlyLimit: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Flower Limit (grams)</label>
              <input
                type="number"
                value={complianceSettings.purchaseLimits.flowerLimit}
                onChange={(e) => setComplianceSettings({
                  ...complianceSettings,
                  purchaseLimits: { ...complianceSettings.purchaseLimits, flowerLimit: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={complianceSettings.taxRate}
                onChange={(e) => setComplianceSettings({...complianceSettings, taxRate: parseFloat(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => saveSettings('Compliance')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={() => resetSettings('Compliance')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    );

    const renderUsersSettings = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">👥 User Management</h3>
            <button
              onClick={() => alert('🆕 Add new user functionality\n\nThis would open a form to create new users with specific roles and permissions.')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              + Add User
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'Administrator' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'Active' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.lastLogin}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => alert(`✏️ Edit user: ${user.name}\n\nThis would open a form to modify user details, role, and permissions.`)}
                          className="text-emerald-600 hover:text-emerald-900 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Deactivate user ${user.name}?`)) {
                              alert(`🚫 User ${user.name} deactivated`);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🔐 Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-purple-200 rounded-xl bg-purple-50">
              <h4 className="font-bold text-purple-800 mb-3">Administrator</h4>
              <ul className="text-sm space-y-1 text-purple-700">
                <li>• Full system access</li>
                <li>• User management</li>
                <li>• Settings configuration</li>
                <li>• Financial reports</li>
                <li>• Compliance oversight</li>
              </ul>
            </div>
            <div className="p-4 border border-blue-200 rounded-xl bg-blue-50">
              <h4 className="font-bold text-blue-800 mb-3">Manager</h4>
              <ul className="text-sm space-y-1 text-blue-700">
                <li>• Orders & inventory</li>
                <li>• Customer management</li>
                <li>• Analytics & reports</li>
                <li>• Driver coordination</li>
                <li>• Product management</li>
              </ul>
            </div>
            <div className="p-4 border border-green-200 rounded-xl bg-green-50">
              <h4 className="font-bold text-green-800 mb-3">Driver</h4>
              <ul className="text-sm space-y-1 text-green-700">
                <li>• Delivery tracking</li>
                <li>• Route optimization</li>
                <li>• Customer communication</li>
                <li>• Order updates</li>
                <li>• Basic reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );

    const renderIntegrationsSettings = () => (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🔗 System Integrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map(integration => (
              <div key={integration.id} className={`p-6 border-2 rounded-xl transition-all ${
                integration.status === 'Connected' 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <h4 className="font-bold text-gray-900">{integration.name}</h4>
                      <p className="text-sm text-gray-600">{integration.type}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    integration.status === 'Connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {integration.status}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      const newStatus = integration.status === 'Connected' ? 'Disconnected' : 'Connected';
                      setIntegrations(prev => prev.map(int => 
                        int.id === integration.id ? { ...int, status: newStatus } : int
                      ));
                      alert(`${integration.name} ${newStatus.toLowerCase()} successfully!`);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      integration.status === 'Connected'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {integration.status === 'Connected' ? 'Disconnect' : 'Connect'}
                  </button>
                  <button
                    onClick={() => alert(`⚙️ Configure ${integration.name}\n\nThis would open integration-specific settings and API configuration.`)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ⚙️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🔧 API Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">API Base URL</label>
              <input
                type="url"
                value="https://api.fadedskies.com/v1"
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Webhook URL</label>
              <input
                type="url"
                value="https://hooks.fadedskies.com/webhooks"
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => alert('🔄 API keys regenerated successfully!\n\nPlease update your integrations with the new keys.')}
                className="px-4 py-2 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
              >
                Regenerate API Keys
              </button>
              <button
                onClick={() => alert('📋 API documentation copied to clipboard!\n\nDeveloper documentation: https://docs.fadedskies.com/api')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                View API Docs
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    const renderCurrentTab = () => {
      switch (activeSettingsTab) {
        case 'general':
          return renderGeneralSettings();
        case 'delivery':
          return renderDeliverySettings();
        case 'compliance':
          return renderComplianceSettings();
        case 'users':
          return renderUsersSettings();
        case 'notifications':
          return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">🔔 Notification Settings</h3>
              <p className="text-gray-600 mb-4">Configure how and when you receive notifications about orders, deliveries, and system events.</p>
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive text message alerts' },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser and mobile push notifications' }
                ].map(setting => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">{setting.label}</p>
                      <p className="text-sm text-gray-600">{setting.desc}</p>
                    </div>
                    <button
                      onClick={() => setSystemSettings({...systemSettings, [setting.key]: !systemSettings[setting.key]})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        systemSettings[setting.key] ? 'bg-emerald-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        systemSettings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'integrations':
          return renderIntegrationsSettings();
        case 'security':
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">🔒 Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600">Add extra security to your account</p>
                    </div>
                    <button
                      onClick={() => {
                        setSecuritySettings({...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth});
                        alert(securitySettings.twoFactorAuth ? '🔓 2FA disabled' : '🔐 2FA enabled - Scan QR code with authenticator app');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        securitySettings.twoFactorAuth ? 'bg-emerald-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        case 'system':
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">⚙️ System Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                    <select
                      value={systemSettings.language}
                      onChange={(e) => setSystemSettings({...systemSettings, language: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                    <select
                      value={systemSettings.timezone}
                      onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="America/Chicago">Central Time (US)</option>
                      <option value="America/New_York">Eastern Time (US)</option>
                      <option value="America/Los_Angeles">Pacific Time (US)</option>
                      <option value="America/Denver">Mountain Time (US)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4 mt-6">
                  {[
                    { key: 'autoAssignOrders', label: 'Auto-Assign Orders', desc: 'Automatically assign orders to drivers' },
                    { key: 'routeOptimization', label: 'Route Optimization', desc: 'Enable AI-powered route optimization' },
                    { key: 'priorityEscalation', label: 'Priority Escalation', desc: 'Auto-escalate delayed orders' },
                    { key: 'darkMode', label: 'Dark Mode', desc: 'Use dark theme interface' }
                  ].map(setting => (
                    <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900">{setting.label}</p>
                        <p className="text-sm text-gray-600">{setting.desc}</p>
                      </div>
                      <button
                        onClick={() => setSystemSettings({...systemSettings, [setting.key]: !systemSettings[setting.key]})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          systemSettings[setting.key] ? 'bg-emerald-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          systemSettings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        case 'backup':
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">💾 Data Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border border-blue-200 rounded-xl bg-blue-50">
                    <h4 className="font-bold text-blue-800 mb-3">📤 Export Data</h4>
                    <p className="text-sm text-blue-700 mb-4">Download all your business data including orders, customers, products, and settings.</p>
                    <button
                      onClick={exportSettings}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Export All Data
                    </button>
                  </div>
                  
                  <div className="p-6 border border-green-200 rounded-xl bg-green-50">
                    <h4 className="font-bold text-green-800 mb-3">📥 Import Data</h4>
                    <p className="text-sm text-green-700 mb-4">Restore your business data from a previously exported backup file.</p>
                    <button
                      onClick={importSettings}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Import Backup
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <h4 className="font-bold text-yellow-800 mb-2">⚠️ Important Backup Information</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Automatic backups run daily at 2:00 AM</li>
                    <li>• Backups are stored securely for 30 days</li>
                    <li>• Export includes all business data except user passwords</li>
                    <li>• Contact support for restore assistance</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">🗂️ Data Storage</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Database Size</p>
                      <p className="text-sm text-gray-600">Current data usage</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">2.4 GB</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Storage Limit</p>
                      <p className="text-sm text-gray-600">Total available storage</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">10 GB</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-emerald-600 h-3 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">24% of storage used</p>
                </div>
              </div>
            </div>
          );
        default:
          return <div>Settings tab not found</div>;
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">⚙️ System Settings</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={exportSettings}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Export Settings</span>
            </button>
            <button
              onClick={() => alert('✅ All settings saved successfully!')}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save All</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Settings Categories</h3>
            <nav className="space-y-2">
              {settingsTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${
                    activeSettingsTab === tab.id 
                      ? 'bg-emerald-100 text-emerald-800 font-semibold' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {renderCurrentTab()}
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex space-x-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    alert('🔐 Password changed successfully!');
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Analytics View with Live Data
  const AnalyticsView = () => {
    // Add state for analytics customization
    const [dateRange, setDateRange] = useState('7d');
    const [showExportModal, setShowExportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMetric, setEditingMetric] = useState(null);
    const [customMetrics, setCustomMetrics] = useState([
      { id: 1, name: 'Customer Satisfaction', value: '96%', enabled: true },
      { id: 2, name: 'Driver Utilization', value: '78%', enabled: true },
      { id: 3, name: 'Inventory Turnover', value: '2.4x', enabled: false }
    ]);

    // Calculate analytics data
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const todayRevenue = orders.filter(o => o.orderDate === new Date().toISOString().split('T')[0]).reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const completionRate = orders.length > 0 ? (orders.filter(o => o.status === 'delivered').length / orders.length) * 100 : 0;
    
    // Driver efficiency metrics
    const avgDriverEfficiency = drivers.length > 0 ? drivers.reduce((sum, d) => sum + d.efficiency, 0) / drivers.length : 0;
    const topPerformingDriver = drivers.reduce((best, current) => 
      current.ordersToday > best.ordersToday ? current : best, drivers[0] || {});
    
    // Product performance
    const productSales = products.map(product => {
      const sales = orders.reduce((sum, order) => {
        const item = order.items.find(i => i.productId === product.id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      return { name: product.name.split(' - ')[1] || product.name, sales, revenue: sales * product.price };
    }).sort((a, b) => b.sales - a.sales);

    // Revenue trend data (simulated for demo)
    const revenueData = [
      { date: '01/07', revenue: 2400, orders: 24 },
      { date: '01/08', revenue: 1398, orders: 18 },
      { date: '01/09', revenue: 9800, orders: 45 },
      { date: '01/10', revenue: 3908, orders: 32 },
      { date: '01/11', revenue: 4800, orders: 38 },
      { date: '01/12', revenue: 3800, orders: 29 },
      { date: '01/13', revenue: 4300, orders: 34 }
    ];

    // Order status distribution
    const orderStatusData = [
      { status: 'Delivered', count: orders.filter(o => o.status === 'delivered').length, color: '#10b981' },
      { status: 'En-Route', count: orders.filter(o => o.status === 'en-route').length, color: '#3b82f6' },
      { status: 'Processing', count: orders.filter(o => o.status === 'processing').length, color: '#f59e0b' },
      { status: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length, color: '#ef4444' }
    ];

    // Delivery performance by zone
    const zonePerformance = ['central', 'east', 'west', 'south', 'north'].map(zone => {
      const zoneDeliveries = activeDeliveries.filter(d => d.zone === zone);
      const avgProgress = zoneDeliveries.length > 0 ? 
        zoneDeliveries.reduce((sum, d) => sum + d.progress, 0) / zoneDeliveries.length : 0;
      return {
        zone: zone.charAt(0).toUpperCase() + zone.slice(1),
        deliveries: zoneDeliveries.length,
        avgProgress,
        drivers: drivers.filter(d => d.zone === zone && d.online).length
      };
    });

    // Export functions
    const exportToCSV = (data, filename) => {
      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(data[0]).join(",") + "\n" +
        data.map(row => Object.values(row).join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`📊 ${filename} exported successfully!`);
    };

    const exportToPDF = (title) => {
      // Simulate PDF export
      alert(`📄 Generating PDF report: "${title}"\n\nThis would create a comprehensive PDF with all charts and data tables.`);
    };

    const exportToExcel = (data, filename) => {
      // Simulate Excel export
      alert(`📗 Exporting ${filename} to Excel format\n\nThis would create a formatted .xlsx file with multiple sheets and charts.`);
    };

    const exportFullReport = () => {
      const reportData = {
        summary: {
          totalRevenue,
          avgOrderValue,
          completionRate,
          avgDriverEfficiency: avgDriverEfficiency * 100,
          totalOrders: orders.length,
          totalCustomers: customers.length
        },
        orders: orders,
        customers: customers,
        drivers: drivers,
        products: productSales,
        activeDeliveries: activeDeliveries
      };
      
      alert(`📊 Full Analytics Report Generated!\n\nReport includes:\n• Revenue Analysis\n• Customer Data\n• Driver Performance\n• Product Sales\n• Operational Metrics\n\nWould be exported as a comprehensive Excel workbook with multiple sheets.`);
    };

    // Edit functions
    const saveCustomMetric = () => {
      if (editingMetric) {
        setCustomMetrics(prev => prev.map(m => 
          m.id === editingMetric.id ? editingMetric : m
        ));
      } else {
        const newMetric = {
          id: Math.max(...customMetrics.map(m => m.id), 0) + 1,
          name: 'New Metric',
          value: '0%',
          enabled: true
        };
        setCustomMetrics(prev => [...prev, newMetric]);
      }
      setEditingMetric(null);
      setShowEditModal(false);
      alert('✅ Custom metric saved successfully!');
    };

    const deleteCustomMetric = (id) => {
      if (window.confirm('Are you sure you want to delete this custom metric?')) {
        setCustomMetrics(prev => prev.filter(m => m.id !== id));
        alert('🗑️ Custom metric deleted successfully!');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Live Analytics Dashboard</h1>
          <div className="flex items-center space-x-4">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="1d">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Edit Dashboard Button */}
            <button 
              onClick={() => setShowEditModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Dashboard</span>
            </button>

            {/* Export Button */}
            <button 
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Export Data</span>
            </button>

            {/* Live Status */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">Live Data</span>
            </div>

            {/* Refresh Button */}
            <button 
              onClick={() => {
                setForceRender(prev => prev + 1);
                alert('📊 Analytics data refreshed!');
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-2xl p-6 relative group">
            <button 
              onClick={() => exportToCSV([{metric: 'Total Revenue', value: totalRevenue, date: new Date().toISOString()}], 'revenue_data')}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-lg shadow-lg hover:bg-gray-50"
              title="Export Revenue Data"
            >
              📊
            </button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-emerald-800">Total Revenue</h3>
              <div className="w-12 h-12 bg-emerald-200 rounded-xl flex items-center justify-center">
                💰
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600">${totalRevenue.toFixed(0)}</p>
            <p className="text-sm text-emerald-600 mt-1">
              Today: ${todayRevenue.toFixed(0)} (+{((todayRevenue/totalRevenue)*100).toFixed(1)}%)
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-2xl p-6 relative group">
            <button 
              onClick={() => exportToCSV([{metric: 'Avg Order Value', value: avgOrderValue, orders: orders.length}], 'order_value_data')}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-lg shadow-lg hover:bg-gray-50"
              title="Export Order Value Data"
            >
              📊
            </button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-800">Avg Order Value</h3>
              <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                📊
              </div>
            </div>
            <p className="text-3xl font-black text-blue-600">${avgOrderValue.toFixed(0)}</p>
            <p className="text-sm text-blue-600 mt-1">Per order average</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-2xl p-6 relative group">
            <button 
              onClick={() => exportToCSV(orderStatusData, 'completion_rate_data')}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-lg shadow-lg hover:bg-gray-50"
              title="Export Completion Data"
            >
              📊
            </button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-800">Completion Rate</h3>
              <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                ✅
              </div>
            </div>
            <p className="text-3xl font-black text-purple-600">{completionRate.toFixed(1)}%</p>
            <p className="text-sm text-purple-600 mt-1">Orders delivered successfully</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-100 border border-orange-200 rounded-2xl p-6 relative group">
            <button 
              onClick={() => exportToCSV(drivers.map(d => ({name: d.name, efficiency: d.efficiency, orders: d.ordersToday})), 'driver_efficiency_data')}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-lg shadow-lg hover:bg-gray-50"
              title="Export Driver Data"
            >
              📊
            </button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-orange-800">Driver Efficiency</h3>
              <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                🚗
              </div>
            </div>
            <p className="text-3xl font-black text-orange-600">{(avgDriverEfficiency * 100).toFixed(0)}%</p>
            <p className="text-sm text-orange-600 mt-1">Average efficiency score</p>
          </div>
        </div>

        {/* Custom Metrics Row */}
        {customMetrics.filter(m => m.enabled).length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">📋 Custom Metrics</h3>
              <button 
                onClick={() => {
                  setEditingMetric(null);
                  setShowEditModal(true);
                }}
                className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
              >
                + Add Metric
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {customMetrics.filter(m => m.enabled).map(metric => (
                <div key={metric.id} className="bg-white rounded-xl p-4 border border-gray-200 relative group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button 
                      onClick={() => {
                        setEditingMetric(metric);
                        setShowEditModal(true);
                      }}
                      className="p-1 bg-gray-100 rounded hover:bg-gray-200 text-xs"
                      title="Edit Metric"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => deleteCustomMetric(metric.id)}
                      className="p-1 bg-gray-100 rounded hover:bg-gray-200 text-xs"
                      title="Delete Metric"
                    >
                      🗑️
                    </button>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{metric.name}</h4>
                  <p className="text-2xl font-bold text-indigo-600">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
              <button 
                onClick={() => exportToCSV(revenueData, 'revenue_trend')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                title="Export Chart Data"
              >
                📊 CSV
              </button>
              <button 
                onClick={() => exportToPDF('Revenue Trend Chart')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                title="Export as PDF"
              >
                📄 PDF
              </button>
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Revenue Trend</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm text-gray-600">7-day trend</span>
              </div>
            </div>
            <div className="h-64 w-full">
              {/* Simple bar chart representation */}
              <div className="flex items-end justify-between h-full space-x-2">
                {revenueData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="text-xs text-gray-600 mb-2">${(data.revenue/1000).toFixed(1)}k</div>
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-1000"
                      style={{ height: `${(data.revenue / Math.max(...revenueData.map(d => d.revenue))) * 100}%` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{data.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
              <button 
                onClick={() => exportToCSV(orderStatusData, 'order_status_distribution')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                title="Export Chart Data"
              >
                📊 CSV
              </button>
              <button 
                onClick={() => exportToPDF('Order Status Distribution')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                title="Export as PDF"
              >
                📄 PDF
              </button>
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Order Status Distribution</h3>
              <span className="text-sm text-gray-600">{orders.length} total orders</span>
            </div>
            <div className="space-y-4">
              {orderStatusData.map((status, index) => {
                const percentage = orders.length > 0 ? (status.count / orders.length) * 100 : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: status.color }}
                      ></div>
                      <span className="font-medium text-gray-900">{status.status}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: status.color
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-600 w-12">
                        {status.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => exportToCSV(productSales, 'top_products')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                title="Export Product Data"
              >
                📊
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Top Selling Products</h3>
            <div className="space-y-4">
              {productSales.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-600">{product.sales} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${product.revenue.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Performance */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => exportToCSV(drivers.map(d => ({name: d.name, orders: d.ordersToday, rating: d.rating, efficiency: d.efficiency})), 'driver_performance')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                title="Export Driver Data"
              >
                📊
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Driver Performance</h3>
            <div className="space-y-4">
              {drivers.slice(0, 4).map((driver, index) => (
                <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center font-bold text-white ${
                      driver.online ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{driver.name}</p>
                      <p className="text-xs text-gray-600">{driver.ordersToday} orders today</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-sm font-semibold">{driver.rating}</span>
                    </div>
                    <p className="text-xs text-gray-600">{(driver.efficiency * 100).toFixed(0)}% eff.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zone Performance */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => exportToCSV(zonePerformance, 'zone_performance')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                title="Export Zone Data"
              >
                📊
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Zone Performance</h3>
            <div className="space-y-4">
              {zonePerformance.map((zone, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{zone.zone} Austin</span>
                    <span className="text-sm text-gray-600">{zone.deliveries} active</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{zone.drivers} drivers online</span>
                    <span className="font-semibold text-emerald-600">{zone.avgProgress.toFixed(0)}% avg progress</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${zone.avgProgress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6 relative group">
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => exportToCSV([
                {metric: 'Active Deliveries', value: activeDeliveries.length},
                {metric: 'Drivers Online', value: drivers.filter(d => d.online).length},
                {metric: 'Avg Progress', value: Math.round(activeDeliveries.reduce((sum, d) => sum + d.progress, 0) / Math.max(activeDeliveries.length, 1))},
                {metric: 'Unassigned Orders', value: activeDeliveries.filter(d => !d.driverId).length}
              ], 'live_metrics')}
              className="p-2 bg-white rounded-lg hover:bg-gray-50 text-sm shadow-lg"
              title="Export Live Metrics"
            >
              📊 Export
            </button>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-6">🔴 Live Metrics Dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-black text-indigo-600">{activeDeliveries.length}</div>
              <div className="text-sm text-gray-600">Active Deliveries</div>
              <div className="text-xs text-indigo-600 mt-1">
                {activeDeliveries.filter(d => d.priority === 'urgent').length} urgent
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-green-600">{drivers.filter(d => d.online).length}</div>
              <div className="text-sm text-gray-600">Drivers Online</div>
              <div className="text-xs text-green-600 mt-1">
                {drivers.filter(d => d.online && d.status === 'available').length} available
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-purple-600">
                {Math.round(activeDeliveries.reduce((sum, d) => sum + d.progress, 0) / Math.max(activeDeliveries.length, 1))}%
              </div>
              <div className="text-sm text-gray-600">Avg Delivery Progress</div>
              <div className="text-xs text-purple-600 mt-1">Real-time tracking</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-orange-600">
                {activeDeliveries.filter(d => !d.driverId).length}
              </div>
              <div className="text-sm text-gray-600">Unassigned Orders</div>
              <div className="text-xs text-orange-600 mt-1">Need drivers</div>
            </div>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => exportToCSV(customers.map(c => ({
                  name: c.name, 
                  orders: c.totalOrders, 
                  spent: c.totalSpent, 
                  loyaltyPoints: c.loyaltyPoints,
                  status: c.status
                })), 'customer_insights')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                title="Export Customer Data"
              >
                📊
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Customer Insights</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div>
                  <p className="font-semibold text-emerald-800">Customer Retention</p>
                  <p className="text-sm text-emerald-600">Repeat customer rate</p>
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {customers.length > 0 ? Math.round((customers.filter(c => c.totalOrders > 1).length / customers.length) * 100) : 0}%
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div>
                  <p className="font-semibold text-blue-800">Avg Customer Value</p>
                  <p className="text-sm text-blue-600">Lifetime spending</p>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  ${customers.length > 0 ? (customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length).toFixed(0) : 0}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div>
                  <p className="font-semibold text-purple-800">Loyalty Members</p>
                  <p className="text-sm text-purple-600">High-value customers</p>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {customers.filter(c => c.loyaltyPoints > 100).length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => exportToCSV([
                  {metric: 'On-Time Delivery', value: '94%'},
                  {metric: 'Avg Delivery Time', value: `${Math.round(activeDeliveries.reduce((sum, d) => sum + parseInt(d.estimatedTime), 0) / Math.max(activeDeliveries.length, 1))}m`},
                  {metric: 'Issue Resolution', value: '98%'}
                ], 'operational_metrics')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                title="Export Operational Data"
              >
                📊
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Operational Excellence</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div>
                  <p className="font-semibold text-green-800">On-Time Delivery</p>
                  <p className="text-sm text-green-600">Within ETA window</p>
                </div>
                <div className="text-2xl font-bold text-green-600">94%</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                <div>
                  <p className="font-semibold text-yellow-800">Avg Delivery Time</p>
                  <p className="text-sm text-yellow-600">From order to delivery</p>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(activeDeliveries.reduce((sum, d) => sum + parseInt(d.estimatedTime), 0) / Math.max(activeDeliveries.length, 1))}m
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                <div>
                  <p className="font-semibold text-red-800">Issue Resolution</p>
                  <p className="text-sm text-red-600">Problems solved quickly</p>
                </div>
                <div className="text-2xl font-bold text-red-600">98%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">📊 Export Analytics Data</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      exportFullReport();
                      setShowExportModal(false);
                    }}
                    className="p-6 border-2 border-emerald-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
                  >
                    <div className="text-2xl mb-2">📊</div>
                    <h3 className="font-bold text-gray-900 mb-2">Complete Analytics Report</h3>
                    <p className="text-sm text-gray-600">Full dashboard data in Excel format</p>
                  </button>

                  <button
                    onClick={() => {
                      exportToPDF('Analytics Dashboard');
                      setShowExportModal(false);
                    }}
                    className="p-6 border-2 border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="text-2xl mb-2">📄</div>
                    <h3 className="font-bold text-gray-900 mb-2">PDF Report</h3>
                    <p className="text-sm text-gray-600">Professional formatted report</p>
                  </button>

                  <button
                    onClick={() => {
                      exportToCSV(orders, 'all_orders');
                      setShowExportModal(false);
                    }}
                    className="p-6 border-2 border-purple-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                  >
                    <div className="text-2xl mb-2">📦</div>
                    <h3 className="font-bold text-gray-900 mb-2">Orders Data</h3>
                    <p className="text-sm text-gray-600">All order details in CSV</p>
                  </button>

                  <button
                    onClick={() => {
                      exportToCSV(customers, 'customer_database');
                      setShowExportModal(false);
                    }}
                    className="p-6 border-2 border-orange-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                  >
                    <div className="text-2xl mb-2">👥</div>
                    <h3 className="font-bold text-gray-900 mb-2">Customer Database</h3>
                    <p className="text-sm text-gray-600">Customer info and analytics</p>
                  </button>

                  <button
                    onClick={() => {
                      exportToCSV(drivers, 'driver_performance');
                      setShowExportModal(false);
                    }}
                    className="p-6 border-2 border-green-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-left"
                  >
                    <div className="text-2xl mb-2">🚗</div>
                    <h3 className="font-bold text-gray-900 mb-2">Driver Analytics</h3>
                    <p className="text-sm text-gray-600">Performance and efficiency data</p>
                  </button>

                  <button
                    onClick={() => {
                      exportToCSV(productSales, 'product_performance');
                      setShowExportModal(false);
                    }}
                    className="p-6 border-2 border-yellow-200 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 transition-all text-left"
                  >
                    <div className="text-2xl mb-2">🌿</div>
                    <h3 className="font-bold text-gray-900 mb-2">Product Sales</h3>
                    <p className="text-sm text-gray-600">Top products and revenue</p>
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dashboard Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">✏️ Edit Dashboard</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {editingMetric ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Edit Custom Metric</h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Metric Name</label>
                      <input
                        type="text"
                        value={editingMetric.name}
                        onChange={(e) => setEditingMetric({ ...editingMetric, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        placeholder="Metric Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Value</label>
                      <input
                        type="text"
                        value={editingMetric.value}
                        onChange={(e) => setEditingMetric({ ...editingMetric, value: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        placeholder="95%"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingMetric.enabled}
                        onChange={(e) => setEditingMetric({ ...editingMetric, enabled: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <label className="text-sm font-medium text-gray-700">Show on dashboard</label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">Dashboard Customization</h3>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Custom Metrics</h4>
                      <div className="space-y-2">
                        {customMetrics.map(metric => (
                          <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={metric.enabled}
                                onChange={(e) => {
                                  setCustomMetrics(prev => prev.map(m => 
                                    m.id === metric.id ? { ...m, enabled: e.target.checked } : m
                                  ));
                                }}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{metric.name}</p>
                                <p className="text-sm text-gray-600">{metric.value}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setEditingMetric(metric)}
                                className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteCustomMetric(metric.id)}
                                className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setEditingMetric({
                          id: Math.max(...customMetrics.map(m => m.id), 0) + 1,
                          name: 'New Metric',
                          value: '0%',
                          enabled: true
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                    >
                      + Add New Metric
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 flex space-x-4 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMetric(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomMetric}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Products Management View
  const ProductsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              console.log('🟢 ADD PRODUCT CLICKED');
              openProductModal();
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">Total Products</h3>
          <p className="text-3xl font-black text-blue-600">{products.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Active Products</h3>
          <p className="text-3xl font-black text-green-600">{products.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Low Stock</h3>
          <p className="text-3xl font-black text-yellow-600">{products.filter(p => p.stock < 30).length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-2">Categories</h3>
          <p className="text-3xl font-black text-purple-600">{new Set(products.map(p => p.category)).size}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Product Inventory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">THC/CBD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 mr-3 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span className={`text-2xl ${product.imageUrl ? 'hidden' : ''}`}>
                          {product.image}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.supplier}</div>
                        {product.strainType && (
                          <div className="text-xs text-gray-400">
                            {product.strainType === 'indica' ? '🌙 Indica' :
                             product.strainType === 'sativa' ? '☀️ Sativa' :
                             product.strainType === 'hybrid' ? '🌗 Hybrid' :
                             product.strainType === 'cbd' ? '💧 CBD' : product.strainType}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.stock < 30 ? 'bg-red-100 text-red-800' :
                      product.stock < 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>THC: {product.thc}</div>
                    <div>CBD: {product.cbd}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' :
                      product.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log('🟢 EDIT PRODUCT CLICKED for:', product.name);
                          openProductModal(product);
                        }}
                        className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteProduct(product.id);
                        }}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Product Image Section */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📸 Product Image</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={productForm.imageUrl || ''}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://example.com/product-image.jpg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter a direct link to your product image</p>
                    
                    {/* File Upload Simulation */}
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Or Upload Image</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              // Simulate file upload - in real app would upload to server
                              const fakeUrl = `https://cdn.fadedskies.com/products/${Date.now()}-${e.target.files[0].name}`;
                              setProductForm({ ...productForm, imageUrl: fakeUrl });
                              alert(`📸 Image "${e.target.files[0].name}" uploaded successfully!\n\nGenerated URL: ${fakeUrl}`);
                            }
                          }}
                          className="hidden"
                          id="product-image-upload"
                        />
                        <label htmlFor="product-image-upload" className="cursor-pointer">
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            📤
                          </div>
                          <p className="text-sm font-medium text-gray-900">Click to upload image</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Image Preview */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Preview</label>
                    <div className="w-full h-48 bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                      {productForm.imageUrl ? (
                        <img 
                          src={productForm.imageUrl} 
                          alt="Product preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`flex flex-col items-center justify-center text-gray-400 ${productForm.imageUrl ? 'hidden' : ''}`}>
                        <div className="text-4xl mb-2">
                          {productForm.category === 'Flower' ? '🌿' : 
                           productForm.category === 'Edibles' ? '🍯' :
                           productForm.category === 'Concentrates' ? '💨' : '💧'}
                        </div>
                        <p className="text-sm">No image selected</p>
                        <p className="text-xs">Category icon will be used</p>
                      </div>
                    </div>
                    
                    {productForm.imageUrl && (
                      <button
                        onClick={() => setProductForm({ ...productForm, imageUrl: '' })}
                        className="mt-2 w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                      >
                        🗑️ Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Product Information */}
              <div className="bg-blue-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="Premium Cannabis Flower - Blue Dream"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Flower">🌿 Flower</option>
                      <option value="Edibles">🍯 Edibles</option>
                      <option value="Concentrates">💨 Concentrates</option>
                      <option value="CBD Products">💧 CBD Products</option>
                      <option value="Accessories">🔧 Accessories</option>
                      <option value="Pre-Rolls">🚬 Pre-Rolls</option>
                    </select>
                  </div>
                </div>

                {/* Product Description */}
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Description *</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    rows={4}
                    placeholder="Describe your product... Include effects, flavor profile, growing methods, potency, recommended use, etc."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">Detailed descriptions help customers make informed decisions</p>
                    <span className="text-xs text-gray-400">{productForm.description.length}/500</span>
                  </div>
                </div>
              </div>

              {/* Pricing and Inventory */}
              <div className="bg-green-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Pricing & Inventory</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="45.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={productForm.status}
                      onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="active">✅ Active</option>
                      <option value="low_stock">⚠️ Low Stock</option>
                      <option value="inactive">❌ Inactive</option>
                      <option value="coming_soon">🔜 Coming Soon</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cannabis-Specific Information */}
              <div className="bg-purple-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🧬 Cannabis Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">THC Content</label>
                    <input
                      type="text"
                      value={productForm.thc}
                      onChange={(e) => setProductForm({ ...productForm, thc: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="18% or 10mg per piece"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">CBD Content</label>
                    <input
                      type="text"
                      value={productForm.cbd}
                      onChange={(e) => setProductForm({ ...productForm, cbd: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="2% or 1000mg"
                    />
                  </div>
                </div>

                {/* Additional Cannabis Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Strain Type</label>
                    <select
                      value={productForm.strainType || ''}
                      onChange={(e) => setProductForm({ ...productForm, strainType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select strain type</option>
                      <option value="indica">🌙 Indica</option>
                      <option value="sativa">☀️ Sativa</option>
                      <option value="hybrid">🌗 Hybrid</option>
                      <option value="cbd">💧 CBD Dominant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Effects</label>
                    <input
                      type="text"
                      value={productForm.effects || ''}
                      onChange={(e) => setProductForm({ ...productForm, effects: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="Relaxing, Euphoric, Creative..."
                    />
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div className="bg-orange-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏭 Supplier Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier Name</label>
                    <input
                      type="text"
                      value={productForm.supplier}
                      onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="Green Valley Farms"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Batch Number</label>
                    <input
                      type="text"
                      value={productForm.batchNumber || ''}
                      onChange={(e) => setProductForm({ ...productForm, batchNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="BD-2025-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Harvest Date</label>
                    <input
                      type="date"
                      value={productForm.harvestDate || ''}
                      onChange={(e) => setProductForm({ ...productForm, harvestDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Lab Test Results</label>
                    <input
                      type="url"
                      value={productForm.labResults || ''}
                      onChange={(e) => setProductForm({ ...productForm, labResults: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://lab.example.com/results/12345"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-4 flex-shrink-0">
              <button
                onClick={() => setShowProductModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProduct}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Orders Management View
  const OrdersView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={testModal}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            🧪 Test Modal
          </button>
          <button
            onClick={() => handleOpenOrderModal()}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* Orders Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">Total Orders</h3>
          <p className="text-3xl font-black text-blue-600">{orders.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Completed</h3>
          <p className="text-3xl font-black text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Processing</h3>
          <p className="text-3xl font-black text-yellow-600">{orders.filter(o => o.status === 'processing').length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-2">Revenue</h3>
          <p className="text-3xl font-black text-purple-600">${orders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">All Orders</h3>
          <p className="text-sm text-gray-600 mt-1">Manage and edit order details, status, and customer information</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.orderId}</div>
                      <div className="text-xs text-gray-500">Ordered: {order.orderDate}</div>
                      {order.deliveryDate && (
                        <div className="text-xs text-gray-500">Delivered: {order.deliveryDate}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{order.address}</div>
                      {order.notes && (
                        <div className="text-xs text-blue-600 italic mt-1">📝 {order.notes}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.items.map((item, index) => (
                        <div key={index} className="mb-1">
                          <span className="font-medium">{item.quantity}x</span> {item.name}
                          <div className="text-xs text-gray-500">${item.price.toFixed(2)} each</div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => quickUpdateOrderStatus(order.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'en-route' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="processing">PROCESSING</option>
                      <option value="en-route">EN-ROUTE</option>
                      <option value="delivered">DELIVERED</option>
                      <option value="cancelled">CANCELLED</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenOrderModal(order)}
                        className="text-emerald-600 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded"
                        title="Edit Order"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => duplicateOrder(order)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                        title="Duplicate Order"
                      >
                        📋
                      </button>
                      <button
                        onClick={() => {
                          const customer = customers.find(c => c.id === order.customerId);
                          if (customer) {
                            alert(`📞 Calling ${customer.name} at ${customer.phone}\n\nOrder: ${order.orderId}\nStatus: ${order.status}\nTotal: ${order.total.toFixed(2)}`);
                          }
                        }}
                        className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                        title="Call Customer"
                      >
                        📞
                      </button>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                        title="Delete Order"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No orders yet</p>
            <p className="text-sm">Create your first order to get started</p>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {orderModalData ? `Edit Order ${orderModalData.orderId}` : 'Create New Order'}
              </h2>
              <button
                onClick={handleCloseOrderModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer *</label>
                  <select
                    value={orderModalForm.customerId}
                    onChange={(e) => {
                      const customer = customers.find(c => c.id === parseInt(e.target.value));
                      setOrderModalForm({ 
                        ...orderModalForm, 
                        customerId: e.target.value,
                        address: customer ? customer.address : ''
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Order Status</label>
                  <select
                    value={orderModalForm.status}
                    onChange={(e) => setOrderModalForm({ ...orderModalForm, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="processing">Processing</option>
                    <option value="en-route">En Route</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                  <select
                    value={orderModalForm.paymentStatus}
                    onChange={(e) => setOrderModalForm({ ...orderModalForm, paymentStatus: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Amount</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold text-lg">
                    ${orderModalForm.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address</label>
                <textarea
                  value={orderModalForm.address}
                  onChange={(e) => setOrderModalForm({ ...orderModalForm, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  placeholder="Full delivery address..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Order Notes</label>
                <textarea
                  value={orderModalForm.notes}
                  onChange={(e) => setOrderModalForm({ ...orderModalForm, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Special instructions, preferences, etc..."
                />
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">Add Products to Order</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {products.filter(p => p.status === 'active').map(product => (
                    <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{product.image}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-600">${product.price.toFixed(2)} • {product.stock} in stock</p>
                          </div>
                        </div>
                        <button
                          onClick={() => addItemToOrderModal(product.id)}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Items */}
              {orderModalForm.items.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">Selected Items</label>
                  <div className="space-y-3">
                    {orderModalForm.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantityModal(item.productId, e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-center"
                          />
                          <span className="font-semibold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => removeItemFromOrderModal(item.productId)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-4 flex-shrink-0">
              <button
                onClick={handleCloseOrderModal}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveOrderModal}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {orderModalData ? 'Update Order' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Customers Management View
  const CustomersView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Customers Management</h1>
        <button
          onClick={() => {
            console.log('🟢 ADD CUSTOMER CLICKED');
            openCustomerModal();
          }}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <Users className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">Total Customers</h3>
          <p className="text-3xl font-black text-blue-600">{customers.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Verified</h3>
          <p className="text-3xl font-black text-green-600">{customers.filter(c => c.status === 'verified').length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">Avg Orders</h3>
          <p className="text-3xl font-black text-yellow-600">
            {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + c.totalOrders, 0) / customers.length) : 0}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-2">Total Revenue</h3>
          <p className="text-3xl font-black text-purple-600">
            ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Customer Database</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loyalty Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">Member since {customer.dateJoined}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.totalOrders} orders</div>
                    <div className="text-sm text-gray-500">Last: {customer.lastOrder || 'None'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      customer.status === 'verified' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {customer.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.loyaltyPoints} pts</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log('🟢 EDIT CUSTOMER CLICKED for:', customer.name);
                          openCustomerModal(customer);
                        }}
                        className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteCustomer(customer.id);
                        }}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Customer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={customerForm.status}
                    onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="pending_verification">Pending Verification</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Full address including city, state, and zip code"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex space-x-4 flex-shrink-0">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomer}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Dashboard View with Overview
  const DashboardView = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">Today's Orders</h3>
          <p className="text-3xl font-black text-blue-600">{orders.filter(o => o.orderDate === new Date().toISOString().split('T')[0]).length}</p>
          <p className="text-xs text-blue-600 mt-1">+12% from yesterday</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Active Deliveries</h3>
          <p className="text-3xl font-black text-green-600">{activeDeliveries.length}</p>
          <p className="text-xs text-green-600 mt-1">{drivers.filter(d => d.online).length} drivers online</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-2">Total Products</h3>
          <p className="text-3xl font-black text-purple-600">{products.length}</p>
          <p className="text-xs text-purple-600 mt-1">{products.filter(p => p.stock < 30).length} low stock</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-orange-800 mb-2">Revenue Today</h3>
          <p className="text-3xl font-black text-orange-600">
            ${orders.filter(o => o.orderDate === new Date().toISOString().split('T')[0]).reduce((sum, o) => sum + o.total, 0).toFixed(0)}
          </p>
          <p className="text-xs text-orange-600 mt-1">from {orders.filter(o => o.orderDate === new Date().toISOString().split('T')[0]).length} orders</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentView('orders')}
              className="flex items-center space-x-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
              <span className="font-semibold text-emerald-800">New Order</span>
            </button>
            <button
              onClick={() => setCurrentView('products')}
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              <Package className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-blue-800">Add Product</span>
            </button>
            <button
              onClick={() => setCurrentView('customers')}
              className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
            >
              <Users className="w-6 h-6 text-purple-600" />
              <span className="font-semibold text-purple-800">Add Customer</span>
            </button>
            <button
              onClick={() => setCurrentView('tracking')}
              className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
            >
              <Navigation className="w-6 h-6 text-orange-600" />
              <span className="font-semibold text-orange-800">Live Tracking</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{order.orderId}</p>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'tracking':
        return <TrackingView />;
      case 'dashboard':
        return <DashboardView />;
      case 'products':
        return <ProductsView />;
      case 'orders':
        return <OrdersView />;
      case 'customers':
        return <CustomersView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <PlaceholderView title="Settings" />;
      default:
        return <TrackingView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          {renderCurrentView()}
        </div>
      </div>

      {showRouteModal && <RouteEditorModal />}
    </div>
  );
};

export default FadedSkiesTrackingAdmin;