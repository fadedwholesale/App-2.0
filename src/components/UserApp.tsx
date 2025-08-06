import React, { useState, useEffect, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  strain?: string;
  thc?: string;
  cbd?: string;
}

interface Order {
  id: string;
  status: string;
  items: string[];
  itemDetails?: OrderItem[];
  total: number;
  subtotal?: number;
  tax?: number;
  deliveryFee?: number;
  date: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  driver: string;
  vehicle: string;
  currentLocation?: string;
  driverPhone?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
  orderNotes?: string;
  trackingSteps?: Array<{
    step: string;
    time: string;
    completed: boolean;
  }>;
  driverLocation?: {
    lat: number;
    lng: number;
    lastUpdated: Date;
  };
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

// Base Modal component
const Modal = React.memo(({ isOpen, onClose, children, title }: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        </div>

        <div className="relative inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-w-md w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});

// Edit Profile Modal Component
const EditProfileModal = React.memo(({
  isOpen,
  onClose,
  user,
  onUpdate
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updates: Partial<User>) => void;
}) => {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    address: user.address
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: user.name,
        email: user.email,
        address: user.address
      });
      setErrors({});
    }
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onUpdate(form);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
              errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
              errors.address ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
            }`}
            placeholder="Enter your delivery address"
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            Update Profile
          </button>
        </div>
      </div>
    </Modal>
  );
});

// Rewards Program Modal Component
const RewardsModal = React.memo(({
  isOpen,
  onClose,
  user
}: {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}) => {
  const rewards = [
    { tier: 'Bronze', min: 0, max: 499, perks: ['5% back on all orders', 'Member pricing'], color: 'from-orange-400 to-amber-500' },
    { tier: 'Silver', min: 500, max: 1499, perks: ['7% back on all orders', 'Free delivery over $75', 'Birthday bonus'], color: 'from-gray-300 to-gray-400' },
    { tier: 'Gold', min: 1500, max: 2999, perks: ['10% back on all orders', 'Free delivery over $50', 'Early access to new products'], color: 'from-yellow-400 to-yellow-500' },
    { tier: 'Platinum', min: 3000, max: Infinity, perks: ['15% back on all orders', 'Free delivery on all orders', 'Exclusive products', 'Personal concierge'], color: 'from-purple-400 to-purple-500' }
  ];

  const currentTier = rewards.find(tier => user.rewards >= tier.min && user.rewards <= tier.max) || rewards[0];
  const nextTier = rewards.find(tier => user.rewards < tier.min);
  const progressToNext = nextTier ? ((user.rewards - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="FS Rewards Program">
      <div className="space-y-6">
        {/* Current Status */}
        <div className={`bg-gradient-to-r ${currentTier.color} rounded-2xl p-6 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">{currentTier.tier} Member</h3>
            <div className="text-right">
              <div className="text-3xl font-black">{user.rewards}</div>
              <div className="text-sm opacity-90">FS Coins</div>
            </div>
          </div>
          {nextTier && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {nextTier.tier}</span>
                <span>{nextTier.min - user.rewards} coins needed</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${Math.min(progressToNext, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Current Tier Benefits */}
        <div>
          <h4 className="font-bold text-lg text-gray-900 mb-3">Your Current Benefits</h4>
          <div className="space-y-2">
            {currentTier.perks.map((perk, index) => (
              <div key={index} className="flex items-center space-x-3 bg-green-50 p-3 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All Tiers */}
        <div>
          <h4 className="font-bold text-lg text-gray-900 mb-3">All Tiers</h4>
          <div className="space-y-3">
            {rewards.map((tier, index) => (
              <div key={tier.tier} className={`border-2 rounded-2xl p-4 ${
                tier.tier === currentTier.tier
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`font-bold text-lg ${
                    tier.tier === currentTier.tier ? 'text-emerald-800' : 'text-gray-900'
                  }`}>{tier.tier}</h5>
                  <span className="text-sm font-medium text-gray-600">
                    {tier.min === 0 ? '0' : tier.min.toLocaleString()}{tier.max === Infinity ? '+' : ` - ${tier.max.toLocaleString()}`} coins
                  </span>
                </div>
                <div className="space-y-1">
                  {tier.perks.map((perk, perkIndex) => (
                    <div key={perkIndex} className="text-sm text-gray-600 flex items-center space-x-2">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Earn */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <h4 className="font-bold text-lg text-blue-900 mb-3">How to Earn FS Coins</h4>
          <div className="space-y-2">
            {[
              { action: 'Make a purchase', coins: '$1 spent = 1 coin' },
              { action: 'Refer a friend', coins: '500 coins' },
              { action: 'Write a review', coins: '50 coins' },
              { action: 'Birthday bonus', coins: '200 coins' },
              { action: 'Social media follow', coins: '25 coins' }
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-blue-800 font-medium">{item.action}</span>
                <span className="text-blue-600 font-bold text-sm">{item.coins}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
        >
          Got it!
        </button>
      </div>
    </Modal>
  );
});

// Change Password Modal Component
const ChangePasswordModal = React.memo(({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!form.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (form.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSuccess('Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={(e) => setForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                errors.currentPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
              }`}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={form.newPassword}
              onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                errors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
              }`}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
              }`}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Password Requirements:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Include uppercase and lowercase letters</li>
            <li>• Include at least one number</li>
            <li>• Include at least one special character</li>
          </ul>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            Change Password
          </button>
        </div>
      </div>
    </Modal>
  );
});

// Two-Factor Authentication Modal Component
const TwoFactorModal = React.memo(({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) => {
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [verificationCode, setVerificationCode] = useState('');

  const handleEnable = () => {
    if (step === 'setup') {
      setStep('verify');
    } else {
      if (verificationCode.length === 6) {
        setEnabled(true);
        onSuccess('Two-factor authentication enabled successfully!');
        onClose();
      }
    }
  };

  const handleDisable = () => {
    setEnabled(false);
    onSuccess('Two-factor authentication disabled.');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Two-Factor Authentication">
      <div className="space-y-6">
        {!enabled ? (
          step === 'setup' ? (
            <>
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Your Account</h3>
                <p className="text-gray-600">Add an extra layer of security with two-factor authentication</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>• Scan the QR code with your app</li>
                  <li>• Enter the 6-digit code to verify</li>
                  <li>• You'll need this code every time you sign in</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleEnable}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Set Up 2FA
              </button>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="w-40 h-40 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-xs text-gray-500">QR Code would appear here</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Scan QR Code</h3>
                <p className="text-gray-600 mb-4">Open your authenticator app and scan the QR code above</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code from your authenticator app</p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('setup')}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleEnable}
                  disabled={verificationCode.length !== 6}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify & Enable
                </button>
              </div>
            </>
          )
        ) : (
          <>
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">2FA Enabled</h3>
              <p className="text-gray-600">Your account is protected with two-factor authentication</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4">
              <h4 className="font-semibold text-green-900 mb-2">Security Status:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Two-factor authentication is active</li>
                <li>• Backup codes have been generated</li>
                <li>• Account security is enhanced</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleDisable}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors"
            >
              Disable 2FA
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
});

// Privacy Settings Modal Component
const PrivacySettingsModal = React.memo(({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) => {
  const [settings, setSettings] = useState({
    profileVisible: true,
    orderHistoryVisible: false,
    locationTracking: true,
    analyticsData: false,
    thirdPartySharing: false
  });

  const handleSave = () => {
    onSuccess('Privacy settings updated successfully!');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Settings">
      <div className="space-y-6">
        <div className="space-y-4">
          {[
            {
              key: 'profileVisible',
              label: 'Profile Visibility',
              description: 'Allow other users to see your profile information'
            },
            {
              key: 'orderHistoryVisible',
              label: 'Order History Visibility',
              description: 'Share order history for personalized recommendations'
            },
            {
              key: 'locationTracking',
              label: 'Location Tracking',
              description: 'Allow location tracking for delivery optimization'
            },
            {
              key: 'analyticsData',
              label: 'Analytics Data',
              description: 'Share usage data to help improve our services'
            },
            {
              key: 'thirdPartySharing',
              label: 'Third-Party Sharing',
              description: 'Allow sharing data with trusted partners'
            }
          ].map((setting) => (
            <div key={setting.key} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex-1 mr-4">
                <h4 className="font-semibold text-gray-900">{setting.label}</h4>
                <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
              </div>
              <div
                className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                  settings[setting.key as keyof typeof settings] ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
                onClick={() => setSettings(prev => ({
                  ...prev,
                  [setting.key]: !prev[setting.key as keyof typeof prev]
                }))}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings[setting.key as keyof typeof settings] ? 'translate-x-7' : 'translate-x-1'
                }`}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 rounded-xl p-4">
          <h4 className="font-semibold text-amber-900 mb-2">Important Note:</h4>
          <p className="text-sm text-amber-800">
            Some features may not work properly if certain privacy settings are disabled.
            You can always change these settings later.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            Save Settings
          </button>
        </div>
      </div>
    </Modal>
  );
});

// Data & Privacy Modal Component
const DataPrivacyModal = React.memo(({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleDataRequest = (action: string) => {
    setSelectedAction(action);
    let message = '';
    switch (action) {
      case 'download':
        message = 'Data download request submitted. You will receive an email with your data within 30 days.';
        break;
      case 'delete':
        message = 'Account deletion request submitted. This action cannot be undone.';
        break;
      case 'correct':
        message = 'Data correction request submitted. We will review and update your information.';
        break;
    }
    onSuccess(message);
    setTimeout(() => {
      setSelectedAction(null);
      onClose();
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Data & Privacy">
      <div className="space-y-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Your Data Rights</h4>
          <p className="text-sm text-blue-800">
            You have the right to access, correct, download, or delete your personal data.
            We are committed to protecting your privacy and giving you control over your information.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              action: 'download',
              title: 'Download Your Data',
              description: 'Get a copy of all your personal data we have stored',
              icon: '⬇️',
              color: 'from-blue-500 to-blue-600'
            },
            {
              action: 'correct',
              title: 'Correct Your Data',
              description: 'Request corrections to any inaccurate personal information',
              icon: '✏️',
              color: 'from-green-500 to-green-600'
            },
            {
              action: 'delete',
              title: 'Delete Your Account',
              description: 'Permanently delete your account and all associated data',
              icon: '🗑️',
              color: 'from-red-500 to-red-600'
            }
          ].map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => handleDataRequest(item.action)}
              disabled={selectedAction !== null}
              className={`w-full p-4 rounded-xl text-left hover:bg-gray-50 transition-colors border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedAction === item.action ? 'border-emerald-300 bg-emerald-50' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  {selectedAction === item.action && (
                    <p className="text-sm text-emerald-600 font-semibold mt-2">Processing request...</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Data We Collect</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Account information (name, email, address)</li>
            <li>• Order history and preferences</li>
            <li>• Device and usage information</li>
            <li>• Location data (for delivery)</li>
            <li>• Communication history</li>
          </ul>
        </div>

        <div className="bg-amber-50 rounded-xl p-4">
          <h4 className="font-semibold text-amber-900 mb-2">Important Notice</h4>
          <p className="text-sm text-amber-800">
            Data requests may take up to 30 days to process. Account deletion is permanent and cannot be undone.
            Please contact support if you have any questions.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
});

// Live Chat Modal Component
const LiveChatModal = React.memo(({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  chatInput,
  setChatInput,
  isTyping
}: {
  isOpen: boolean;
  onClose: () => void;
  messages: Array<{id: number; sender: string; message: string; timestamp: Date}>;
  onSendMessage: (message: string) => void;
  chatInput: string;
  setChatInput: (value: string) => void;
  isTyping: boolean;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (chatInput.trim()) {
      onSendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        </div>

        <div className="relative inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-w-md w-full h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold">Live Chat Support</h3>
                  <p className="text-blue-100 text-sm">Online • Response time: ~2 min</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-900 px-4 py-2 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!chatInput.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by Faded Skies Support • Your data is secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Quick Help Modal Component
const QuickHelpModal = React.memo(({
  isOpen,
  onClose,
  helpType
}: {
  isOpen: boolean;
  onClose: () => void;
  helpType: string;
}) => {
  const getHelpContent = () => {
    switch (helpType) {
      case 'Order Status':
        return {
          title: 'Order Status Help',
          icon: '📦',
          content: [
            {
              question: 'How do I track my order?',
              answer: 'Go to the Orders tab to see real-time tracking of your delivery. You\'ll see your driver\'s location and estimated arrival time.'
            },
            {
              question: 'What do the different statuses mean?',
              answer: 'Preparing: Your order is being packed\nIn Transit: Driver is on the way\nDelivered: Order has been completed'
            },
            {
              question: 'My order is taking longer than expected',
              answer: 'Delivery times may vary due to traffic or high demand. If your order is significantly delayed, contact support for updates.'
            },
            {
              question: 'Can I change my delivery address?',
              answer: 'Address changes are only possible before your order enters "In Transit" status. Contact support immediately if needed.'
            }
          ]
        };

      case 'Payment Issues':
        return {
          title: 'Payment Issues Help',
          icon: '💳',
          content: [
            {
              question: 'What payment methods do you accept?',
              answer: 'We accept cash on delivery, debit cards, Apple Pay, Google Pay, Aeropay, and FS Coins (rewards).'
            },
            {
              question: 'My payment was declined',
              answer: 'Check that your card details are correct and you have sufficient funds. Some banks block cannabis purchases - contact your bank if needed.'
            },
            {
              question: 'Can I pay with credit cards?',
              answer: 'Due to federal banking regulations, we cannot accept credit cards for cannabis purchases. Debit cards and other methods are available.'
            },
            {
              question: 'How do I use FS Coins?',
              answer: 'FS Coins can be applied at checkout. 100 FS Coins = $1. You earn coins with every purchase and through our rewards program.'
            }
          ]
        };

      case 'Product Info':
        return {
          title: 'Product Information Help',
          icon: '🌿',
          content: [
            {
              question: 'How do I know if a product is right for me?',
              answer: 'Check the THC/CBD levels, strain type (Sativa/Indica/Hybrid), and effects listed. Start with lower doses if you\'re new to cannabis.'
            },
            {
              question: 'What does "Lab Tested" mean?',
              answer: 'Lab tested products have been analyzed for potency, pesticides, heavy metals, and other contaminants to ensure safety and quality.'
            },
            {
              question: 'What\'s the difference between Sativa, Indica, and Hybrid?',
              answer: 'Sativa: Energizing, creative effects\nIndica: Relaxing, sedating effects\nHybrid: Balanced combination of both'
            },
            {
              question: 'How should I store cannabis products?',
              answer: 'Keep in a cool, dry place away from children and pets. Edibles should be refrigerated. Flower should be in airtight containers.'
            }
          ]
        };

      case 'Account Help':
        return {
          title: 'Account Help',
          icon: '���',
          content: [
            {
              question: 'How do I verify my age/ID?',
              answer: 'Upload a clear photo of your government-issued ID through the verification process. You must be 21+ to use our service.'
            },
            {
              question: 'I forgot my password',
              answer: 'Use the "Forgot Password" link on the login screen to reset your password via email.'
            },
            {
              question: 'How do I update my delivery address?',
              answer: 'Go to Profile > Edit Profile to update your delivery address. Make sure it\'s within our delivery zone.'
            },
            {
              question: 'How do I delete my account?',
              answer: 'Contact support to request account deletion. This will permanently remove all your data and cannot be undone.'
            }
          ]
        };

      default:
        return {
          title: 'Help',
          icon: '❓',
          content: []
        };
    }
  };

  const helpContent = getHelpContent();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={helpContent.title}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl mb-4">{helpContent.icon}</div>
          <p className="text-gray-600">Find answers to common questions about {helpType.toLowerCase()}</p>
        </div>

        <div className="space-y-4">
          {helpContent.content.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-colors">
              <h4 className="font-bold text-gray-900 mb-2">{item.question}</h4>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{item.answer}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Still need help?</h4>
          <p className="text-blue-800 text-sm mb-3">If you couldn\'t find the answer you\'re looking for, our support team is here to help.</p>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                // This would open live chat
              }}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              Start Live Chat
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                // This would open ticket form
              }}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
            >
              Submit Ticket
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
});

// Contact Options Modal Component
const ContactModal = React.memo(({
  isOpen,
  onClose,
  contactType,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  contactType: string;
  onSuccess: (message: string) => void;
}) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    rating: 5,
    issueType: 'general'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getContactContent = () => {
    switch (contactType) {
      case 'Call Support':
        return {
          title: 'Call Support',
          icon: '📞',
          description: 'Speak directly with our support team',
          showForm: false,
          content: (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📞</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Call Our Support Team</h3>
                <p className="text-gray-600 mb-6">Speak directly with a support representative</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="text-center mb-4">
                  <div className="text-3xl font-black text-green-800 mb-2">(555) 420-FADED</div>
                  <div className="text-green-700 font-semibold">(555) 420-3233</div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Hours:</span>
                    <span className="text-green-700">24/7 Support Available</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Average Wait:</span>
                    <span className="text-green-700">Under 2 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Languages:</span>
                    <span className="text-green-700">English, Spanish</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Before you call:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Have your order number ready (if applicable)</li>
                  <li>• Be prepared to verify your identity</li>
                  <li>• Write down specific questions or issues</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => window.open('tel:5554203233', '_self')}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <span>📞</span>
                  <span>Call Now</span>
                </button>
              </div>
            </div>
          )
        };

      case 'Email Us':
        return {
          title: 'Email Support',
          icon: '✉️',
          description: 'Send us a detailed message',
          showForm: true,
          content: null
        };

      case 'Report Issue':
        return {
          title: 'Report an Issue',
          icon: '⚠️',
          description: 'Let us know about problems you\'ve encountered',
          showForm: true,
          content: null
        };

      case 'Feedback':
        return {
          title: 'Share Feedback',
          icon: '💬',
          description: 'Help us improve our service',
          showForm: true,
          content: null
        };

      default:
        return {
          title: 'Contact Us',
          icon: '💬',
          description: 'Get in touch',
          showForm: false,
          content: null
        };
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (contactType === 'Report Issue' && !form.issueType) {
      newErrors.issueType = 'Please select an issue type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      let message = '';
      switch (contactType) {
        case 'Email Us':
          message = 'Your email has been sent! We\'ll respond within 24 hours.';
          break;
        case 'Report Issue':
          message = 'Issue reported successfully! We\'ll investigate and follow up with you.';
          break;
        case 'Feedback':
          message = 'Thank you for your feedback! We truly appreciate your input.';
          break;
      }
      onSuccess(message);
      setForm({ name: '', email: '', phone: '', message: '', rating: 5, issueType: 'general' });
      setErrors({});
      onClose();
    }
  };

  const contactContent = getContactContent();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={contactContent.title}>
      <div className="space-y-6">
        {!contactContent.showForm ? (
          contactContent.content
        ) : (
          <>
            <div className="text-center">
              <div className="text-6xl mb-4">{contactContent.icon}</div>
              <p className="text-gray-600">{contactContent.description}</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                    }`}
                    placeholder="Your name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                    }`}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              {contactType === 'Report Issue' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Type</label>
                  <select
                    value={form.issueType}
                    onChange={(e) => setForm(prev => ({ ...prev, issueType: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white"
                  >
                    <option value="general">General Issue</option>
                    <option value="order">Order Problem</option>
                    <option value="payment">Payment Issue</option>
                    <option value="delivery">Delivery Problem</option>
                    <option value="product">Product Quality</option>
                    <option value="website">Website/App Bug</option>
                    <option value="account">Account Issue</option>
                  </select>
                </div>
              )}

              {contactType === 'Feedback' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, rating: star }))}
                        className={`text-2xl transition-colors ${
                          star <= form.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                    <span className="text-sm text-gray-600 ml-2">({form.rating}/5)</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {contactType === 'Report Issue' ? 'Describe the Issue' :
                   contactType === 'Feedback' ? 'Your Feedback' : 'Message'}
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none ${
                    errors.message ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                  }`}
                  rows={4}
                  placeholder={`Please provide details about your ${contactType.toLowerCase()}...`}
                />
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                {contactType === 'Email Us' ? 'Send Email' :
                 contactType === 'Report Issue' ? 'Report Issue' : 'Submit Feedback'}
              </button>
            </div>
          </>
        )}

        {contactContent.showForm && (
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </Modal>
  );
});

// Submit Ticket Modal Component
const SubmitTicketModal = React.memo(({
  isOpen,
  onClose,
  onSuccess,
  ticketForm,
  setTicketForm
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  ticketForm: {subject: string; category: string; description: string};
  setTicketForm: (form: {subject: string; category: string; description: string}) => void;
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [priority, setPriority] = useState('medium');
  const [attachments, setAttachments] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!ticketForm.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!ticketForm.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (ticketForm.description.trim().length < 10) {
      newErrors.description = 'Please provide more details (at least 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const ticketId = `FS-${Date.now()}`;
      onSuccess(`Support ticket ${ticketId} created successfully! We\'ll respond within 24 hours.`);
      setTicketForm({ subject: '', category: 'Order Issue', description: '' });
      setPriority('medium');
      setAttachments([]);
      setErrors({});
      onClose();
    }
  };

  const addAttachment = () => {
    // Simulate file attachment
    const fakeFiles = [
      'screenshot.png',
      'receipt.pdf',
      'order_confirmation.jpg',
      'error_log.txt'
    ];
    const randomFile = fakeFiles[Math.floor(Math.random() * fakeFiles.length)];
    if (!attachments.includes(randomFile)) {
      setAttachments(prev => [...prev, randomFile]);
    }
  };

  const removeAttachment = (file: string) => {
    setAttachments(prev => prev.filter(f => f !== file));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Support Ticket">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600">Describe your issue and we\'ll help you resolve it quickly</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
            <input
              type="text"
              value={ticketForm.subject}
              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
              }`}
              placeholder="Brief description of your issue..."
            />
            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white"
              >
                <option value="Order Issue">Order Issue</option>
                <option value="Payment Problem">Payment Problem</option>
                <option value="Product Question">Product Question</option>
                <option value="Account Issue">Account Issue</option>
                <option value="Technical Problem">Technical Problem</option>
                <option value="Delivery Issue">Delivery Issue</option>
                <option value="Billing Question">Billing Question</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-gray-50 focus:bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <textarea
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
              }`}
              rows={5}
              placeholder="Please provide detailed information about your issue. Include order numbers, error messages, or any other relevant details..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            <p className="text-xs text-gray-500 mt-1">{ticketForm.description.length} characters</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-emerald-300 transition-colors">
              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <span className="text-sm text-gray-700 flex items-center">
                        <span className="mr-2">📄</span>
                        {file}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No files attached</p>
                </div>
              )}
              <button
                type="button"
                onClick={addAttachment}
                className="mt-3 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                + Add File (Demo)
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Supported: Images, PDFs, text files (Max 10MB each)</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You\'ll receive a confirmation email with your ticket number</li>
            <li>• Our team will review your issue within 2-4 hours</li>
            <li>• We\'ll respond with a solution or follow-up questions</li>
            <li>• You can track your ticket status in your account</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            Submit Ticket
          </button>
        </div>
      </div>
    </Modal>
  );
});

// Order Details Modal Component
const OrderDetailsModal = React.memo(({
  isOpen,
  onClose,
  order,
  onTrackOrder,
  onReorder
}: {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onTrackOrder: (order: Order) => void;
  onReorder: (order: Order) => void;
}) => {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in-transit': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-amber-100 text-amber-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return '✅';
      case 'in-transit': return '🚚';
      case 'preparing': return '📦';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order ${order.id}`}>
      <div className="space-y-6">
        {/* Order Status */}
        <div className="text-center">
          <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full ${getStatusColor(order.status)} text-lg font-bold mb-4`}>
            <span>{getStatusIcon(order.status)}</span>
            <span className="capitalize">{order.status.replace('-', ' ')}</span>
          </div>
          <p className="text-gray-600">Order placed on {new Date(order.date).toLocaleDateString()}</p>
        </div>

        {/* Order Progress */}
        {order.trackingSteps && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-bold text-gray-900 mb-4">Order Progress</h4>
            <div className="space-y-3">
              {order.trackingSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      step.completed ? 'text-gray-900' : 'text-gray-500'
                    }`}>{step.step}</p>
                    <p className="text-sm text-gray-500">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3">Items Ordered</h4>
          <div className="space-y-3">
            {order.itemDetails?.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-semibold text-gray-900">{item.name}</h5>
                  <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <div className="flex space-x-4">
                    {item.strain && <span>Strain: {item.strain}</span>}
                    {item.thc && <span>THC: {item.thc}</span>}
                    {item.cbd && <span>CBD: {item.cbd}</span>}
                  </div>
                  <span>Qty: {item.quantity}</span>
                </div>
              </div>
            )) || order.items.map((item, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="font-semibold text-gray-900">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-bold text-gray-900 mb-3">Order Summary</h4>
          <div className="space-y-2">
            {order.subtotal && (
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${order.subtotal.toFixed(2)}</span>
              </div>
            )}
            {order.tax && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${order.tax.toFixed(2)}</span>
              </div>
            )}
            {order.deliveryFee !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span className="font-medium">
                  {order.deliveryFee === 0 ? 'FREE' : `$${order.deliveryFee.toFixed(2)}`}
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-lg text-emerald-600">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-bold text-blue-900 mb-3">Delivery Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-800">Driver:</span>
              <span className="font-medium text-blue-900">{order.driver}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-800">Vehicle:</span>
              <span className="font-medium text-blue-900">{order.vehicle}</span>
            </div>
            {order.driverPhone && (
              <div className="flex justify-between">
                <span className="text-blue-800">Driver Phone:</span>
                <span className="font-medium text-blue-900">{order.driverPhone}</span>
              </div>
            )}
            {order.deliveryAddress && (
              <div className="flex justify-between">
                <span className="text-blue-800">Address:</span>
                <span className="font-medium text-blue-900">{order.deliveryAddress}</span>
              </div>
            )}
            {order.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-blue-800">Payment:</span>
                <span className="font-medium text-blue-900">{order.paymentMethod}</span>
              </div>
            )}
            {order.orderNotes && (
              <div>
                <span className="text-blue-800">Notes:</span>
                <p className="font-medium text-blue-900 mt-1">{order.orderNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {order.status === 'in-transit' && (
            <button
              type="button"
              onClick={() => {
                onTrackOrder(order);
                onClose();
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <MapPin className="w-5 h-5" />
              <span>Track Live</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onReorder(order);
              onClose();
            }}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            Reorder
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
});

// Reorder Modal Component
const ReorderModal = React.memo(({
  isOpen,
  onClose,
  order,
  reorderItems,
  setReorderItems,
  onAddToCart,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  reorderItems: OrderItem[];
  setReorderItems: (items: OrderItem[]) => void;
  onAddToCart: (items: OrderItem[]) => void;
  onSuccess: (message: string) => void;
}) => {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && order?.itemDetails) {
      // Initialize with all items selected
      const initialSelection: Record<string, boolean> = {};
      order.itemDetails.forEach((item, index) => {
        initialSelection[`${item.name}-${index}`] = true;
      });
      setSelectedItems(initialSelection);
      setReorderItems(order.itemDetails);
    }
  }, [isOpen, order, setReorderItems]);

  const toggleItemSelection = (item: OrderItem, index: number) => {
    const key = `${item.name}-${index}`;
    const newSelection = {
      ...selectedItems,
      [key]: !selectedItems[key]
    };
    setSelectedItems(newSelection);

    // Update reorder items based on selection
    if (!selectedItems[key]) {
      setReorderItems([...reorderItems, item]);
    } else {
      setReorderItems(reorderItems.filter((_, i) => i !== index));
    }
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = reorderItems.map((item, i) =>
      i === index ? { ...item, quantity: newQuantity } : item
    );
    setReorderItems(updatedItems);
  };

  const getSelectedItems = () => {
    if (!order?.itemDetails) return [];

    return order.itemDetails.filter((item, index) =>
      selectedItems[`${item.name}-${index}`]
    ).map((item, originalIndex) => {
      const reorderItem = reorderItems.find((r, i) => r.name === item.name);
      return reorderItem || item;
    });
  };

  const handleReorder = () => {
    const itemsToAdd = getSelectedItems();
    if (itemsToAdd.length === 0) {
      onSuccess('Please select at least one item to reorder.');
      return;
    }

    onAddToCart(itemsToAdd);
    onSuccess(`${itemsToAdd.length} item${itemsToAdd.length > 1 ? 's' : ''} added to cart!`);
    onClose();
  };

  const calculateTotal = () => {
    return getSelectedItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (!order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reorder from ${order.id}`}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Reorder Items</h3>
          <p className="text-gray-600">Select items you'd like to add to your cart</p>
        </div>

        {/* Items Selection */}
        <div className="space-y-3">
          {order.itemDetails?.map((item, index) => {
            const key = `${item.name}-${index}`;
            const isSelected = selectedItems[key];
            const reorderItem = reorderItems.find(r => r.name === item.name) || item;

            return (
              <div key={key} className={`border-2 rounded-xl p-4 transition-all ${
                isSelected ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItemSelection(item, index)}
                    className="mt-1 w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                  />

                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      {item.strain && <span>Strain: {item.strain}</span>}
                      {item.thc && <span>THC: {item.thc}</span>}
                      {item.cbd && <span>CBD: {item.cbd}</span>}
                    </div>

                    {isSelected && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-700">Quantity:</span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(index, reorderItem.quantity - 1)}
                              disabled={reorderItem.quantity <= 1}
                              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold">{reorderItem.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(index, reorderItem.quantity + 1)}
                              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">${(item.price * reorderItem.quantity).toFixed(2)}</div>
                          <div className="text-sm text-gray-500">${item.price.toFixed(2)} each</div>
                        </div>
                      </div>
                    )}

                    {!isSelected && (
                      <div className="text-right">
                        <div className="font-bold text-gray-500">${item.price.toFixed(2)}</div>
                        <div className="text-sm text-gray-400">Original quantity: {item.quantity}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }) || (
            <div className="text-center py-8 text-gray-500">
              <p>No detailed item information available for this order.</p>
              <p className="text-sm mt-2">Items: {order.items.join(', ')}</p>
            </div>
          )}
        </div>

        {/* Order Summary */}
        {getSelectedItems().length > 0 && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <h4 className="font-bold text-green-900 mb-3">Reorder Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-green-800">
                <span>Items selected:</span>
                <span className="font-semibold">{getSelectedItems().length}</span>
              </div>
              <div className="flex justify-between text-green-800">
                <span>Total quantity:</span>
                <span className="font-semibold">{getSelectedItems().reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="border-t border-green-200 pt-2 flex justify-between">
                <span className="font-bold text-green-900">Total:</span>
                <span className="font-bold text-xl text-green-900">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReorder}
            disabled={getSelectedItems().length === 0}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart ({getSelectedItems().length})
          </button>
        </div>
      </div>
    </Modal>
  );
});

// Live Order Tracking Modal Component
const LiveTrackingModal = React.memo(({
  isOpen,
  onClose,
  order
}: {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const destinationMarker = useRef<mapboxgl.Marker | null>(null);
  const [driverLocation, setDriverLocation] = useState(order?.driverLocation || null);
  const [eta, setEta] = useState(order?.estimatedDelivery || 'Calculating...');
  const [distance, setDistance] = useState('Calculating...');
  const [mapError, setMapError] = useState(false);

  // Simulated live updates
  useEffect(() => {
    if (!isOpen || !order?.driverLocation) return;

    const interval = setInterval(() => {
      // Simulate driver movement (small random changes)
      setDriverLocation(prev => {
        if (!prev) return null;

        const deltaLat = (Math.random() - 0.5) * 0.001; // ~100m max change
        const deltaLng = (Math.random() - 0.5) * 0.001;

        return {
          lat: prev.lat + deltaLat,
          lng: prev.lng + deltaLng,
          lastUpdated: new Date()
        };
      });

      // Update ETA simulation
      const etas = ['5-8 minutes', '8-12 minutes', '12-15 minutes', '3-5 minutes'];
      setEta(etas[Math.floor(Math.random() * etas.length)]);

      // Update distance simulation
      const distances = ['0.3 miles', '0.5 miles', '0.7 miles', '0.2 miles'];
      setDistance(distances[Math.floor(Math.random() * distances.length)]);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen, order]);

  // Initialize Mapbox
  useEffect(() => {
    if (!isOpen || !mapContainer.current || !order?.driverLocation) return;

    try {
      // For demo purposes - in production, use environment variable
      mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoidGVzdCIsImEiOiJkZW1vLXRva2VuIn0.demo';

      // Initialize map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11', // Use v11 for better compatibility
        center: [order.driverLocation.lng, order.driverLocation.lat],
        zoom: 14
      });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add destination marker (user's location)
    const destinationEl = document.createElement('div');
    destinationEl.className = 'destination-marker';
    destinationEl.innerHTML = '🏠';
    destinationEl.style.fontSize = '24px';

    destinationMarker.current = new mapboxgl.Marker(destinationEl)
      .setLngLat([order.driverLocation.lng + 0.005, order.driverLocation.lat + 0.005]) // Simulate destination
      .addTo(map.current);

    // Add driver marker
    const driverEl = document.createElement('div');
    driverEl.className = 'driver-marker';
    driverEl.innerHTML = '🚚';
    driverEl.style.fontSize = '24px';

    driverMarker.current = new mapboxgl.Marker(driverEl)
      .setLngLat([order.driverLocation.lng, order.driverLocation.lat])
      .addTo(map.current);

    } catch (error) {
      console.warn('Mapbox failed to load, using demo mode:', error);
      setMapError(true);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen, order]);

  // Update driver marker position
  useEffect(() => {
    if (driverMarker.current && driverLocation) {
      driverMarker.current.setLngLat([driverLocation.lng, driverLocation.lat]);

      // Center map on driver if visible
      if (map.current) {
        map.current.easeTo({
          center: [driverLocation.lng, driverLocation.lat],
          duration: 1000
        });
      }
    }
  }, [driverLocation]);

  if (!order || !order.driverLocation) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Order Tracking">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Tracking Not Available</h3>
          <p className="text-gray-600">Live tracking is only available for orders in transit.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Live Tracking</h2>
            <p className="text-blue-100">{order.id} • {order.driver}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="w-full h-full" />

          {/* Map Overlay - Status */}
          <div className="absolute top-4 left-4 right-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-bold text-gray-900">Driver en route</span>
                </div>
                <span className="text-sm text-gray-500">
                  Updated {driverLocation?.lastUpdated.toLocaleTimeString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ETA</p>
                  <p className="font-bold text-lg text-gray-900">{eta}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-bold text-lg text-gray-900">{distance}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Overlay - Driver Info */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{order.driver}</h4>
                  <p className="text-sm text-gray-600">{order.vehicle}</p>
                  {order.driverPhone && (
                    <p className="text-sm text-blue-600">{order.driverPhone}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => window.open(`tel:${order.driverPhone}`, '_self')}
                    className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors"
                  >
                    <span className="text-lg">📞</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('SMS functionality would open here')}
                    className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                if (map.current && driverLocation) {
                  map.current.flyTo({
                    center: [driverLocation.lng, driverLocation.lat],
                    zoom: 16,
                    duration: 2000
                  });
                }
              }}
              className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-xl font-bold hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
            >
              <MapPin className="w-5 h-5" />
              <span>Center on Driver</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

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
      itemDetails: [
        { name: 'Purple Haze Live Resin Cart', quantity: 1, price: 65.00, strain: 'Sativa', thc: '89.2%', cbd: '0.1%' },
        { name: 'Midnight Mint Indica Gummies', quantity: 1, price: 28.00, strain: 'Indica', thc: '10mg each', cbd: '2mg each' }
      ],
      total: 89.50,
      subtotal: 93.00,
      tax: 8.50,
      deliveryFee: 0,
      date: '2025-06-10',
      estimatedDelivery: '2-4 hours',
      deliveredAt: '3:10 PM',
      driver: 'Marcus Chen',
      vehicle: 'Blue Toyota Prius - ABC789',
      driverPhone: '+1 (555) 123-4567',
      deliveryAddress: '123 Main St, Austin, TX 78701',
      paymentMethod: 'Apple Pay',
      orderNotes: 'Please ring doorbell twice',
      trackingSteps: [
        { step: 'Order confirmed', time: '12:15 PM', completed: true },
        { step: 'In preparation', time: '12:30 PM', completed: true },
        { step: 'Out for delivery', time: '2:45 PM', completed: true },
        { step: 'Delivered', time: '3:10 PM', completed: true }
      ]
    },
    {
      id: '#FS2025002',
      status: 'in-transit',
      items: ['OG Kush Premium Flower', 'Sunset Sherbet Pre-roll 3-Pack'],
      itemDetails: [
        { name: 'OG Kush Premium Flower', quantity: 1, price: 45.00, strain: 'Indica', thc: '24.3%', cbd: '0.2%' },
        { name: 'Sunset Sherbet Pre-roll 3-Pack', quantity: 1, price: 35.00, strain: 'Hybrid', thc: '21.7%', cbd: '0.3%' }
      ],
      total: 124.75,
      subtotal: 80.00,
      tax: 7.25,
      deliveryFee: 5.00,
      date: '2025-06-12',
      estimatedDelivery: '1-2 hours',
      driver: 'Alex Rodriguez',
      vehicle: 'Green Honda Civic - XYZ123',
      driverPhone: '+1 (555) 987-6543',
      deliveryAddress: '123 Main St, Austin, TX 78701',
      paymentMethod: 'Debit Card ending in 4321',
      currentLocation: '0.8 miles away',
      trackingSteps: [
        { step: 'Order confirmed', time: '1:15 PM', completed: true },
        { step: 'In preparation', time: '1:30 PM', completed: true },
        { step: 'Out for delivery', time: '2:15 PM', completed: true },
        { step: 'Delivered', time: 'ETA 3:30 PM', completed: false }
      ],
      driverLocation: {
        lat: 30.2672,
        lng: -97.7431,
        lastUpdated: new Date()
      }
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  // Modal states
  const [currentModal, setCurrentModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>({});

  // Profile preferences
  const [preferences, setPreferences] = useState({
    pushNotifications: true,
    emailUpdates: false,
    smsAlerts: true,
    marketingCommunications: false
  });

  // Support ticket state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: 'Order Issue',
    description: ''
  });

  // Live chat state
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'agent', message: 'Hi! How can I help you today?', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Order modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reorderItems, setReorderItems] = useState<OrderItem[]>([]);

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

  // Modal management functions
  const openModal = useCallback((modalType: string, data?: any) => {
    setCurrentModal(modalType);
    setModalData(data || {});
  }, []);

  const closeModal = useCallback(() => {
    setCurrentModal(null);
    setModalData({});
  }, []);

  const togglePreference = useCallback((key: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  }, []);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }));
    setToastMessage('Profile updated successfully!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const sendChatMessage = useCallback((message: string) => {
    const newMessage = {
      id: chatMessages.length + 1,
      sender: 'user',
      message,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);

    // Simulate agent typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const agentResponse = {
        id: chatMessages.length + 2,
        sender: 'agent',
        message: getAgentResponse(message),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, agentResponse]);
    }, 1500 + Math.random() * 1000);
  }, [chatMessages]);

  const getAgentResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('order') || lowerMessage.includes('delivery')) {
      return 'I can help you with your order! Can you please provide your order number? You can find it in the Orders tab.';
    } else if (lowerMessage.includes('payment') || lowerMessage.includes('card')) {
      return 'I\'m here to help with payment issues. Are you having trouble with a specific payment method or transaction?';
    } else if (lowerMessage.includes('product') || lowerMessage.includes('strain')) {
      return 'I\'d be happy to help you learn about our products! What specific information are you looking for?';
    } else if (lowerMessage.includes('account') || lowerMessage.includes('login')) {
      return 'I can assist with account-related questions. Are you having trouble logging in or need to update your information?';
    } else {
      const responses = [
        'Thank you for contacting us! Let me help you with that.',
        'I understand. Can you provide more details about your concern?',
        'That\'s a great question! Let me gather some information for you.',
        'I\'m here to help! Could you tell me more about what you\'re experiencing?'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  };

  // Order modal handlers
  const handleViewOrderDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
    openModal('orderDetails');
  }, [openModal]);

  const handleReorderItems = useCallback((order: Order) => {
    setSelectedOrder(order);
    if (order.itemDetails) {
      setReorderItems(order.itemDetails);
    }
    openModal('reorder');
  }, [openModal]);

  const handleTrackOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    openModal('liveTracking');
  }, [openModal]);

  const handleAddReorderToCart = useCallback((items: OrderItem[]) => {
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        // Find matching product in products array
        const matchingProduct = products.find(p =>
          p.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])
        );
        if (matchingProduct) {
          addToCart(matchingProduct);
        }
      }
    });
  }, [addToCart, products]);

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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                <div>
                                  <p className="font-semibold text-blue-900">Driver is {order.currentLocation}</p>
                                  <p className="text-blue-700 text-sm">ETA: {order.estimatedDelivery}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleTrackOrder(order)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                              >
                                <MapPin className="w-4 h-4" />
                                <span>Track Live</span>
                              </button>
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
                            onClick={() => handleReorderItems(order)}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all"
                          >
                            Reorder
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewOrderDetails(order)}
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
                    onClick={() => openModal('rewards')}
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
                    onClick={() => openModal('editProfile')}
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
                      { label: 'Push Notifications', icon: Bell, key: 'pushNotifications' },
                      { label: 'Email Updates', icon: Bell, key: 'emailUpdates' },
                      { label: 'SMS Alerts', icon: MessageCircle, key: 'smsAlerts' },
                      { label: 'Marketing Communications', icon: Bell, key: 'marketingCommunications' }
                    ].map((pref, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <pref.icon className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-700">{pref.label}</span>
                        </div>
                        <div
                          className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                            preferences[pref.key as keyof typeof preferences] ? 'bg-emerald-600' : 'bg-gray-300'
                          }`}
                          onClick={() => togglePreference(pref.key)}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            preferences[pref.key as keyof typeof preferences] ? 'translate-x-7' : 'translate-x-1'
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
                      { label: 'Change Password', icon: Shield, modal: 'changePassword' },
                      { label: 'Two-Factor Authentication', icon: Shield, modal: 'twoFactor' },
                      { label: 'Privacy Settings', icon: Shield, modal: 'privacySettings' },
                      { label: 'Data & Privacy', icon: Shield, modal: 'dataPrivacy' }
                    ].map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => openModal(item.modal)}
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

          {currentView === 'support' && (
            <div className="pb-24 bg-gradient-to-br from-gray-50 to-white min-h-screen">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-b-3xl shadow-xl">
                <h1 className="text-3xl font-bold mb-2">Support Center</h1>
                <p className="text-green-100 text-lg">We're here to help 24/7</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-xl text-blue-900">Live Chat</h3>
                      <p className="text-blue-700">Get instant help from our team</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal('liveChat')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Start Chat
                  </button>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Quick Help</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { title: 'Order Status', icon: '📦', color: 'from-green-400 to-emerald-500' },
                      { title: 'Payment Issues', icon: '💳', color: 'from-blue-400 to-cyan-500' },
                      { title: 'Product Info', icon: '🌿', color: 'from-purple-400 to-violet-500' },
                      { title: 'Account Help', icon: '👤', color: 'from-orange-400 to-amber-500' }
                    ].map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => openModal('quickHelp', { helpType: item.title })}
                        className={`bg-gradient-to-r ${item.color} text-white p-4 rounded-2xl text-center hover:scale-105 transition-all shadow-lg hover:shadow-xl`}
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <div className="font-bold text-sm">{item.title}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    {[
                      {
                        question: 'How long does delivery take?',
                        answer: 'Most orders arrive within 1-2 hours. Same-day delivery available until 10 PM.'
                      },
                      {
                        question: 'What payment methods do you accept?',
                        answer: 'We accept cash, debit cards, Apple Pay, Google Pay, and FS Coins.'
                      },
                      {
                        question: 'Do I need to show ID upon delivery?',
                        answer: 'Yes, valid government-issued ID is required for all deliveries to verify age (21+).'
                      },
                      {
                        question: 'Can I track my order?',
                        answer: 'Yes! You can track your order in real-time in the Orders tab.'
                      }
                    ].map((faq, index) => (
                      <div key={index} className="border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-colors">
                        <h4 className="font-bold text-gray-900 mb-2">{faq.question}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Contact Options</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Call Support', icon: '📞', subtitle: '(555) 420-FADED' },
                      { label: 'Email Us', icon: '✉️', subtitle: 'support@fadedskies.com' },
                      { label: 'Report Issue', icon: '⚠️', subtitle: 'Something went wrong?' },
                      { label: 'Feedback', icon: '💬', subtitle: 'Help us improve' }
                    ].map((contact, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => openModal('contact', { contactType: contact.label })}
                        className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-2xl">{contact.icon}</span>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{contact.label}</div>
                          <div className="text-sm text-gray-600">{contact.subtitle}</div>
                        </div>
                        <span className="text-gray-400">→</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-3xl p-6 border border-emerald-100">
                  <h3 className="font-bold text-xl text-emerald-900 mb-4">Submit a Ticket</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-emerald-800 mb-2">Subject</label>
                      <input
                        type="text"
                        placeholder="Brief description of your issue..."
                        className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-emerald-800 mb-2">Category</label>
                      <select className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white">
                        <option>Order Issue</option>
                        <option>Payment Problem</option>
                        <option>Product Question</option>
                        <option>Account Issue</option>
                        <option>Technical Problem</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-emerald-800 mb-2">Description</label>
                      <textarea
                        placeholder="Please describe your issue in detail..."
                        rows={4}
                        className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white resize-none"
                      ></textarea>
                    </div>
                    <button
                      type="button"
                      onClick={() => openModal('submitTicket')}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">Hours & Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Support Hours</span>
                      <span className="font-semibold text-gray-900">24/7</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Live Chat</span>
                      <span className="font-semibold text-green-600">Online</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-700">Response Time</span>
                      <span className="font-semibold text-gray-900">Under 5 minutes</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Languages</span>
                      <span className="font-semibold text-gray-900">English, Spanish</span>
                    </div>
                  </div>
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

          {/* Modals */}
          <EditProfileModal
            isOpen={currentModal === 'editProfile'}
            onClose={closeModal}
            user={user}
            onUpdate={updateUserProfile}
          />

          <RewardsModal
            isOpen={currentModal === 'rewards'}
            onClose={closeModal}
            user={user}
          />

          <ChangePasswordModal
            isOpen={currentModal === 'changePassword'}
            onClose={closeModal}
            onSuccess={showToastMessage}
          />

          <TwoFactorModal
            isOpen={currentModal === 'twoFactor'}
            onClose={closeModal}
            onSuccess={showToastMessage}
          />

          <PrivacySettingsModal
            isOpen={currentModal === 'privacySettings'}
            onClose={closeModal}
            onSuccess={showToastMessage}
          />

          <DataPrivacyModal
            isOpen={currentModal === 'dataPrivacy'}
            onClose={closeModal}
            onSuccess={showToastMessage}
          />

          {/* Support Modals */}
          <LiveChatModal
            isOpen={currentModal === 'liveChat'}
            onClose={closeModal}
            messages={chatMessages}
            onSendMessage={sendChatMessage}
            chatInput={chatInput}
            setChatInput={setChatInput}
            isTyping={isTyping}
          />

          <QuickHelpModal
            isOpen={currentModal === 'quickHelp'}
            onClose={closeModal}
            helpType={modalData.helpType || ''}
          />

          <ContactModal
            isOpen={currentModal === 'contact'}
            onClose={closeModal}
            contactType={modalData.contactType || ''}
            onSuccess={showToastMessage}
          />

          <SubmitTicketModal
            isOpen={currentModal === 'submitTicket'}
            onClose={closeModal}
            onSuccess={showToastMessage}
            ticketForm={ticketForm}
            setTicketForm={setTicketForm}
          />

          {/* Order Modals */}
          <OrderDetailsModal
            isOpen={currentModal === 'orderDetails'}
            onClose={closeModal}
            order={selectedOrder}
            onTrackOrder={handleTrackOrder}
            onReorder={handleReorderItems}
          />

          <ReorderModal
            isOpen={currentModal === 'reorder'}
            onClose={closeModal}
            order={selectedOrder}
            reorderItems={reorderItems}
            setReorderItems={setReorderItems}
            onAddToCart={handleAddReorderToCart}
            onSuccess={showToastMessage}
          />

          <LiveTrackingModal
            isOpen={currentModal === 'liveTracking'}
            onClose={closeModal}
            order={selectedOrder}
          />
        </>
      )}
    </div>
  );
};

export default FadedSkiesApp;
