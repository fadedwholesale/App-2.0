# Database Setup Guide for Driver Tracking & Admin Dispatch

## 🚀 Quick Setup

### 1. Run the Complete Setup Script

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the contents of `setup-complete-tracking-system.sql`**
4. **Click "Run"**

### 2. Verify Setup

After running the script, you should see:
```
✅ Driver tracking system setup complete!
📍 driver_locations_count: 0
🚚 online_drivers: 0
```

## 📊 Database Structure

### Tables Created/Updated:

1. **`driver_locations`** - Stores real-time GPS coordinates
2. **`drivers`** - Updated with `current_order_id` column
3. **Views** - `real_time_driver_tracking`, `admin_dispatch_view`
4. **Functions** - `insert_driver_location`, `get_driver_latest_location`, `get_online_drivers_locations`
5. **Triggers** - Auto-updates `drivers.current_location` when new GPS data arrives

### Real-time Features:

- ✅ **Live GPS tracking** - Every 0.5-2 seconds
- ✅ **Admin dispatch view** - Real-time driver locations
- ✅ **Order tracking** - Live delivery status updates
- ✅ **Geofencing** - Delivery zone detection
- ✅ **Pay calculation** - Real-time earnings tracking

## 🔧 Testing the System

### 1. Test Database Connection

```bash
# Install dependencies if needed
npm install @supabase/supabase-js

# Run the test script
node test-database-connection.js
```

### 2. Expected Test Results

```
✅ driver_locations table accessible
✅ real_time_driver_tracking view accessible
✅ admin_dispatch_view accessible
✅ drivers table accessible
✅ orders table accessible
✅ RPC functions accessible
```

## 🚚 Driver App Integration

### GPS Tracking Flow:

1. **Driver goes online** → `startContinuousGPSTracking()`
2. **GPS coordinates received** → `forceUpdateDriverLocation()`
3. **Database updated** → `driver_locations` table + `drivers.current_location`
4. **Admin notified** → Real-time subscription updates
5. **Map updated** → Live driver positions

### Key Functions:

- `startContinuousGPSTracking()` - Starts live GPS tracking
- `forceUpdateDriverLocation()` - Updates database with GPS coordinates
- `refreshDriverLocationFromDatabase()` - Disabled to prevent old data override

## 🎯 Admin App Integration

### Real-time Updates:

1. **Driver locations** → `real_time_driver_tracking` view
2. **Order status** → `orders` table subscriptions
3. **Dispatch data** → `admin_dispatch_view`
4. **Map updates** → Live driver markers

### Key Features:

- **Live driver tracking** on map
- **Real-time order status** updates
- **Dispatch optimization** with Mapbox
- **Delivery progress** monitoring

## 🔍 Troubleshooting

### Common Issues:

1. **"driver_locations table does not exist"**
   - Run the setup script again
   - Check Supabase permissions

2. **"Real-time not working"**
   - Verify `supabase_realtime` publication includes `driver_locations`
   - Check RLS policies

3. **"GPS coordinates not updating"**
   - Check iOS Simulator location settings
   - Verify GPS permissions in browser
   - Check database connection

4. **"Admin map not showing drivers"**
   - Verify `real_time_driver_tracking` view exists
   - Check driver `is_online` status
   - Verify Mapbox token is valid

### Debug Commands:

```sql
-- Check if driver_locations table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'driver_locations'
);

-- Check online drivers
SELECT * FROM drivers WHERE is_online = true;

-- Check latest locations
SELECT * FROM driver_locations ORDER BY location_timestamp DESC LIMIT 5;

-- Check real-time tracking view
SELECT * FROM real_time_driver_tracking;
```

## 🎯 Production Checklist

- [ ] Database setup script executed successfully
- [ ] All tables and views created
- [ ] RLS policies configured
- [ ] Real-time subscriptions enabled
- [ ] GPS tracking working in driver app
- [ ] Admin map showing live drivers
- [ ] Order status updates working
- [ ] Pay calculation system active
- [ ] Geofencing functional
- [ ] Error handling implemented

## 📞 Support

If you encounter issues:

1. **Check the logs** in browser console
2. **Verify database setup** with test script
3. **Test GPS permissions** in iOS Simulator
4. **Check Supabase dashboard** for errors
5. **Verify environment variables** are set correctly

---

**The database is now ready for production driver tracking and admin dispatch!** 🚀



