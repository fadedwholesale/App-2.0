const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - using service role key for admin operations
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestData() {
  console.log('🔧 Creating test data for admin driver assignment...');
  
  try {
    // Step 1: Create test driver
    console.log('🚚 Creating test driver...');
    const { data: driver, error: driverError } = await supabase
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
    
    if (driverError) {
      console.error('❌ Failed to create test driver:', driverError);
      return;
    }
    
    console.log('✅ Test driver created:', driver);
    
    // Step 2: Create test order
    console.log('📦 Creating test order...');
    const { data: order, error: orderError } = await supabase
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
    
    if (orderError) {
      console.error('❌ Failed to create test order:', orderError);
      return;
    }
    
    console.log('✅ Test order created:', order);
    
    // Step 3: Show final state
    console.log('\n📊 Test data created successfully!');
    console.log('🚚 Test Driver:', driver.name, '- Online:', driver.is_online, '- Available:', driver.is_available);
    console.log('📦 Test Order:', order.order_id, '- Status:', order.status, '- Driver:', order.driver_id || 'None');
    
    console.log('\n💡 Now you can:');
    console.log('1. Go to the admin app');
    console.log('2. Navigate to Orders tab');
    console.log('3. You should see the test order with driver assignment options');
    console.log('4. Click "View Order Details" to see the full driver assignment interface');
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestData();




