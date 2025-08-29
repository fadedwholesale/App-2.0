# 🚀 Quick Location Tracking Setup

## 📋 **Manual SQL Execution Required**

Since the automated script failed due to network issues, please run this SQL manually in your Supabase dashboard.

### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar

### **Step 2: Run the SQL Script**
1. Copy the entire contents of `LOCATION_SETUP_SQL.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute

### **Step 3: Verify Setup**
After running the SQL, you should see:
- ✅ `current_location` column added to `drivers` table
- ✅ `location_updated_at` column added to `drivers` table
- ✅ RLS policies updated for location tracking
- ✅ Index created for location queries

### **What This Enables:**
- 🚗 **Drivers can update their location** in real-time
- 👨‍💼 **Admins can view driver locations** on the map
- 📍 **Live tracking** for order routing
- 🔄 **Real-time updates** when drivers move

### **Next Steps:**
1. After running the SQL, go back to the admin portal
2. Have a driver go online in the iOS app
3. Check the map to see the driver's location marker
4. Drivers should now appear as green markers when online

**This will fix the issue where drivers aren't showing up on the admin map!**
