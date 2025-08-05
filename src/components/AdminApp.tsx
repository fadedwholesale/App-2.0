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
  Save
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
        return (
          <div className="text-center py-16">
            <BarChart3 className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
            <p className="text-gray-600">Advanced analytics and reporting coming soon</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-16">
            <Settings className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">System Settings</h2>
            <p className="text-gray-600">Configuration options coming soon</p>
          </div>
        );
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
