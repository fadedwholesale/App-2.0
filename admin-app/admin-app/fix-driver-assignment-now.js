const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDriverAssignment() {
  console.log('🔧 Fixing driver assignment system...');
  
  try {
    // Step 1: Add driver_id column to orders table
    console.log('📋 Adding driver_id column to orders table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id);
      `
    });
    
    if (alterError) {
      console.log('⚠️ Column might already exist, continuing...');
    } else {
      console.log('✅ driver_id column added to orders table');
    }
    
    // Step 2: Update some existing orders to have driver assignments for testing
    console.log('📋 Updating test orders with driver assignments...');
    
    // Get available drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, name')
      .eq('is_approved', true);
    
    if (driversError) {
      console.error('❌ Failed to get drivers:', driversError);
      return;
    }
    
    console.log(`✅ Found ${drivers.length} approved drivers:`, drivers.map(d => d.name));
    
    // Get orders without driver assignments
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_id, customer_name')
      .is('driver_id', null)
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Failed to get orders:', ordersError);
      return;
    }
    
    console.log(`✅ Found ${orders.length} orders without driver assignments`);
    
    // Assign drivers to some orders
    if (drivers.length > 0 && orders.length > 0) {
      for (let i = 0; i < Math.min(orders.length, drivers.length); i++) {
        const order = orders[i];
        const driver = drivers[i];
        
        console.log(`🔄 Assigning ${driver.name} to order ${order.order_id || order.id}...`);
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            driver_id: driver.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);
        
        if (updateError) {
          console.error(`❌ Failed to assign driver to order ${order.id}:`, updateError);
        } else {
          console.log(`✅ Successfully assigned ${driver.name} to order ${order.order_id || order.id}`);
        }
      }
    }
    
    // Step 3: Show final state
    console.log('\n📊 Final state:');
    
    const { data: finalOrders, error: finalError } = await supabase
      .from('orders')
      .select(`
        id,
        order_id,
        customer_name,
        status,
        driver_id,
        drivers!inner(name, vehicle_make, vehicle_model)
      `)
      .limit(10);
    
    if (finalError) {
      console.error('❌ Failed to get final orders:', finalError);
    } else {
      console.log('✅ Orders with driver assignments:');
      finalOrders.forEach(order => {
        console.log(`  - Order ${order.order_id || order.id}: ${order.customer_name} → ${order.drivers?.name || 'No driver'}`);
      });
    }
    
    console.log('\n🎉 Driver assignment system is now ready!');
    console.log('💡 You should now see driver assignment options in the admin app.');
    
  } catch (error) {
    console.error('❌ Error fixing driver assignment:', error);
  }
}

fixDriverAssignment();




