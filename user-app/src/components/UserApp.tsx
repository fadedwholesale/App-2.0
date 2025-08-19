import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  User,
  Search,
  Plus,
  Minus,
  X,
  Eye,
  EyeOff,
  Home,
  Package,
  Clock,
  LogOut
} from 'lucide-react';

// Import real-time service for live updates
import realTimeService, { Order, Product } from '../services/real-time-service';
import { supabase } from '../lib/supabase';

interface CartItem {
  product: Product;
  quantity: number;
}

interface User {
  id?: string;
  name: string;
  email: string;
  address: string;
  phone: string;
}

const UserApp: React.FC = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<'auth' | 'home' | 'products' | 'cart' | 'orders' | 'profile'>('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: ''
  });

  // Data state
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [showToastState, setShowToastState] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToastState(true);
    setTimeout(() => setShowToastState(false), 3000);
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load products
        const productsData = await realTimeService.getProducts();
        setProducts(productsData);
        
        // Load user orders if authenticated
        if (user?.id) {
          const ordersData = await realTimeService.getOrders(user.id);
          setOrders(ordersData);
        }
        
        // Connect to real-time service
        if (user?.id) {
          realTimeService.connect(user.id);
        }
        
        // Set up real-time listeners
        realTimeService.onOrderUpdate((order) => {
          setOrders(prev => prev.map(o => o.id === order.id ? order : o));
        });
        
        realTimeService.onOrderAssigned((order) => {
          setOrders(prev => prev.map(o => o.id === order.id ? order : o));
          showToast(`Order ${order.order_id} assigned to driver!`, 'success');
        });
        
        realTimeService.onOrderDelivered((order) => {
          setOrders(prev => prev.map(o => o.id === order.id ? order : o));
          showToast(`Order ${order.order_id} delivered!`, 'success');
        });
        
      } catch (error) {
        console.error('Failed to load data:', error);
        showToast('Failed to load data. Please refresh.', 'error');
      } finally {
        setLoading(false);
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
  }, [isAuthenticated, user?.id]);

  // Authentication functions
  const handleSignUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: {
          data: {
            name: authForm.name,
            phone: authForm.phone,
            address: authForm.address
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          name: authForm.name,
          email: authForm.email,
          phone: authForm.phone,
          address: authForm.address
        };
        
        setUser(newUser);
        setIsAuthenticated(true);
        setCurrentView('home');
        showToast('Account created successfully!', 'success');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      showToast('Registration failed. Please try again.', 'error');
    }
  };

  const handleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password
      });

      if (error) throw error;

      if (data.user) {
        const userData: User = {
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          email: data.user.email || '',
          phone: data.user.user_metadata?.phone || '',
          address: data.user.user_metadata?.address || ''
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        setCurrentView('home');
        showToast('Welcome back!', 'success');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      showToast('Login failed. Please check your credentials.', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setCurrentView('auth');
      setCart([]);
      setOrders([]);
      showToast('Signed out successfully', 'info');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Cart functions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`${product.name} added to cart`, 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  // Order functions
  const createOrder = async () => {
    if (!user || cart.length === 0) return;

    try {
      const orderData = {
        user_id: user.id!,
        customer_name: user.name,
        customer_phone: user.phone,
        address: user.address,
        items: cart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        total: getCartTotal()
      };

      const newOrder = await realTimeService.createOrder(orderData);
      setOrders(prev => [newOrder, ...prev]);
      setCart([]);
      setCurrentView('orders');
      showToast('Order placed successfully!', 'success');
    } catch (error) {
      console.error('Failed to create order:', error);
      showToast('Failed to place order. Please try again.', 'error');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Faded Skies</h1>
            <p className="text-gray-600">Premium Cannabis Delivery</p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <input
              type="text"
              placeholder="Full Name"
              value={authForm.name}
              onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={authForm.phone}
              onChange={(e) => setAuthForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="text"
              placeholder="Delivery Address"
              value={authForm.address}
              onChange={(e) => setAuthForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <button
              onClick={handleSignUp}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Create Account
            </button>

            <button
              onClick={handleSignIn}
              className="w-full bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main app layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Faded Skies</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('cart')}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setCurrentView('profile')}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <User size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('home')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'home'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Home size={20} className="inline mr-2" />
              Home
            </button>
            
            <button
              onClick={() => setCurrentView('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'products'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package size={20} className="inline mr-2" />
              Products
            </button>
            
            <button
              onClick={() => setCurrentView('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'orders'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock size={20} className="inline mr-2" />
              Orders
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">Welcome back, {user?.name}!</h2>
              <p className="text-green-100 mb-6">Premium cannabis delivered to your door in under 2 hours.</p>
              <button
                onClick={() => setCurrentView('products')}
                className="bg-white text-green-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Browse Products
              </button>
            </div>

            {orders.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Recent Orders</h3>
                <div className="grid gap-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">Order #{order.order_id}</h4>
                          <p className="text-gray-600">{order.customer_name}</p>
                          <p className="text-sm text-gray-500">{order.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.total}</p>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                <option value="Flower">Flower</option>
                <option value="Edibles">Edibles</option>
                <option value="Vape">Vape</option>
                <option value="Tincture">Tincture</option>
                <option value="Pre-Rolls">Pre-Rolls</option>
                <option value="Topicals">Topicals</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <Package size={48} className="text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-bold text-green-600">${product.price}</span>
                      <span className="text-xs text-gray-500">THC: {product.thc}</span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'cart' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Shopping Cart</h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Your cart is empty</p>
                <button
                  onClick={() => setCurrentView('products')}
                  className="mt-4 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.product.name}</h3>
                        <p className="text-gray-600">{item.product.category}</p>
                        <p className="text-green-600 font-semibold">${item.product.price}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-green-600">${getCartTotal().toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={createOrder}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Your Orders</h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No orders yet</p>
                <button
                  onClick={() => setCurrentView('products')}
                  className="mt-4 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">Order #{order.order_id}</h3>
                        <p className="text-gray-600">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">${order.total}</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Items:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name}</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Profile</h2>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{user?.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">{user?.phone}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{user?.address}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  <LogOut size={20} className="inline mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast notification */}
      {showToastState && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl text-white font-medium z-50 ${
          toastType === 'success' ? 'bg-green-600' :
          toastType === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default UserApp;
