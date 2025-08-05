import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  User, 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  CreditCard, 
  Bell, 
  MessageCircle, 
  Truck, 
  Plus, 
  Minus, 
  Filter, 
  Menu, 
  X, 
  Camera, 
  Upload, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle,
  Edit3
} from 'lucide-react';

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
}

interface User {
  name: string;
  email: string;
  address: string;
  rewards: number;
  age: number;
  idVerified: boolean;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created: string;
  updated: string;
  category: string;
}

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
  const [currentView, setCurrentView] = useState<string>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [idVerified, setIdVerified] = useState<boolean>(false);
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
    name: 'Alex Chen',
    email: 'alex@example.com',
    address: '123 Main St, Austin, TX',
    rewards: 1250,
    age: 25,
    idVerified: false
  });
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '#FS2025001',
      status: 'delivered',
      items: ['Purple Haze Live Resin Cart', 'Midnight Mint Indica Gummies'],
      total: 89.50,
      date: '2025-06-10',
      estimatedDelivery: '2-4 hours',
      deliveredAt: '3:10 PM',
      driver: 'Marcus Chen',
      vehicle: 'Blue Toyota Prius - ABC789'
    },
    {
      id: '#FS2025002',
      status: 'in-transit',
      items: ['OG Kush Premium Flower', 'Sunset Sherbet Pre-roll 3-Pack'],
      total: 124.75,
      date: '2025-06-12',
      estimatedDelivery: '1-2 hours',
      driver: 'Alex Rodriguez',
      vehicle: 'Green Honda Civic - XYZ123',
      currentLocation: '0.8 miles away'
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const categories = [
    { id: 'all', name: 'All Products', icon: '🌿', gradient: 'from-green-400 to-emerald-500' },
    { id: 'flower', name: 'Flower', icon: '🌸', gradient: 'from-pink-400 to-rose-500' },
    { id: 'vapes', name: 'Vapes', icon: '💨', gradient: 'from-blue-400 to-cyan-500' },
    { id: 'prerolls', name: 'Pre-rolls', icon: '🚬', gradient: 'from-orange-400 to-amber-500' },
    { id: 'edibles', name: 'Edibles', icon: '🍯', gradient: 'from-purple-400 to-violet-500' }
  ];

  // Realistic product system with updateable images
  const products = [
    {
      id: 1,
      name: 'Purple Haze Live Resin Cartridge',
      category: 'vapes',
      price: 65.00,
      originalPrice: 75.00,
      thc: '89.2%',
      cbd: '0.1%',
      strain: 'Sativa',
      rating: 4.8,
      reviewCount: 342,
      imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=400&fit=crop&crop=center',
      description: 'Premium live resin cartridge with authentic Purple Haze terpenes. Smooth, potent, and flavorful.',
      effects: ['Creative', 'Energetic', 'Happy'],
      labTested: true,
      inStock: true,
      featured: true
    },
    {
      id: 2,
      name: 'OG Kush Premium Indoor Flower',
      category: 'flower',
      price: 45.00,
      originalPrice: null,
      thc: '24.3%',
      cbd: '0.2%',
      strain: 'Indica',
      rating: 4.9,
      reviewCount: 567,
      imageUrl: 'https://images.unsplash.com/photo-1536924430914-91f9e2041b83?w=400&h=400&fit=crop&crop=center',
      description: 'Classic OG Kush with dense, frosty buds. Earthy pine aroma with hints of lemon.',
      effects: ['Relaxed', 'Sleepy', 'Euphoric'],
      labTested: true,
      inStock: true,
      featured: false
    },
    {
      id: 3,
      name: 'Sunset Sherbet Pre-roll 3-Pack',
      category: 'prerolls',
      price: 35.00,
      originalPrice: 42.00,
      thc: '21.7%',
      cbd: '0.3%',
      strain: 'Hybrid',
      rating: 4.7,
      reviewCount: 289,
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
      description: 'Three perfectly rolled joints featuring premium Sunset Sherbet flower.',
      effects: ['Relaxed', 'Happy', 'Creative'],
      labTested: true,
      inStock: true,
      featured: true
    },
    {
      id: 4,
      name: 'Midnight Mint Indica Gummies',
      category: 'edibles',
      price: 28.00,
      originalPrice: null,
      thc: '10mg each',
      cbd: '2mg each',
      strain: 'Indica',
      rating: 4.6,
      reviewCount: 445,
      imageUrl: 'https://images.unsplash.com/photo-1582048184309-a42b64c7e2c9?w=400&h=400&fit=crop&crop=center',
      description: 'Delicious mint-flavored gummies perfect for evening relaxation. 20-pack.',
      effects: ['Sleepy', 'Relaxed', 'Pain Relief'],
      labTested: true,
      inStock: true,
      featured: false
    },
    {
      id: 5,
      name: 'Blue Dream Premium Flower',
      category: 'flower',
      price: 42.00,
      originalPrice: null,
      thc: '22.1%',
      cbd: '0.1%',
      strain: 'Hybrid',
      rating: 4.8,
      reviewCount: 623,
      imageUrl: 'https://images.unsplash.com/photo-1583031994962-6bfde2c5d72a?w=400&h=400&fit=crop&crop=center',
      description: 'Perfectly balanced hybrid with sweet berry notes and cerebral effects.',
      effects: ['Happy', 'Creative', 'Relaxed'],
      labTested: true,
      inStock: true,
      featured: false
    },
    {
      id: 6,
      name: 'Strawberry Cough Live Rosin Cart',
      category: 'vapes',
      price: 78.00,
      originalPrice: 85.00,
      thc: '87.5%',
      cbd: '0.2%',
      strain: 'Sativa',
      rating: 4.5,
      reviewCount: 198,
      imageUrl: 'https://images.unsplash.com/photo-1591424337553-93a4f46e4dd9?w=400&h=400&fit=crop&crop=center',
      description: 'Premium live rosin cartridge with authentic strawberry and earth flavors.',
      effects: ['Energetic', 'Creative', 'Focused'],
      labTested: true,
      inStock: false,
      featured: false
    }
  ];

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

  const handleAuthSubmit = useCallback(() => {
    if (authMode === 'login') {
      if (authForm.email && authForm.email.trim() && authForm.password && authForm.password.trim()) {
        setIsAuthenticated(true);
        setCurrentView('home');
        setUser(prev => ({ ...prev, email: authForm.email, name: authForm.name || 'Demo User' }));
      } else {
        alert('Please enter email and password');
      }
    } else if (authMode === 'signup') {
      if (!authForm.name || !authForm.dateOfBirth || !authForm.phone || !authForm.email || !authForm.password) {
        alert('Please fill in all required fields');
        return;
      }
      
      if (authForm.password !== authForm.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      const birthDate = new Date(authForm.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 21) {
        alert('You must be 21 or older to use this service');
        return;
      }
      
      setIsAuthenticated(true);
      setUser(prev => ({ 
        ...prev, 
        name: authForm.name, 
        email: authForm.email,
        age: age
      }));
      setCurrentView('home');
    } else if (authMode === 'forgot') {
      if (authForm.email && authForm.email.trim()) {
        alert('Password reset link sent to your email!');
        setAuthMode('login');
      } else {
        alert('Please enter your email address');
      }
    }
  }, [authMode, authForm]);

  const quickLogin = useCallback(() => {
    setAuthForm({
      email: 'demo@fadedskies.com',
      password: 'demo123',
      confirmPassword: '',
      name: 'Demo User',
      phone: '',
      dateOfBirth: ''
    });
    setIsAuthenticated(true);
    setCurrentView('home');
    setUser(prev => ({ ...prev, email: 'demo@fadedskies.com', name: 'Demo User' }));
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setIdVerified(false);
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
    setIdVerified(true);
    setUser(prev => ({ ...prev, idVerified: true }));
    setCurrentView('cart');
  }, []);

  const proceedToCheckout = useCallback(() => {
    if (!user.idVerified) {
      setCurrentView('id-verification');
    } else {
      alert('Order placed successfully!');
      
      const newOrder: Order = {
        id: `#FS2025${String(orders.length + 3).padStart(3, '0')}`,
        status: 'in-transit',
        items: cart.map(item => item.name),
        total: cartTotal + (cartTotal >= 100 ? 0 : 5),
        date: new Date().toISOString().split('T')[0],
        estimatedDelivery: '1-2 hours',
        driver: 'Sarah Johnson',
        vehicle: 'White Tesla Model 3 - DEF456',
        currentLocation: '1.2 miles away'
      };
      
      setOrders(prev => [newOrder, ...prev]);
      setCart([]);
      setCurrentView('orders');
    }
  }, [user.idVerified, orders.length, cart, cartTotal]);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      <Toast showToast={showToast} toastMessage={toastMessage} />
      
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
              <div className="mt-6 space-y-3">
                <div className="text-xs text-gray-500 text-center bg-gray-50 p-4 rounded-xl">
                  <strong>Demo Mode:</strong> Enter any email and password to continue
                </div>
                <button
                  type="button"
                  onClick={quickLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  Quick Demo Login
                </button>
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
                        {user.idVerified ? 'Place Order' : '��� Verify Age & Place Order'}
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
                        Verify ID (Demo)
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
                <h1 className="text-3xl font-bold mb-2">Your Orders</h1>
                <p className="text-green-100 text-lg">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
              </div>

              <div className="p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <Truck className="w-16 h-16 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No orders yet</h3>
                    <p className="text-gray-600 mb-8 text-lg">Start shopping to see your orders here</p>
                    <button
                      type="button"
                      onClick={() => setCurrentView('home')}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      🌿 Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map(order => (
                      <div key={order.id} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-xl text-gray-900 mb-1">{order.id}</h3>
                            <p className="text-gray-600 font-medium">{order.date}</p>
                          </div>
                          <div className="text-right">
                            <div className={`px-4 py-2 rounded-full text-sm font-bold mb-2 ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'in-transit'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'preparing'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status === 'delivered' && '✅ Delivered'}
                              {order.status === 'in-transit' && '🚚 In Transit'}
                              {order.status === 'preparing' && '📦 Preparing'}
                              {order.status === 'cancelled' && '❌ Cancelled'}
                            </div>
                            <p className="font-black text-xl text-gray-900">${order.total.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Items:</h4>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <p key={index} className="text-gray-600 text-sm">• {item}</p>
                            ))}
                          </div>
                        </div>

                        {order.status === 'in-transit' && order.currentLocation && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4 border border-blue-100">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                              <div>
                                <p className="font-semibold text-blue-900">Driver is {order.currentLocation}</p>
                                <p className="text-blue-700 text-sm">ETA: {order.estimatedDelivery}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">Driver:</span>
                            <span className="font-semibold text-gray-900">{order.driver}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">Vehicle:</span>
                            <span className="font-semibold text-gray-900">{order.vehicle}</span>
                          </div>
                          {order.deliveredAt && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-700">Delivered:</span>
                              <span className="font-semibold text-green-600">{order.deliveredAt}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-3 mt-4">
                          <button
                            type="button"
                            onClick={() => alert('Reorder functionality would be implemented here')}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all"
                          >
                            Reorder
                          </button>
                          <button
                            type="button"
                            onClick={() => alert('Order details would be shown here')}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'profile' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-b-3xl shadow-xl">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-green-100 text-lg font-medium">{user.email}</p>
                    {user.idVerified && (
                      <div className="flex items-center space-x-1 text-sm bg-green-700/80 backdrop-blur-sm px-3 py-1 rounded-full mt-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold">Verified Member</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-3xl p-6 border border-emerald-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl text-gray-900">FS Rewards</h3>
                    <span className="font-black text-3xl text-emerald-600">{user.rewards}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl mb-1">🪙</div>
                      <p className="text-sm font-semibold text-gray-600">Total Coins</p>
                      <p className="font-bold text-lg text-gray-900">{user.rewards}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl mb-1">📦</div>
                      <p className="text-sm font-semibold text-gray-600">Orders</p>
                      <p className="font-bold text-lg text-gray-900">{orders.length}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Rewards program details would be shown here')}
                    className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all"
                  >
                    View Rewards Program
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Account Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Full Name</span>
                      <span className="font-semibold text-gray-900">{user.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Email</span>
                      <span className="font-semibold text-gray-900">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Address</span>
                      <span className="font-semibold text-gray-900">{user.address}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Age</span>
                      <span className="font-semibold text-gray-900">{user.age} years old</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="font-medium text-gray-700">ID Verification</span>
                      <span className={`font-semibold ${user.idVerified ? 'text-green-600' : 'text-amber-600'}`}>
                        {user.idVerified ? '✅ Verified' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert('Edit profile functionality would be implemented here')}
                    className="w-full mt-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Push Notifications', icon: Bell, enabled: true },
                      { label: 'Email Updates', icon: Bell, enabled: false },
                      { label: 'SMS Alerts', icon: MessageCircle, enabled: true },
                      { label: 'Marketing Communications', icon: Bell, enabled: false }
                    ].map((pref, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <pref.icon className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-700">{pref.label}</span>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${
                          pref.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            pref.enabled ? 'translate-x-7' : 'translate-x-1'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Security & Privacy</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Change Password', icon: Shield },
                      { label: 'Two-Factor Authentication', icon: Shield },
                      { label: 'Privacy Settings', icon: Shield },
                      { label: 'Data & Privacy', icon: Shield }
                    ].map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => alert(`${item.label} would be implemented here`)}
                        className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-700">{item.label}</span>
                        </div>
                        <span className="text-gray-400">→</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Sign Out</span>
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
    </div>
  );
};

export default FadedSkiesApp;
