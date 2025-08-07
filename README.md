# 🌿 Faded Skies Cannabis Delivery Platform

A comprehensive cannabis delivery platform with separate applications for customers, drivers, and administrators.

## 🚀 Quick Start

### Frontend (Currently Running)

The frontend is already running on **http://localhost:3000** and includes:

- **🌿 User App**: Customer interface for browsing products and placing orders
- **🚚 Driver App**: Driver interface for managing deliveries
- **📊 Admin Panel**: Administrative dashboard for managing the platform

You can switch between the three apps using the buttons in the top-right corner.

### Backend Setup

To enable full functionality, you need to start the backend server:

1. **Open a new terminal** and navigate to the project directory

2. **Start the backend server**:
   ```bash
   cd backend
   npm install          # Install dependencies
   npx prisma generate  # Generate Prisma client
   npm run dev         # Start backend on port 3001
   ```

3. **The backend will be available at**: http://localhost:3001

### Database Setup (Optional)

For full functionality, set up a PostgreSQL database:

1. **Install PostgreSQL** or use a cloud service
2. **Update the database URL** in `backend/.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/faded_skies_db"
   ```
3. **Run database migrations**:
   ```bash
   cd backend
   npx prisma db push
   ```

## 📱 Application Features

### Customer App (🌿 User App)
- Browse cannabis products by category
- Add items to cart and checkout
- Real-time order tracking
- User authentication and profiles
- Address management
- Order history

### Driver App (🚚 Driver App)
- Driver dashboard with earnings
- Available orders list
- Real-time navigation
- Order status updates
- Earnings tracking
- Driver schedule management

### Admin Panel (📊 Admin Panel)
- Real-time dashboard with metrics
- Order management
- Driver management
- Product inventory
- User management
- Analytics and reporting

## 🛠️ Technical Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Vite** for development server
- **Mapbox** for maps integration

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **Socket.IO** for real-time features
- **JWT** authentication
- **Winston** for logging

## 🔧 Configuration

### Environment Variables

**Frontend** (root `.env`):
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

**Backend** (`backend/.env`):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/faded_skies_db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
NODE_ENV=development
```

## 🚦 Development Workflow

1. **Frontend Development**: 
   - Frontend is already running on port 3000
   - Changes are automatically reflected
   - Proxy configured to forward API calls to backend

2. **Backend Development**:
   - Start backend with `cd backend && npm run dev`
   - Backend runs on port 3001
   - Automatic TypeScript compilation and restart

3. **Database Changes**:
   - Modify `backend/prisma/schema.prisma`
   - Run `npx prisma db push` to apply changes
   - Run `npx prisma generate` to update client

## 📦 Available Scripts

### Root Directory
```bash
npm run dev      # Start frontend (already running)
npm run build    # Build frontend for production
npm run preview  # Preview production build
```

### Backend Directory
```bash
npm run dev      # Start backend development server
npm run build    # Build backend for production
npm run start    # Start production backend
npm test         # Run tests
```

## 🗂️ Project Structure

```
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── UserApp.tsx    # Customer app
│   │   ├── DriverApp.tsx  # Driver app
│   │   └── AdminApp.tsx   # Admin panel
│   └── services/          # API and WebSocket services
├── backend/               # Backend source
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Utilities
│   └── prisma/            # Database schema
└── public/                # Static assets
```

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation
- Secure password hashing
- CORS protection

## 📱 Real-time Features

- Live order tracking
- Driver location updates
- Push notifications
- Order status changes
- Admin dashboard updates

## 🌟 Current Status

✅ **Frontend**: Running and fully functional  
⚠️ **Backend**: Ready to start (needs manual startup)  
⚠️ **Database**: Requires PostgreSQL setup  
✅ **Proxy**: Configured and ready  

## 🚨 Quick Fix for Full Functionality

Run this command in a new terminal to start the backend:

```bash
cd backend && npm install && npx prisma generate && npm run dev
```

Once the backend starts, all API calls from the frontend will work seamlessly!

## 📞 Support

For issues or questions:
1. Check the console for any error messages
2. Ensure both frontend (port 3000) and backend (port 3001) are running
3. Verify database connection if using persistent storage

---

**Happy coding! 🌿✨**
