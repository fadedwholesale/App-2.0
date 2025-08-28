<<<<<<< HEAD
# Faded Skies Admin App 🌿

A modern web-based admin panel for managing the Faded Skies cannabis delivery business. Built with React, TypeScript, and Supabase for real-time data management.

## 🚀 Quick Deploy

### Option 1: One-Click Deploy (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/faded-skies-admin)

### Option 2: Manual Deploy

```bash
# Clone and setup
git clone https://github.com/YOUR_USERNAME/faded-skies-admin.git
cd faded-skies-admin
npm install

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

## 🌐 Live Demo

Once deployed, your admin app will be available at:
- **Vercel URL**: `https://your-app-name.vercel.app`
- **Custom Domain**: `https://admin.yourdomain.com` (if configured)

## ✨ Features

### 🔐 Authentication
- **Secure Login/Signup** - Supabase authentication
- **Admin Account Management** - Create and manage admin accounts
- **Session Persistence** - Stay logged in across sessions
- **Role-based Access** - Admin-only features

### 📊 Real-time Dashboard
- **Live Statistics** - Real-time counts of orders, products, customers
- **Revenue Tracking** - Total revenue from all orders
- **Recent Activity** - Latest orders and updates
- **Performance Metrics** - Business insights

### 🛍️ Product Management
- **Product Catalog** - View all available products
- **Add/Edit Products** - Manage product inventory
- **Stock Management** - Track product availability
- **Category Organization** - Organize products by type

### 📋 Order Management
- **Order Processing** - View and manage all customer orders
- **Status Updates** - Update order status in real-time
- **Driver Assignment** - Assign orders to available drivers
- **Order History** - Complete order tracking

### 👥 Customer Management
- **Customer Database** - View all registered users
- **Customer Details** - Individual customer information
- **Order History** - Customer order tracking
- **Contact Information** - Customer communication

### 🔔 Real-time Notifications
- **New Order Alerts** - Instant notifications for new orders
- **Status Updates** - Real-time order status changes
- **Browser Notifications** - Desktop notifications
- **Live Updates** - No page refresh needed

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Build Tool**: Vite

## 📱 Responsive Design

- **Desktop Optimized** - Full admin dashboard experience
- **Tablet Friendly** - Responsive layout for tablets
- **Mobile Compatible** - Works on mobile devices
- **Cross-browser** - Works on all modern browsers

## 🔧 Environment Variables

Set these in your hosting platform:

```env
VITE_SUPABASE_URL=https://hdqbnhtimuynuypwouwf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔗 Integration

This admin app integrates with:
- **User App** - Manages orders from customer app
- **Driver App** - Assigns orders to drivers
- **Supabase Database** - Real-time data synchronization

## 🛡️ Security

- **HTTPS Only** - Secure connections
- **Environment Variables** - No sensitive data in code
- **Supabase RLS** - Row-level security
- **Admin Authentication** - Secure admin access

## 📈 Benefits

### 🌐 Always Online
- **Web-based** - Access from anywhere
- **No Local Dependencies** - Runs independently
- **24/7 Availability** - Never goes offline
- **Global Access** - Manage from any device

### 🔄 Real-time Sync
- **Live Updates** - Instant data synchronization
- **No Refresh Needed** - Real-time notifications
- **Multi-user Support** - Multiple admins can work simultaneously
- **Data Consistency** - Always up-to-date information

### 💼 Business Management
- **Complete Control** - Full business oversight
- **Order Processing** - Efficient order management
- **Customer Service** - Better customer support
- **Analytics** - Business insights and reporting

## 🎯 Use Cases

- **Cannabis Dispensaries** - Manage delivery operations
- **Food Delivery** - Adapt for food delivery businesses
- **Retail Management** - General retail inventory management
- **Service Businesses** - Appointment and service management

## 📞 Support

For support and questions:
- **Documentation**: See `DEPLOYMENT.md` for detailed setup
- **Issues**: Report bugs on GitHub
- **Features**: Request new features via GitHub

---

**Built with ❤️ for Faded Skies Cannabis Delivery**

=======
# Faded Skies Cannabis Delivery Platform

A comprehensive cannabis delivery platform with three independent applications that communicate in real-time.

## 🏗️ Architecture

The platform consists of four main components:

### 📱 **User App** (Port 3000)
- Customer-facing application for ordering cannabis products
- Real-time order tracking and notifications
- Payment processing and delivery management

### 🚚 **Driver App** (Port 3001)
- Driver interface for accepting and managing deliveries
- Real-time location tracking and route optimization
- Order status updates and customer communication

### 📊 **Admin Panel** (Port 3002)
- Administrative dashboard for managing orders, products, and users
- Real-time order monitoring and driver management
- Analytics and reporting tools

### 🔧 **Backend Server** (Port 3001)
- RESTful API for all applications
- WebSocket server for real-time communication
- Database management and business logic

## 🚀 Quick Start

### Install Dependencies
```bash
npm run install:all
```

### Development Mode (All Apps)
```bash
npm run dev:all
```

This will start:
- Backend server on `http://localhost:3001`
- User app on `http://localhost:3000`
- Driver app on `http://localhost:3001`
- Admin panel on `http://localhost:3002`

### Individual App Development

#### User App
```bash
cd user-app
npm run dev
```

#### Driver App
```bash
cd driver-app
npm run dev
```

#### Admin Panel
```bash
cd admin-app
npm run dev
```

#### Backend Server
```bash
cd backend
npm run dev
```

## 🔄 Real-Time Communication

All apps communicate through:
- **WebSocket connections** for real-time updates
- **Shared backend API** for data persistence
- **Event-driven architecture** for order flow management

### Communication Flow
1. **User places order** → Backend receives order
2. **Backend notifies Admin** → Admin can approve/reject
3. **Admin assigns Driver** → Driver receives notification
4. **Driver accepts order** → User gets status update
5. **Real-time tracking** → All parties see live updates

## 📁 Project Structure

```
App-2.0/
├── backend/                 # Backend server (Node.js/Express)
├── user-app/               # Customer application
├── driver-app/             # Driver application  
├── admin-app/              # Admin dashboard
├── src/                    # Shared components and services
│   ├── components/         # React components
│   ├── services/           # Shared services (WebSocket, API)
│   └── mockApi.ts          # Mock data for development
└── package.json            # Root package with scripts
```

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Database**: Prisma ORM with SQLite/PostgreSQL
- **Real-time**: WebSocket connections
- **Mobile**: Capacitor for iOS/Android deployment

## 📱 Mobile Deployment

Each app can be deployed as a mobile application using Capacitor:

```bash
# For User App
cd user-app
npx cap add ios
npx cap add android
npx cap sync

# For Driver App  
cd driver-app
npx cap add ios
npx cap add android
npx cap sync

# For Admin App
cd admin-app
npx cap add ios
npx cap add android
npx cap sync
```

## 🔧 Environment Variables

Create `.env` files in each app directory:

```env
# Backend (.env)
PORT=3001
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002"

# User App (.env)
VITE_API_URL="http://localhost:3001"
VITE_WS_URL="ws://localhost:3001"

# Driver App (.env)
VITE_API_URL="http://localhost:3001"
VITE_WS_URL="ws://localhost:3001"

# Admin App (.env)
VITE_API_URL="http://localhost:3001"
VITE_WS_URL="ws://localhost:3001"
```

## 🧪 Testing

```bash
# Test all apps
npm run test:all

# Test individual apps
cd user-app && npm test
cd driver-app && npm test
cd admin-app && npm test
```

## 📦 Production Build

```bash
# Build all applications
npm run build:all

# Build individual apps
cd user-app && npm run build
cd driver-app && npm run build
cd admin-app && npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test all applications
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
>>>>>>> 9c22fe638fbbada200c827e25f4147e4be401a30
