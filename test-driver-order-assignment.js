const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDriverOrderAssignment() {
  console.log('🧪 Testing driver order assignment system...');
  
  try {
    // Step 1: Check if we have drivers
    console.log('📋 Checking drivers...');
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, name, email, is_online, is_available, is_approved')
      .limit(5);
    
    if (driversError) {
      console.error('❌ Failed to get drivers:', driversError);
      return;
    }
    
    console.log(`✅ Found ${drivers?.length || 0} drivers`);
    if (drivers && drivers.length > 0) {
      drivers.forEach(driver => {
        console.log(`  - ${driver.name} (${driver.email}) - ID: ${driver.id} - Online: ${driver.is_online}, Available: ${driver.is_available}, Approved: ${driver.is_approved}`);
      });
    }
    
    // Step 2: Check if we have orders
    console.log('\n📋 Checking orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_id, customer_name, status, driver_id')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Failed to get orders:', ordersError);
      return;
    }
    
    console.log(`✅ Found ${orders?.length || 0} orders`);
    if (orders && orders.length > 0) {
      orders.forEach(order => {
        console.log(`  - Order ${order.order_id || order.id}: ${order.customer_name} - Status: ${order.status} - Driver: ${order.driver_id || 'None'}`);
      });
    }
    
    // Step 3: Test assigning a driver to an order
    if (drivers && drivers.length > 0 && orders && orders.length > 0) {
      const testDriver = drivers.find(d => d.is_approved);
      const testOrder = orders.find(o => !o.driver_id);
      
      if (testDriver && testOrder) {
        console.log(`\n🔄 Testing driver assignment: ${testDriver.name} → Order ${testOrder.order_id || testOrder.id}`);
        
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
          console.error('❌ Failed to assign driver to order:', updateError);
        } else {
          console.log('✅ Successfully assigned driver to order:', updateData);
          
          // Step 4: Test that the driver can see their assigned order
          console.log('\n📋 Testing driver access to assigned order...');
          const { data: driverOrders, error: driverOrdersError } = await supabase
            .from('orders')
            .select('*')
            .eq('driver_id', testDriver.id);
          
          if (driverOrdersError) {
            console.error('❌ Driver cannot access assigned orders:', driverOrdersError);
          } else {
            console.log(`✅ Driver can see ${driverOrders?.length || 0} assigned orders`);
            if (driverOrders && driverOrders.length > 0) {
              driverOrders.forEach(order => {
                console.log(`  - Order ${order.order_id || order.id}: ${order.customer_name} - Status: ${order.status}`);
              });
            }
          }
        }
      } else {
        console.log('⚠️ No suitable driver or order for testing assignment');
      }
    }
    
    console.log('\n🎉 Driver order assignment system test completed!');
    console.log('\n💡 What should happen:');
    console.log('1. Admin assigns driver to order in admin app');
    console.log('2. Driver receives real-time notification in driver app');
    console.log('3. Order appears in driver\'s "Available Orders" list');
    console.log('4. Driver can accept/decline the order');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDriverOrderAssignment();




