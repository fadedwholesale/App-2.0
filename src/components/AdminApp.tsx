import React, { useState, useEffect, useCallback } from 'react';
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
  Activity
} from 'lucide-react';

const FadedSkiesTrackingAdmin = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isTrackingLive, setIsTrackingLive] = useState(false);

  // Sample data
  const [products] = useState([
    {
      id: 1,
      name: 'Premium Cannabis Flower - Blue Dream',
      category: 'Flower',
      price: 45.00,
      stock: 150,
      thc: '18%',
      cbd: '2%',
      status: 'active',
      supplier: 'Green Valley Farms'
    },
    {
      id: 2,
      name: 'Artisan Edibles - Gummy Bears 10mg',
      category: 'Edibles',
      price: 25.00,
      stock: 85,
      thc: '10mg per piece',
      cbd: '0mg',
      status: 'active',
      supplier: 'Sweet Relief Co.'
    }
  ]);

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
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
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
                      <button className="text-blue-600 hover:text-blue-700 p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-700 p-1">
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
                      <button className="text-blue-600 hover:text-blue-700 p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-700 p-1">
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

  const TrackingView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Live Tracking & Dispatch</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsTrackingLive(!isTrackingLive)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-colors ${
              isTrackingLive 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isTrackingLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isTrackingLive ? 'Stop Tracking' : 'Start Tracking'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-2">Active Deliveries</h3>
          <p className="text-3xl font-black text-blue-600">{activeDeliveries.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-green-800 mb-2">Drivers Online</h3>
          <p className="text-3xl font-black text-green-600">{drivers.filter(d => d.online).length}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-purple-800 mb-2">Avg Delivery Time</h3>
          <p className="text-3xl font-black text-purple-600">15 min</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-orange-800 mb-2">Success Rate</h3>
          <p className="text-3xl font-black text-orange-600">98%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Live Map View</h3>
          </div>
          
          <div className="relative h-96 bg-gradient-to-br from-green-100 via-blue-50 to-gray-100">
            <div className="w-full h-full relative overflow-hidden rounded-b-2xl">
              {/* Simulated map with delivery markers */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700">Live Map Integration</p>
                  <p className="text-sm text-gray-500">Showing {activeDeliveries.length} active deliveries</p>
                </div>
              </div>
              
              {/* Sample markers */}
              <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow-lg"></div>
              <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-orange-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Active Deliveries</h3>
            </div>
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {activeDeliveries.map(delivery => (
                <div key={delivery.orderId} className={`rounded-xl p-4 border-2 ${
                  delivery.priority === 'high' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-blue-600">{delivery.orderId}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      delivery.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {delivery.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">{delivery.customer}</p>
                    <p className="text-sm text-gray-600">{delivery.address}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ETA: {delivery.estimatedTime}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${delivery.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{delivery.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

  const CustomersView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Orders</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Spent</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                      <p className="text-sm text-gray-600">{customer.address}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">
                      <div>{customer.email}</div>
                      <div>{customer.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{customer.totalOrders}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${customer.totalSpent}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-700 p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-700 p-1">
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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'products': return <ProductsView />;
      case 'orders': return <OrdersView />;
      case 'tracking': return <TrackingView />;
      case 'customers': return <CustomersView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default FadedSkiesTrackingAdmin;
