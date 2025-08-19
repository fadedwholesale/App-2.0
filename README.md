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
