# Supabase Setup for Faded Skies Cannabis Delivery

## 🚀 Overview

This project now uses Supabase as the backend database and authentication service, replacing Firebase. Supabase provides:

- **PostgreSQL Database** - Relational database with real-time subscriptions
- **Authentication** - Built-in auth with JWT tokens
- **Row Level Security** - Fine-grained access control
- **Real-time Subscriptions** - Live updates across all apps
- **Auto-generated APIs** - RESTful API endpoints

## 📊 Database Schema

### Tables

1. **users** - Customer accounts and profiles
2. **products** - Cannabis products catalog
3. **drivers** - Driver accounts and status
4. **orders** - Order management and tracking

### Relationships

- `orders.user_id` → `users.id`
- `orders.driver_id` → `drivers.id`

## 🔧 Setup Instructions

### 1. Supabase Project Configuration

**Project URL:** `https://hdqbnhtimuynuypwouwf.supabase.co`
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ`

### 2. Database Setup

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the `supabase-schema.sql` file to create:
   - All tables with proper relationships
   - Row Level Security policies
   - Sample product data
   - Performance indexes

### 3. Authentication Setup

1. Go to **Authentication > Settings**
2. Configure your site URL and redirect URLs
3. Set up email templates if needed

### 4. Real-time Setup

1. Go to **Database > Replication**
2. Enable real-time for all tables:
   - `users`
   - `products`
   - `drivers`
   - `orders`

## 📱 App Integration

### User App (`user-app/`)

**Features:**
- User authentication (signup/login)
- Product browsing
- Order placement and tracking
- Real-time order updates

**Key Files:**
- `src/lib/supabase.ts` - Client configuration
- `src/services/supabase-service.ts` - User-specific operations

### Driver App (`driver-app/`)

**Features:**
- Driver authentication
- Order acceptance and management
- Location tracking
- Earnings tracking

**Key Files:**
- `src/lib/supabase.ts` - Client configuration
- `src/services/supabase-service.ts` - Driver-specific operations

### Admin App (`admin-app/`)

**Features:**
- Admin authentication
- User management
- Product management
- Order management
- Driver management
- Analytics and reporting

**Key Files:**
- `src/lib/supabase.ts` - Client configuration
- `src/services/supabase-service.ts` - Admin-specific operations

## 🔐 Security Policies

### Row Level Security (RLS)

**Users:**
- Can view/update own profile only
- Can create own profile

**Products:**
- Anyone can view active products
- Only admins can manage products

**Drivers:**
- Can view/update own profile only
- Admins can manage all drivers

**Orders:**
- Users can view/create own orders
- Drivers can view assigned orders
- Admins can manage all orders

## 🔄 Real-time Communication

### Subscription Channels

1. **User Orders:** `orders` table filtered by `user_id`
2. **Driver Orders:** `orders` table filtered by `driver_id`
3. **Available Orders:** `orders` table filtered by `status = 'confirmed'`
4. **Admin Dashboard:** All tables for real-time updates

### Example Usage

```typescript
// Subscribe to user's orders
supabase
  .channel('user-orders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Order updated:', payload.new)
  })
  .subscribe()
```

## 🚀 Deployment

### Environment Variables

Each app needs these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hdqbnhtimuynuypwouwf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ
```

### Build and Deploy

```bash
# User App
cd user-app
npm run build
# Deploy to your hosting platform

# Driver App
cd driver-app
npm run build
# Deploy to your hosting platform

# Admin App
cd admin-app
npm run build
# Deploy to your hosting platform
```

## 📊 Monitoring

### Supabase Dashboard

Monitor your app through the Supabase dashboard:

1. **Database** - View tables, run queries, monitor performance
2. **Authentication** - User management and auth logs
3. **Logs** - API request logs and errors
4. **Storage** - File storage (if needed)
5. **Edge Functions** - Serverless functions (if needed)

### Key Metrics

- **Active Users** - Authentication logs
- **Order Volume** - Orders table analytics
- **Driver Activity** - Driver status tracking
- **Product Performance** - Product sales analytics

## 🔧 Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Check user authentication status
   - Verify policy conditions
   - Test with admin role

2. **Real-time Not Working**
   - Enable real-time in Supabase dashboard
   - Check subscription filters
   - Verify channel names

3. **Authentication Issues**
   - Check redirect URLs
   - Verify JWT token expiration
   - Test with different user roles

### Support

- **Supabase Docs:** https://supabase.com/docs
- **Community:** https://github.com/supabase/supabase/discussions
- **Discord:** https://discord.supabase.com

## 🎯 Next Steps

1. **Set up the database schema** using the provided SQL
2. **Configure authentication** in Supabase dashboard
3. **Test real-time subscriptions** in each app
4. **Deploy to production** with proper environment variables
5. **Monitor performance** through Supabase dashboard
