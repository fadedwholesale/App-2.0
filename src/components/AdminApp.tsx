import React, { useState, useEffect, useCallback } from 'react';
import { useCannabisDeliveryStore } from '../services/cannabis-delivery-store';
import {
  Home,
  Package,
  Users,
  User,
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
  Save,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Shield,
  Database,
  Globe,
  Zap,
  Mail,
  Smartphone,
  Lock,
  UserPlus,
  CreditCard,
  Truck,
  Award,
  Target,
  Activity,
  MessageCircle,
  UserPlus,
  RotateCcw,
  Search
} from 'lucide-react';

// Import simple WebSocket service for real-time admin monitoring
import { wsService } from '../services/simple-websocket';

const FadedSkiesTrackingAdmin = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isTrackingLive, setIsTrackingLive] = useState(false);

  // Store integration for real-time product sync
  const {
    products,
    setProducts,
    broadcastProductAdded,
    broadcastProductUpdated,
    broadcastProductDeleted,
    setupRealTimeSync
  } = useCannabisDeliveryStore();

  // Modal states
  const [modals, setModals] = useState({
    addProduct: false,
    editProduct: false,
    orderDetails: false,
    customerDetails: false,
    userManagement: false,
    confirmDelete: false,
    createUser: false,
    editUser: false,
    userDetails: false
  });

  // Selected items for modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: null, name: '' });

  // Modal management functions
  const openModal = (modalName, item = null) => {
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
        case 'userManagement':
          setSelectedUser(item);
          break;
        case 'confirmDelete':
          setDeleteTarget(item);
          break;
      }
    }
  };

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    // Clear selected items
    if (modalName === 'editProduct' || modalName === 'addProduct') setSelectedProduct(null);
    if (modalName === 'orderDetails') setSelectedOrder(null);
    if (modalName === 'customerDetails') setSelectedCustomer(null);
    if (modalName === 'userManagement') setSelectedUser(null);
    if (modalName === 'confirmDelete') setDeleteTarget({ type: '', id: null, name: '' });
  };

  // WebSocket connection for real-time admin monitoring
  useEffect(() => {
    try {
      // Connect WebSocket for admin monitoring
      wsService.connect('admin-session');

      // Set up real-time order notifications
      const handleNewOrder = (orderData) => {
        console.log('🔔 New order received:', orderData);

        // Add visual notification
        const notification = {
          id: Date.now(),
          type: 'order',
          title: 'New Order Received!',
          message: `Order ${orderData.orderId} from ${orderData.customerName} - $${orderData.total.toFixed(2)}`,
          timestamp: new Date(),
          priority: orderData.priority || 'normal'
        };

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification('New Order - Faded Skies Admin', {
            body: notification.message,
            icon: '/favicon.ico',
            tag: orderData.orderId
          });
        }

        // Play notification sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DwvmEaBy5+zPLZiTYIF2q+8uGVUQwQUarm7bllHgg2jdXxynkpBChxy+/eizEIHWq85OKgUgINeKvgN');
          audio.volume = 0.3;
          audio.play().catch(e => console.log('Audio notification failed:', e));
        } catch (e) {
          console.log('Audio notification not available');
        }
      };

      const handleOrderUpdate = (updateData) => {
        console.log('📊 Order status updated:', updateData);
      };

      const handleDriverStatusChange = (driverData) => {
        console.log('🚗 Driver status changed:', driverData);
      };

      // Subscribe to admin-specific channels
      wsService.send({
        type: 'admin:subscribe',
        channels: ['orders', 'drivers', 'system']
      });

      // Register event listeners for real-time notifications
      wsService.on('order_placed', handleNewOrder);
      wsService.on('order_update', handleOrderUpdate);
      wsService.on('driver_status_change', handleDriverStatusChange);

      console.log('✅ Admin WebSocket connected');

      return () => {
        try {
          // Remove event listeners
          wsService.off('order_placed', handleNewOrder);
          wsService.off('order_update', handleOrderUpdate);
          wsService.off('driver_status_change', handleDriverStatusChange);

          wsService.disconnect();
          console.log('🔌 Admin WebSocket disconnected');
        } catch (error) {
          console.warn('WebSocket disconnect error:', error);
        }
      };
    } catch (error) {
      console.error('Admin WebSocket connection failed:', error);
    }
  }, []);

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const closeAllModals = () => {
    setModals({
      addProduct: false,
      editProduct: false,
      orderDetails: false,
      customerDetails: false,
      userManagement: false,
      confirmDelete: false
    });
    setSelectedProduct(null);
    setSelectedOrder(null);
    setSelectedCustomer(null);
    setSelectedUser(null);
    setDeleteTarget({ type: '', id: null, name: '' });
  };

  // Handle keyboard events for modals
  useEffect(() => {
    const handleKeyDown = (event) => {
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

  // Initialize sample products if store is empty and setup real-time sync
  useEffect(() => {
    // Setup real-time sync for products
    setupRealTimeSync();

    // Initialize with sample data if products array is empty
    if (products.length === 0) {
      const initialProducts = [
        {
          id: 1,
          name: 'Premium Cannabis Flower - Blue Dream',
          category: 'Flower',
          price: 45.00,
          originalPrice: null,
          thc: '18%',
          cbd: '2%',
          strain: 'Hybrid',
          rating: 4.8,
          reviewCount: 125,
          imageUrl: 'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=400',
          description: 'Premium quality Blue Dream strain with balanced effects.',
          effects: ['Relaxed', 'Happy', 'Creative'],
          labTested: true,
          inStock: true,
          featured: true
        },
        {
          id: 2,
          name: 'Artisan Edibles - Gummy Bears 10mg',
          category: 'Edibles',
          price: 25.00,
          originalPrice: null,
          thc: '10mg per piece',
          cbd: '0mg',
          strain: 'Hybrid',
          rating: 4.6,
          reviewCount: 89,
          imageUrl: 'https://images.unsplash.com/photo-1582049404584-7d92b3e9c21c?w=400',
          description: 'Delicious gummy bears with precise 10mg THC dosing.',
          effects: ['Euphoric', 'Relaxed', 'Happy'],
          labTested: true,
          inStock: true,
          featured: false
        }
      ];
      setProducts(initialProducts);
      console.log('🌿 Initialized admin with sample products');
    }
  }, [products.length, setProducts, setupRealTimeSync]);

  const [customers] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 234-5678',
      address: '456 Oak Ave, Austin, TX 78701',
      totalOrders: 12,
      totalSpent: 540.00,
      status: 'verified'
    },
    {
      id: 2,
      name: 'Mike Rodriguez',
      email: 'mike.r@email.com',
      phone: '+1 (555) 345-6789',
      address: '789 Pine St, Austin, TX 78702',
      totalOrders: 8,
      totalSpent: 320.00,
      status: 'verified'
    }
  ]);

  const [orders] = useState([
    {
      id: 1,
      orderId: '#FS2025001',
      customerName: 'Sarah Johnson',
      items: [
        { name: 'Premium Cannabis Flower - Blue Dream', quantity: 2, price: 45.00 },
        { name: 'Artisan Edibles - Gummy Bears 10mg', quantity: 1, price: 25.00 }
      ],
      total: 115.00,
      status: 'delivered',
      orderDate: '2025-01-10',
      address: '456 Oak Ave, Austin, TX 78701'
    },
    {
      id: 2,
      orderId: '#FS2025002',
      customerName: 'Mike Rodriguez',
      items: [
        { name: 'Concentrate - Live Resin Cart', quantity: 1, price: 65.00 }
      ],
      total: 65.00,
      status: 'en-route',
      orderDate: '2025-01-11',
      address: '789 Pine St, Austin, TX 78702'
    }
  ]);

  const [drivers] = useState([
    {
      id: 1,
      name: 'Marcus Johnson',
      phone: '+1 (555) 234-5678',
      vehicle: 'Honda Civic - ABC123',
      status: 'delivering',
      ordersToday: 8,
      rating: 4.9,
      online: true,
      currentLocation: 'Downtown Austin'
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
      currentLocation: 'East Austin'
    }
  ]);

  const [activeDeliveries] = useState([
    {
      orderId: '#FS2025002',
      customer: 'Sarah Johnson',
      address: '456 Oak Ave, Austin, TX',
      estimatedTime: '12 minutes',
      progress: 65,
      status: 'en-route',
      priority: 'normal',
      driverId: 1
    },
    {
      orderId: '#FS2025004',
      customer: 'Emma Davis',
      address: '321 Elm St, Austin, TX',
      estimatedTime: '18 minutes',
      progress: 40,
      status: 'en-route',
      priority: 'high',
      driverId: 1
    }
  ]);

  // Base Modal Component
  const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
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

  // Add/Edit Product Modal
  const ProductModal = () => {
    const isEdit = modals.editProduct;
    const [formData, setFormData] = useState({
      name: selectedProduct?.name || '',
      category: selectedProduct?.category || 'Flower',
      price: selectedProduct?.price || '',
      stock: selectedProduct?.stock || '',
      thc: selectedProduct?.thc || '',
      cbd: selectedProduct?.cbd || '',
      supplier: selectedProduct?.supplier || '',
      description: '',
      featured: false,
      status: 'active'
    });

    const handleSubmit = (e) => {
      e.preventDefault();

      // Create product object with proper structure
      const productData = {
        id: isEdit ? selectedProduct.id : Date.now(), // Use timestamp as ID for new products
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        originalPrice: null,
        thc: formData.thc,
        cbd: formData.cbd,
        strain: 'Hybrid', // Default value
        rating: isEdit ? selectedProduct.rating : 5.0,
        reviewCount: isEdit ? selectedProduct.reviewCount : 0,
        imageUrl: 'https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=400', // Default image
        description: formData.description || 'Premium cannabis product',
        effects: ['Relaxed', 'Happy'], // Default effects
        labTested: true,
        inStock: parseInt(formData.stock) > 0,
        featured: formData.featured
      };

      if (isEdit) {
        // Update existing product with real-time sync
        broadcastProductUpdated(selectedProduct.id, productData);
        console.log('✅ Product updated with real-time sync:', productData.name);
      } else {
        // Add new product with real-time sync
        broadcastProductAdded(productData);
        console.log('✅ Product added with real-time sync:', productData.name);
      }

      closeModal(isEdit ? 'editProduct' : 'addProduct');
    };

    const handleChange = (field, value) => {
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

    const updateOrderStatus = async (newStatus) => {
      setOrderStatus(newStatus);

      try {
        // Send real-time order status update
        const statusUpdate = {
          orderId: selectedOrder?.id,
          customerId: selectedOrder?.customer,
          status: newStatus,
          timestamp: new Date(),
          message: getStatusMessage(newStatus)
        };

        // Notify customer of status change
        wsService.send({
          type: 'admin:order_status_update',
          data: {
            ...statusUpdate,
            target: 'customer'
          }
        });

        // If order is confirmed or ready, notify available drivers
        if (newStatus === 'confirmed' || newStatus === 'ready') {
          wsService.send({
            type: 'admin:order_available_for_pickup',
            data: {
              ...statusUpdate,
              target: 'drivers',
              orderDetails: {
                id: selectedOrder?.id,
                customer: selectedOrder?.customer,
                location: selectedOrder?.location || 'Austin, TX',
                value: selectedOrder?.total,
                items: selectedOrder?.items,
                priority: selectedOrder?.total > 150 ? 'high' : 'normal',
                estimatedDistance: '2.3 miles',
                pickupLocation: 'Faded Skies Dispensary - 123 Cannabis St'
              }
            }
          });

          console.log('📡 Order sent to available drivers:', selectedOrder?.id);
        }

        // If driver is assigned, notify specific driver
        if (newStatus === 'assigned' && selectedOrder?.assignedDriver) {
          wsService.send({
            type: 'admin:assign_order',
            data: {
              orderId: selectedOrder.id,
              driverId: selectedOrder.assignedDriver,
              orderDetails: statusUpdate
            }
          });
        }

        console.log('✅ Order status updated and notifications sent:', newStatus);

      } catch (error) {
        console.error('Failed to send status update notifications:', error);
      }
    };

    // Helper function to get user-friendly status messages
    const getStatusMessage = (status) => {
      const messages = {
        'pending': 'Order received and pending review',
        'confirmed': 'Order confirmed and being prepared',
        'preparing': 'Your order is being prepared',
        'ready': 'Order ready for pickup - driver will be assigned',
        'assigned': 'Driver assigned to your order',
        'en-route': 'Driver is on the way to deliver your order',
        'delivered': 'Order has been delivered successfully',
        'cancelled': 'Order has been cancelled'
      };
      return messages[status] || `Order status updated to ${status}`;
    };

    return (
      <Modal
        isOpen={modals.orderDetails}
        onClose={() => closeModal('orderDetails')}
        title={`Order Details - ${selectedOrder?.orderId}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Status Update */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-lg font-bold text-blue-800 mb-3">Order Status</h4>
              <div className="flex items-center space-x-3">
                <select
                  value={orderStatus}
                  onChange={(e) => updateOrderStatus(e.target.value)}
                  className="px-4 py-2 border border-blue-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready for Pickup</option>
                  <option value="en-route">En Route</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                  Update Status
                </button>
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Customer Details</span>
                </h4>
                <div className="space-y-2">
                  <p><span className="font-semibold">Name:</span> {selectedOrder?.customerName}</p>
                  <p><span className="font-semibold">Order Date:</span> {selectedOrder?.orderDate}</p>
                  <p><span className="font-semibold">Address:</span> {selectedOrder?.address}</p>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Order Summary</span>
                </h4>
                <div className="space-y-2">
                  <p><span className="font-semibold">Order ID:</span> {selectedOrder?.orderId}</p>
                  <p><span className="font-semibold">Total:</span> ${selectedOrder?.total}</p>
                  <p><span className="font-semibold">Items:</span> {selectedOrder?.items?.length || 0} item(s)</p>
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
                    {selectedOrder?.items?.map((item, index) => (
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
        )}
      </Modal>
    );
  };

  // Customer Details Modal
  const CustomerDetailsModal = () => {
    const [customerData, setCustomerData] = useState({
      name: selectedCustomer?.name || '',
      email: selectedCustomer?.email || '',
      phone: selectedCustomer?.phone || '',
      address: selectedCustomer?.address || '',
      status: selectedCustomer?.status || 'pending'
    });

    const handleSave = () => {
      console.log('Customer data updated:', customerData);
      closeModal('customerDetails');
    };

    return (
      <Modal
        isOpen={modals.customerDetails}
        onClose={() => closeModal('customerDetails')}
        title={`Customer Details - ${selectedCustomer?.name}`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <h4 className="text-lg font-bold text-blue-800">Total Orders</h4>
                <p className="text-2xl font-black text-blue-600">{selectedCustomer?.totalOrders || 0}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <h4 className="text-lg font-bold text-green-800">Total Spent</h4>
                <p className="text-2xl font-black text-green-600">${selectedCustomer?.totalSpent || 0}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                <h4 className="text-lg font-bold text-purple-800">Avg Order</h4>
                <p className="text-2xl font-black text-purple-600">${selectedCustomer?.totalOrders > 0 ? (selectedCustomer.totalSpent / selectedCustomer.totalOrders).toFixed(2) : '0.00'}</p>
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

    const handlePermissionChange = (permission) => {
      setUserData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permission]: !prev.permissions[permission]
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
                    userData.permissions[permission] ? 'bg-emerald-600' : 'bg-gray-300'
                  }`} onClick={() => handlePermissionChange(permission)}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      userData.permissions[permission] ? 'translate-x-7' : 'translate-x-1'
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

  // Create User Modal
  const CreateUserModal = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'CUSTOMER',
      isVerified: true,
      driverData: {
        licenseNumber: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: new Date().getFullYear(),
        vehicleColor: '',
        licensePlate: ''
      }
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const response = await fetch('/api/admin/users/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          console.log('User created successfully');
          closeModal('createUser');
          // Refresh user list here
        } else {
          const error = await response.json();
          console.error('Create user error:', error);
        }
      } catch (error) {
        console.error('Create user error:', error);
      }
    };

    return (
      <Modal
        isOpen={modals.createUser}
        onClose={() => closeModal('createUser')}
        title="Create New User"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="DRIVER">Driver</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isVerified"
                checked={formData.isVerified}
                onChange={(e) => setFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="isVerified" className="text-sm font-medium text-gray-700">
                Verified Account
              </label>
            </div>
          </div>

          {formData.role === 'DRIVER' && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">License Number</label>
                  <input
                    type="text"
                    value={formData.driverData.licenseNumber}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      driverData: { ...prev.driverData, licenseNumber: e.target.value }
                    }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">License Plate</label>
                  <input
                    type="text"
                    value={formData.driverData.licensePlate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      driverData: { ...prev.driverData, licensePlate: e.target.value }
                    }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Make</label>
                  <input
                    type="text"
                    value={formData.driverData.vehicleMake}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      driverData: { ...prev.driverData, vehicleMake: e.target.value }
                    }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Model</label>
                  <input
                    type="text"
                    value={formData.driverData.vehicleModel}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      driverData: { ...prev.driverData, vehicleModel: e.target.value }
                    }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Year</label>
                  <input
                    type="number"
                    value={formData.driverData.vehicleYear}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      driverData: { ...prev.driverData, vehicleYear: parseInt(e.target.value) }
                    }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Color</label>
                  <input
                    type="text"
                    value={formData.driverData.vehicleColor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      driverData: { ...prev.driverData, vehicleColor: e.target.value }
                    }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => closeModal('createUser')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>
    );
  };

  // User Details Modal
  const UserDetailsModal = () => {
    const user = selectedUser;

    if (!user) return null;

    return (
      <Modal
        isOpen={modals.userDetails}
        onClose={() => closeModal('userDetails')}
        title={`User Details - ${user.name || user.user?.name}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* User Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Basic Information</h4>
              <div className="space-y-2">
                <p><span className="font-semibold">Name:</span> {user.name || user.user?.name}</p>
                <p><span className="font-semibold">Email:</span> {user.email || user.user?.email}</p>
                <p><span className="font-semibold">Phone:</span> {user.phone || user.user?.phone || 'N/A'}</p>
                <p><span className="font-semibold">Role:</span> {user.role || user.user?.role}</p>
                <p><span className="font-semibold">Joined:</span> {new Date(user.createdAt || user.user?.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Account Status</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Active:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    (user.isActive ?? user.user?.isActive) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {(user.isActive ?? user.user?.isActive) ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Verified:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    (user.isVerified ?? user.user?.isVerified) ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(user.isVerified ?? user.user?.isVerified) ? 'Yes' : 'No'}
                  </span>
                </div>
                {user.loyaltyPoints !== undefined && (
                  <p><span className="font-semibold">Loyalty Points:</span> {user.loyaltyPoints}</p>
                )}
              </div>
            </div>
          </div>

          {/* Driver Specific Information */}
          {(user.role === 'DRIVER' || user.user?.role === 'DRIVER') && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Driver Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">License:</span> {user.licenseNumber || 'N/A'}</p>
                  <p><span className="font-semibold">Vehicle:</span> {user.vehicleYear} {user.vehicleMake} {user.vehicleModel}</p>
                  <p><span className="font-semibold">Color:</span> {user.vehicleColor}</p>
                  <p><span className="font-semibold">License Plate:</span> {user.licensePlate}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Online:</span> {user.isOnline ? 'Yes' : 'No'}</p>
                  <p><span className="font-semibold">Rating:</span> ⭐ {user.rating || 'N/A'}</p>
                  <p><span className="font-semibold">Total Deliveries:</span> {user.totalDeliveries || 0}</p>
                  <p><span className="font-semibold">Total Earnings:</span> ${user.totalEarnings || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Order History */}
          {user.totalOrders > 0 && (
            <div className="bg-purple-50 rounded-xl p-4">
              <h4 className="text-lg font-bold text-gray-900 mb-3">Order Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{user.totalOrders}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">${user.totalSpent || 0}</p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    ${user.totalOrders > 0 ? ((user.totalSpent || 0) / user.totalOrders).toFixed(2) : '0'}
                  </p>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => closeModal('userDetails')}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                closeModal('userDetails');
                openModal('editUser', user);
              }}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Edit User
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Confirmation Modal
  const ConfirmationModal = () => {
    const handleConfirm = () => {
      if (deleteTarget.type === 'product') {
        // Delete product with real-time sync
        broadcastProductDeleted(deleteTarget.id);
        console.log('✅ Product deleted with real-time sync:', deleteTarget.name);
      } else {
        console.log(`Deleting ${deleteTarget.type}:`, deleteTarget.id);
      }
      closeModal('confirmDelete');
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
          { id: 'orders', icon: ShoppingCart, label: 'Order Management' },
          { id: 'dispatcher', icon: Truck, label: 'Dispatcher' },
          { id: 'tracking', icon: Navigation, label: 'Live GPS Tracking' },
          { id: 'messaging', icon: Mail, label: 'Driver Messages' },
          { id: 'products', icon: Package, label: 'Products' },
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

  const DashboardView = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">Total Orders</h3>
          <p className="text-3xl font-black text-blue-600">{orders.length}</p>
          <p className="text-xs text-blue-600 mt-1">+12% from last week</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Active Drivers</h3>
          <p className="text-3xl font-black text-green-600">{drivers.filter(d => d.online).length}</p>
          <p className="text-xs text-green-600 mt-1">All systems operational</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-2">Revenue</h3>
          <p className="text-3xl font-black text-purple-600">$2,847</p>
          <p className="text-xs text-purple-600 mt-1">Today's earnings</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-orange-800 mb-2">Customers</h3>
          <p className="text-3xl font-black text-orange-600">{customers.length}</p>
          <p className="text-xs text-orange-600 mt-1">Verified users</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-4">
            {orders.slice(0, 3).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-semibold text-gray-900">{order.orderId}</h4>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
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
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Driver Status</h3>
          <div className="space-y-4">
            {drivers.map(driver => (
              <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${driver.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{driver.name}</h4>
                    <p className="text-sm text-gray-600">{driver.currentLocation}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{driver.ordersToday} orders</div>
                  <div className="flex items-center space-x-1 text-sm">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span>{driver.rating}</span>
                  </div>
                </div>
              </div>
            ))}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">THC/CBD</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const OrdersView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
          New Order
        </button>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-blue-600">{order.orderId}</div>
                    <div className="text-sm text-gray-600">{order.orderDate}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-600">{order.address}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${order.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'en-route' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const MessagingView = () => {
    const { adminMessages, drivers, driverLocations, sendAdminMessage } = useCannabisDeliveryStore();
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');

    const onlineDrivers = drivers.filter(d => d.isOnline);
    const driverMessages = adminMessages.filter(msg =>
      selectedDriver ? (msg.from === selectedDriver || msg.to === selectedDriver) : false
    );

    const handleSendMessage = () => {
      if (selectedDriver && newMessage.trim()) {
        sendAdminMessage(selectedDriver, newMessage.trim());
        setNewMessage('');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Communication</h1>
            <p className="text-gray-600 mt-1">Send messages and communicate with drivers in real-time</p>
          </div>
          <div className="text-sm text-gray-600">
            {onlineDrivers.length} drivers online
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver List */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Online Drivers</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {onlineDrivers.map(driver => {
                const location = driverLocations[driver.id];
                const unreadCount = adminMessages.filter(msg =>
                  msg.from === driver.id.toString() && !msg.read
                ).length;

                return (
                  <div
                    key={driver.id}
                    onClick={() => setSelectedDriver(driver.id.toString())}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedDriver === driver.id.toString() ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                          <p className="text-sm text-gray-600">
                            {location ?
                              `Last seen: ${new Date(location.timestamp).toLocaleTimeString()}` :
                              'Location unknown'
                            }
                          </p>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100">
            {selectedDriver ? (
              <>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {drivers.find(d => d.id.toString() === selectedDriver)?.name}
                      </h2>
                      <p className="text-sm text-green-600">Online</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="h-64 overflow-y-auto p-4 space-y-3">
                  {driverMessages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.type === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {driverMessages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No messages yet. Start a conversation!</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Select a driver to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DispatcherView = () => {
    const { orders, drivers, processOrder, assignDriver, driverLocations } = useCannabisDeliveryStore();
    const [selectedOrderStatus, setSelectedOrderStatus] = useState('pending');
    const [autoAssign, setAutoAssign] = useState(false);

    const pendingOrders = orders.filter(o => ['pending', 'confirmed'].includes(o.status));
    const availableDrivers = drivers.filter(d => d.isOnline && !d.currentOrderId);

    const handleProcessOrder = (orderId: string, newStatus: string) => {
      processOrder(orderId, newStatus);

      if (newStatus === 'confirmed' && autoAssign && availableDrivers.length > 0) {
        // Auto-assign to closest available driver
        const randomDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
        setTimeout(() => assignDriver(orderId, randomDriver.id.toString()), 500);
      }
    };

    const handleManualAssign = (orderId: string, driverId: string) => {
      assignDriver(orderId, driverId);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Dispatcher</h1>
            <p className="text-gray-600 mt-1">Process orders and assign drivers for delivery</p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoAssign}
                onChange={(e) => setAutoAssign(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Auto-assign drivers</span>
            </label>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{availableDrivers.length} drivers available</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Orders Queue */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Order Queue</h2>
              <p className="text-gray-600 text-sm">{pendingOrders.length} orders waiting for processing</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {pendingOrders.map(order => (
                <div key={order.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">#{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${order.total}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleProcessOrder(order.id, 'confirmed')}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Confirm Order
                      </button>
                    )}

                    {order.status === 'confirmed' && (
                      <select
                        onChange={(e) => e.target.value && handleManualAssign(order.id, e.target.value)}
                        defaultValue=""
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Assign Driver...</option>
                        {availableDrivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} - {driver.vehicle?.make} {driver.vehicle?.model}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={() => openModal('orderDetails', order)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}

              {pendingOrders.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No pending orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Drivers */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Available Drivers</h2>
              <p className="text-gray-600 text-sm">{availableDrivers.length} drivers online and ready</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {availableDrivers.map(driver => {
                const location = driverLocations[driver.id];
                return (
                  <div key={driver.id} className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                          <p className="text-sm text-gray-600">
                            {driver.vehicle?.make} {driver.vehicle?.model} • {driver.vehicle?.licensePlate}
                          </p>
                          {location && (
                            <p className="text-xs text-green-600">
                              Last update: {new Date(location.timestamp).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600">Online</span>
                        </div>
                        <p className="text-sm text-gray-600">Rating: ⭐ {driver.rating || 5.0}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {availableDrivers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Truck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No drivers available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TrackingView = () => {
    const { driverLocations, drivers, geofences, activeRoutes, createGeofence, updateDriverLocation } = useCannabisDeliveryStore();
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
    const [newGeofence, setNewGeofence] = useState({ name: '', lat: '', lng: '', radius: '100' });
    const [showGeofenceForm, setShowGeofenceForm] = useState(false);

    const onlineDrivers = drivers.filter(d => d.isOnline);
    const activeDeliveryCount = Object.keys(activeRoutes).length;

    const handleCreateGeofence = () => {
      if (newGeofence.name && newGeofence.lat && newGeofence.lng) {
        createGeofence(newGeofence.name, {
          lat: parseFloat(newGeofence.lat),
          lng: parseFloat(newGeofence.lng),
          radius: parseInt(newGeofence.radius)
        });
        setNewGeofence({ name: '', lat: '', lng: '', radius: '100' });
        setShowGeofenceForm(false);
      }
    };

    // Simulate driver location updates
    useEffect(() => {
      if (!isTrackingLive) return;

      const interval = setInterval(() => {
        onlineDrivers.forEach(driver => {
          const currentLocation = driverLocations[driver.id] || { lat: 30.2672, lng: -97.7431 };
          const newLocation = {
            lat: currentLocation.lat + (Math.random() - 0.5) * 0.001,
            lng: currentLocation.lng + (Math.random() - 0.5) * 0.001
          };
          updateDriverLocation(driver.id.toString(), newLocation);
        });
      }, 5000);

      return () => clearInterval(interval);
    }, [isTrackingLive, onlineDrivers.length]);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live GPS Tracking & Geofencing</h1>
            <p className="text-gray-600 mt-1">Real-time driver tracking with geofencing alerts</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowGeofenceForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Add Geofence</span>
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
              <span>{isTrackingLive ? 'Stop Tracking' : 'Start Live Tracking'}</span>
            </button>
          </div>
        </div>

        {/* GPS Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-blue-800">Active Routes</h3>
                <p className="text-3xl font-black text-blue-600">{activeDeliveryCount}</p>
              </div>
              <Route className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-green-800">Drivers Online</h3>
                <p className="text-3xl font-black text-green-600">{onlineDrivers.length}</p>
              </div>
              <Navigation className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-purple-800">Geofences</h3>
                <p className="text-3xl font-black text-purple-600">{geofences.filter(g => g.active).length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-orange-800">Tracking Status</h3>
                <p className="text-lg font-bold text-orange-600">
                  {isTrackingLive ? 'LIVE' : 'OFFLINE'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Map */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Live Map View</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isTrackingLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isTrackingLive ? 'Live Updates' : 'Static View'}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative h-96 bg-gradient-to-br from-green-100 via-blue-50 to-gray-100">
              <div className="w-full h-full relative overflow-hidden rounded-b-2xl">
                {/* Map Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Globe className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700">Austin, TX Delivery Zone</p>
                    <p className="text-sm text-gray-500">
                      {onlineDrivers.length} drivers • {geofences.length} geofences active
                    </p>
                  </div>
                </div>

                {/* Driver Markers */}
                {onlineDrivers.map((driver, index) => {
                  const location = driverLocations[driver.id];
                  if (!location) return null;

                  const x = 20 + (index * 15) % 60;
                  const y = 20 + (index * 20) % 60;

                  return (
                    <div
                      key={driver.id}
                      className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer transition-all ${
                        selectedDriver === driver.id.toString() ? 'bg-red-500 scale-125' : 'bg-blue-500'
                      } ${isTrackingLive ? 'animate-pulse' : ''}`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onClick={() => setSelectedDriver(driver.id.toString())}
                      title={`${driver.name} - Last update: ${new Date(location.timestamp).toLocaleTimeString()}`}
                    >
                      <Truck className="w-3 h-3 text-white m-0.5" />
                    </div>
                  );
                })}

                {/* Geofence Areas */}
                {geofences.map((geofence, index) => (
                  <div
                    key={geofence.id}
                    className="absolute border-2 border-purple-400 border-dashed rounded-full bg-purple-200 bg-opacity-30"
                    style={{
                      left: `${25 + (index * 20) % 50}%`,
                      top: `${25 + (index * 25) % 50}%`,
                      width: '80px',
                      height: '80px',
                      transform: 'translate(-50%, -50%)'
                    }}
                    title={`${geofence.name} - Radius: ${geofence.radius}m`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Driver List & Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Driver Locations</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {onlineDrivers.map(driver => {
                  const location = driverLocations[driver.id];
                  const route = activeRoutes[Object.keys(activeRoutes).find(key =>
                    activeRoutes[key].driverId === driver.id.toString()
                  )];

                  return (
                    <div
                      key={driver.id}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        selectedDriver === driver.id.toString() ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDriver(driver.id.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{driver.name}</h4>
                          <p className="text-sm text-gray-600">{driver.vehicle?.licensePlate}</p>
                          {location && (
                            <p className="text-xs text-green-600">
                              Updated: {new Date(location.timestamp).toLocaleTimeString()}
                            </p>
                          )}
                          {route && (
                            <p className="text-xs text-blue-600">
                              Status: {route.status} • ETA: {route.eta}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600">Live</span>
                          </div>
                          {location?.speed && (
                            <p className="text-xs text-gray-600">{location.speed} mph</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geofence Management */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Geofences</h3>
              </div>
              <div className="p-4 space-y-3">
                {geofences.map(geofence => (
                  <div key={geofence.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900">{geofence.name}</h4>
                      <p className="text-sm text-gray-600">Radius: {geofence.radius}m</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${geofence.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Geofence Creation Modal */}
        {showGeofenceForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Geofence</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={newGeofence.name}
                    onChange={(e) => setNewGeofence({...newGeofence, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Downtown Zone"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={newGeofence.lat}
                      onChange={(e) => setNewGeofence({...newGeofence, lat: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="30.2672"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={newGeofence.lng}
                      onChange={(e) => setNewGeofence({...newGeofence, lng: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="-97.7431"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Radius (meters)</label>
                  <input
                    type="number"
                    value={newGeofence.radius}
                    onChange={(e) => setNewGeofence({...newGeofence, radius: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
                  <select
                    value={newGeofence.alertType}
                    onChange={(e) => setNewGeofence({...newGeofence, alertType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="both">Entry & Exit</option>
                    <option value="entry">Entry Only</option>
                    <option value="exit">Exit Only</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowGeofenceForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGeofence}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Geofence
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
              <span className="font-bold text-blue-600">{drivers.filter(d => d.online).length}</span>
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
    const [userList, setUserList] = useState([]);
    const [driverList, setDriverList] = useState([]);
    const [userStats, setUserStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState('customers');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
      isVerified: 'all',
      isActive: 'all',
      role: 'all'
    });
    const [pagination, setPagination] = useState({
      page: 1,
      limit: 20,
      totalPages: 1
    });

    // Fetch users data
    const fetchUsers = useCallback(async () => {
      setLoading(true);
      try {
        const endpoint = currentTab === 'customers' ? '/api/admin/users/customers' : '/api/admin/users/drivers';
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(searchTerm && { search: searchTerm }),
          ...(filters.isVerified !== 'all' && { isVerified: filters.isVerified }),
          ...(filters.isActive !== 'all' && { isActive: filters.isActive }),
          ...(filters.role !== 'all' && { role: filters.role })
        });

        const response = await fetch(`${endpoint}?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (currentTab === 'customers') {
            setUserList(data.users || []);
          } else {
            setDriverList(data.drivers || []);
          }
          setPagination(prev => ({
            ...prev,
            totalPages: data.pagination?.totalPages || 1
          }));
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    }, [currentTab, pagination.page, pagination.limit, searchTerm, filters]);

    // Fetch user statistics
    const fetchUserStats = useCallback(async () => {
      try {
        const response = await fetch('/api/admin/users/stats/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      }
    }, []);

    // Load data on component mount and when dependencies change
    useEffect(() => {
      fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
      fetchUserStats();
    }, [fetchUserStats]);

    // Handle user actions
    const handleResetPassword = async (userId: string) => {
      try {
        const newPassword = prompt('Enter new password (min 6 characters):');
        if (!newPassword || newPassword.length < 6) return;

        const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ newPassword, sendNotification: true })
        });

        if (response.ok) {
          showToastMessage('Password reset successfully', 'success');
        } else {
          throw new Error('Failed to reset password');
        }
      } catch (error) {
        console.error('Reset password error:', error);
        showToastMessage('Failed to reset password', 'error');
      }
    };

    const handleUpdateEmail = async (userId: string, currentEmail: string) => {
      try {
        const newEmail = prompt('Enter new email address:', currentEmail);
        if (!newEmail || newEmail === currentEmail) return;

        const response = await fetch(`/api/admin/users/${userId}/update-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ newEmail, sendNotification: true })
        });

        if (response.ok) {
          showToastMessage('Email updated successfully', 'success');
          fetchUsers(); // Refresh the list
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update email');
        }
      } catch (error) {
        console.error('Update email error:', error);
        showToastMessage(error.message || 'Failed to update email', 'error');
      }
    };

    const handleToggleStatus = async (userId: string, isActive: boolean) => {
      try {
        const reason = isActive ? '' : prompt('Reason for deactivation (optional):') || '';

        const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isActive: !isActive, reason })
        });

        if (response.ok) {
          showToastMessage(`User ${!isActive ? 'activated' : 'deactivated'} successfully`, 'success');
          fetchUsers(); // Refresh the list
        } else {
          throw new Error('Failed to toggle user status');
        }
      } catch (error) {
        console.error('Toggle status error:', error);
        showToastMessage('Failed to update user status', 'error');
      }
    };

    const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      // You can implement your toast notification here
      console.log(`${type.toUpperCase()}: ${message}`);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage customers, drivers, and admin users</p>
          </div>
          <button
            onClick={() => openModal('createUser')}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>

        {/* User Statistics Dashboard */}
        {userStats.overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-blue-800">Total Users</h3>
              <p className="text-3xl font-black text-blue-600">{userStats.overview.totalUsers}</p>
              <p className="text-xs text-blue-600 mt-1">{userStats.overview.recentSignups} new this week</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-800">Customers</h3>
              <p className="text-3xl font-black text-green-600">{userStats.overview.totalCustomers}</p>
              <p className="text-xs text-green-600 mt-1">{userStats.verificationRate}% verified</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-purple-800">Drivers</h3>
              <p className="text-3xl font-black text-purple-600">{userStats.overview.totalDrivers}</p>
              <p className="text-xs text-purple-600 mt-1">{userStats.overview.onlineDrivers} online now</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-orange-800">Active Rate</h3>
              <p className="text-3xl font-black text-orange-600">{userStats.activeRate}%</p>
              <p className="text-xs text-orange-600 mt-1">of all users</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'drivers', label: 'Drivers', icon: Truck },
                { id: 'admins', label: 'Admins', icon: Shield }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                    currentTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Filters and Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64"
                  />
                </div>
                <select
                  value={filters.isVerified}
                  onChange={(e) => setFilters(prev => ({ ...prev, isVerified: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Verification</option>
                  <option value="true">Verified Only</option>
                  <option value="false">Unverified Only</option>
                </select>
                <select
                  value={filters.isActive}
                  onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      {currentTab === 'customers' ? 'Orders' : currentTab === 'drivers' ? 'Deliveries' : 'Role'}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(currentTab === 'customers' ? userList : driverList).map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{user.name || user.user?.name}</h4>
                            <p className="text-sm text-gray-600">{user.email || user.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          <div>{user.phone || user.user?.phone || 'N/A'}</div>
                          <div className="text-xs text-gray-500">
                            {user.address || user.user?.address || 'No address'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {currentTab === 'customers'
                          ? `${user.totalOrders || 0} orders`
                          : currentTab === 'drivers'
                          ? `${user.completedOrders || 0} deliveries`
                          : user.role || 'Admin'
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            (user.isActive ?? user.user?.isActive)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {(user.isActive ?? user.user?.isActive) ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            (user.isVerified ?? user.user?.isVerified)
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {(user.isVerified ?? user.user?.isVerified) ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt || user.user?.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openModal('userDetails', user)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal('editUser', user)}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id || user.user?.id)}
                            className="text-orange-600 hover:text-orange-700 p-1"
                            title="Reset Password"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateEmail(user.id || user.user?.id, user.email || user.user?.email)}
                            className="text-purple-600 hover:text-purple-700 p-1"
                            title="Update Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id || user.user?.id, user.isActive ?? user.user?.isActive)}
                            className={`p-1 ${
                              (user.isActive ?? user.user?.isActive)
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-green-600 hover:text-green-700'
                            }`}
                            title={`${(user.isActive ?? user.user?.isActive) ? 'Deactivate' : 'Activate'} User`}
                          >
                            {(user.isActive ?? user.user?.isActive) ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'orders': return <OrdersView />;
      case 'dispatcher': return <DispatcherView />;
      case 'tracking': return <TrackingView />;
      case 'messaging': return <MessagingView />;
      case 'products': return <ProductsView />;
      case 'customers': return <CustomersView />;
      case 'analytics': return <AnalyticsView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

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
      <UserManagementModal />
      <ConfirmationModal />
    </div>
  );
};

export default FadedSkiesTrackingAdmin;
