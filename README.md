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
