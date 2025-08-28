const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - using anon key for client-side testing
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.5b24d03d5f55a43169d3c4b369ca412d38a3837aec7b5913179d6cb2464095d1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminDriverAssignment() {
  console.log('🧪 Testing admin driver assignment functionality...');
  
  try {
    // Test 1: Check if we can see drivers
    console.log('\n📋 Checking drivers...');
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*');
    
    if (driversError) {
      console.error('❌ Failed to get drivers:', driversError);
    } else {
      console.log(`✅ Found ${drivers.length} drivers:`);
      drivers.forEach(driver => {
        console.log(`  - ${driver.name} (${driver.email}) - Online: ${driver.is_online}, Available: ${driver.is_available}, Approved: ${driver.is_approved}`);
      });
    }
    
    // Test 2: Check if we can see orders
    console.log('\n📋 Checking orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*');
    
    if (ordersError) {
      console.error('❌ Failed to get orders:', ordersError);
    } else {
      console.log(`✅ Found ${orders.length} orders:`);
      orders.forEach(order => {
        console.log(`  - Order ${order.order_id || order.id}: ${order.customer_name} - Status: ${order.status} - Driver: ${order.driver_id || 'None'}`);
      });
    }
    
    // Test 3: Check if driver_id column exists
    console.log('\n📋 Checking orders table structure...');
    const { data: orderColumns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'orders' });
    
    if (columnsError) {
      console.log('⚠️ Could not check table structure directly');
      // Try a different approach - check if we can query driver_id
      const { data: testOrder, error: testError } = await supabase
        .from('orders')
        .select('id, driver_id')
        .limit(1);
      
      if (testError) {
        console.error('❌ driver_id column does not exist:', testError.message);
        console.log('💡 Need to add driver_id column to orders table');
      } else {
        console.log('✅ driver_id column exists in orders table');
      }
    } else {
      console.log('✅ Orders table columns:', orderColumns);
    }
    
    // Test 4: Try to assign a driver to an order
    if (drivers && drivers.length > 0 && orders && orders.length > 0) {
      console.log('\n🔄 Testing driver assignment...');
      
      const testDriver = drivers.find(d => d.is_approved);
      const testOrder = orders.find(o => !o.driver_id);
      
      if (testDriver && testOrder) {
        console.log(`🔄 Assigning ${testDriver.name} to order ${testOrder.order_id || testOrder.id}...`);
        
        const { data: updateData, error: updateError } = await supabase
          .from('orders')
          .update({ 
            driver_id: testDriver.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', testOrder.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Failed to assign driver:', updateError);
        } else {
          console.log('✅ Successfully assigned driver to order:', updateData);
        }
      } else {
        console.log('⚠️ No suitable driver or order for testing assignment');
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`  - Drivers: ${drivers?.length || 0}`);
    console.log(`  - Orders: ${orders?.length || 0}`);
    console.log(`  - Orders with drivers: ${orders?.filter(o => o.driver_id).length || 0}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminDriverAssignment();




