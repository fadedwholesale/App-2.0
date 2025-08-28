// Test Database Connection and Driver Tracking System
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Check if driver_locations table exists
    console.log('\n1. Testing driver_locations table...');
    const { data: locationsData, error: locationsError } = await supabase
      .from('driver_locations')
      .select('*')
      .limit(1);
    
    if (locationsError) {
      console.error('❌ driver_locations table error:', locationsError);
    } else {
      console.log('✅ driver_locations table accessible');
      console.log('📍 Current locations count:', locationsData?.length || 0);
    }

    // Test 2: Check if real_time_driver_tracking view exists
    console.log('\n2. Testing real_time_driver_tracking view...');
    const { data: trackingData, error: trackingError } = await supabase
      .from('real_time_driver_tracking')
      .select('*')
      .limit(5);
    
    if (trackingError) {
      console.error('❌ real_time_driver_tracking view error:', trackingError);
    } else {
      console.log('✅ real_time_driver_tracking view accessible');
      console.log('🚚 Online drivers:', trackingData?.length || 0);
      if (trackingData && trackingData.length > 0) {
        console.log('📍 Sample driver data:', {
          id: trackingData[0].id,
          name: trackingData[0].name,
          is_online: trackingData[0].is_online,
          lat: trackingData[0].lat,
          lng: trackingData[0].lng,
          location_timestamp: trackingData[0].location_timestamp
        });
      }
    }

    // Test 3: Check if admin_dispatch_view exists
    console.log('\n3. Testing admin_dispatch_view...');
    const { data: dispatchData, error: dispatchError } = await supabase
      .from('admin_dispatch_view')
      .select('*')
      .limit(5);
    
    if (dispatchError) {
      console.error('❌ admin_dispatch_view error:', dispatchError);
    } else {
      console.log('✅ admin_dispatch_view accessible');
      console.log('🚚 Dispatch data count:', dispatchData?.length || 0);
    }

    // Test 4: Check drivers table
    console.log('\n4. Testing drivers table...');
    const { data: driversData, error: driversError } = await supabase
      .from('drivers')
      .select('id, name, is_online, is_available, current_location, location_updated_at')
      .limit(5);
    
    if (driversError) {
      console.error('❌ drivers table error:', driversError);
    } else {
      console.log('✅ drivers table accessible');
      console.log('🚚 Total drivers:', driversData?.length || 0);
      console.log('🚚 Online drivers:', driversData?.filter(d => d.is_online).length || 0);
      if (driversData && driversData.length > 0) {
        console.log('📍 Sample driver:', {
          id: driversData[0].id,
          name: driversData[0].name,
          is_online: driversData[0].is_online,
          current_location: driversData[0].current_location
        });
      }
    }

    // Test 5: Check orders table
    console.log('\n5. Testing orders table...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, driver_id, delivery_lat, delivery_lng')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ orders table error:', ordersError);
    } else {
      console.log('✅ orders table accessible');
      console.log('📦 Total orders:', ordersData?.length || 0);
      console.log('📦 Assigned orders:', ordersData?.filter(o => o.driver_id).length || 0);
    }

    // Test 6: Test RPC function
    console.log('\n6. Testing RPC functions...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_online_drivers_locations');
    
    if (rpcError) {
      console.error('❌ RPC function error:', rpcError);
    } else {
      console.log('✅ RPC functions accessible');
      console.log('🚚 Online drivers with locations:', rpcData?.length || 0);
    }

    console.log('\n✅ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
}

// Run the test
testDatabaseConnection();



