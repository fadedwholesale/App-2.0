const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseForDriverAssignment() {
  console.log('🔧 Fixing database for driver assignment...');
  
  try {
    // Step 1: Check if driver_id column exists in orders table
    console.log('📋 Checking orders table structure...');
    
    // Try to query driver_id to see if it exists
    const { data: testOrder, error: testError } = await supabase
      .from('orders')
      .select('id, driver_id')
      .limit(1);
    
    if (testError && testError.message.includes('driver_id')) {
      console.log('❌ driver_id column does not exist in orders table');
      console.log('💡 Need to add driver_id column manually in Supabase dashboard');
      console.log('💡 Run this SQL in Supabase SQL Editor:');
      console.log('   ALTER TABLE orders ADD COLUMN driver_id UUID REFERENCES drivers(id);');
      return;
    } else {
      console.log('✅ driver_id column exists in orders table');
    }
    
    // Step 2: Create test driver if none exist
    console.log('🚚 Checking for drivers...');
    const { data: existingDrivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, name, email, is_online, is_available, is_approved')
      .limit(5);
    
    if (driversError) {
      console.error('❌ Failed to check drivers:', driversError);
      return;
    }
    
    console.log(`✅ Found ${existingDrivers?.length || 0} drivers`);
    
    if (!existingDrivers || existingDrivers.length === 0) {
      console.log('🚚 Creating test driver...');
      const { data: newDriver, error: createDriverError } = await supabase
        .from('drivers')
        .insert([{
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder
          name: 'Test Driver',
          email: 'testdriver@example.com',
          phone: '555-1234',
          license_number: 'DL123456',
          vehicle_make: 'Toyota',
          vehicle_model: 'Camry',
          vehicle_year: 2020,
          vehicle_color: 'Silver',
          license_plate: 'ABC123',
          is_online: true,
          is_available: true,
          is_approved: true,
          rating: 4.8,
          total_deliveries: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createDriverError) {
        console.error('❌ Failed to create test driver:', createDriverError);
      } else {
        console.log('✅ Test driver created:', newDriver.name);
      }
    } else {
      console.log('📋 Existing drivers:');
      existingDrivers.forEach(driver => {
        console.log(`  - ${driver.name} (${driver.email}) - Online: ${driver.is_online}, Available: ${driver.is_available}, Approved: ${driver.is_approved}`);
      });
    }
    
    // Step 3: Create test order if none exist
    console.log('📦 Checking for orders...');
    const { data: existingOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_id, customer_name, status, driver_id')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ Failed to check orders:', ordersError);
      return;
    }
    
    console.log(`✅ Found ${existingOrders?.length || 0} orders`);
    
    if (!existingOrders || existingOrders.length === 0) {
      console.log('📦 Creating test order...');
      const { data: newOrder, error: createOrderError } = await supabase
        .from('orders')
        .insert([{
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder
          order_id: `TEST-${Date.now()}`,
          customer_name: 'Test Customer',
          customer_phone: '555-5678',
          address: '123 Test Street, Austin, TX 78701',
          items: [
            { name: 'Test Product 1', quantity: 2, price: 25.00 },
            { name: 'Test Product 2', quantity: 1, price: 15.00 }
          ],
          total: 65.00,
          status: 'pending',
          driver_id: null, // Will be assigned by admin
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createOrderError) {
        console.error('❌ Failed to create test order:', createOrderError);
      } else {
        console.log('✅ Test order created:', newOrder.order_id);
      }
    } else {
      console.log('📋 Existing orders:');
      existingOrders.forEach(order => {
        console.log(`  - Order ${order.order_id || order.id}: ${order.customer_name} - Status: ${order.status} - Driver: ${order.driver_id || 'None'}`);
      });
    }
    
    // Step 4: Test driver assignment
    if (existingDrivers && existingDrivers.length > 0 && existingOrders && existingOrders.length > 0) {
      const testDriver = existingDrivers.find(d => d.is_approved);
      const testOrder = existingOrders.find(o => !o.driver_id);
      
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
        }
      }
    }
    
    console.log('\n🎉 Database is ready for driver assignment!');
    console.log('\n💡 What you should see in the admin app:');
    console.log('1. Orders tab with "Driver" column');
    console.log('2. "Auto-Assign Drivers" button');
    console.log('3. Driver assignment dropdowns in each order row');
    console.log('4. Order Details modal with Driver Assignment section');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  }
}

fixDatabaseForDriverAssignment();




