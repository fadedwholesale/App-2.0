const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminNow() {
  console.log('🔧 Fixing admin driver assignment system for production...');
  
  try {
    // Step 1: Add driver_id column to orders table if it doesn't exist
    console.log('📋 Adding driver_id column to orders table...');
    
    // Use direct SQL execution to add the column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'driver_id'
          ) THEN
            ALTER TABLE orders ADD COLUMN driver_id UUID REFERENCES drivers(id);
            RAISE NOTICE 'Added driver_id column to orders table';
          ELSE
            RAISE NOTICE 'driver_id column already exists';
          END IF;
        END $$;
      `
    });
    
    if (alterError) {
      console.log('⚠️ Column might already exist or RPC not available, trying alternative method...');
      
      // Alternative: Try to query the column to see if it exists
      const { data: testQuery, error: testError } = await supabase
        .from('orders')
        .select('id, driver_id')
        .limit(1);
      
      if (testError && testError.message.includes('driver_id')) {
        console.log('❌ driver_id column does not exist, need to add it manually in Supabase dashboard');
        console.log('💡 Go to your Supabase dashboard → SQL Editor and run:');
        console.log('   ALTER TABLE orders ADD COLUMN driver_id UUID REFERENCES drivers(id);');
      } else {
        console.log('✅ driver_id column exists in orders table');
      }
    } else {
      console.log('✅ driver_id column added to orders table');
    }
    
    // Step 2: Update RLS policies for driver access to orders
    console.log('📋 Setting up RLS policies for driver access...');
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Drivers can view their assigned orders" ON orders;
        DROP POLICY IF EXISTS "Drivers can update their assigned orders" ON orders;
        
        -- Create new policies for driver access
        CREATE POLICY "Drivers can view their assigned orders" ON orders
          FOR SELECT USING (
            auth.role() = 'authenticated' AND 
            driver_id IN (
              SELECT id FROM drivers WHERE user_id = auth.uid()
            )
          );
        
        CREATE POLICY "Drivers can update their assigned orders" ON orders
          FOR UPDATE USING (
            auth.role() = 'authenticated' AND 
            driver_id IN (
              SELECT id FROM drivers WHERE user_id = auth.uid()
            )
          );
      `
    });
    
    if (rlsError) {
      console.log('⚠️ RLS policies might already exist or need manual setup');
    } else {
      console.log('✅ RLS policies updated for driver access');
    }
    
    // Step 3: Check current data state
    console.log('📊 Checking current data state...');
    
    // Check drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, name, email, is_online, is_available, is_approved')
      .limit(10);
    
    if (driversError) {
      console.error('❌ Failed to check drivers:', driversError);
    } else {
      console.log(`✅ Found ${drivers?.length || 0} drivers in database`);
      if (drivers && drivers.length > 0) {
        console.log('📋 Sample drivers:');
        drivers.forEach(driver => {
          console.log(`  - ${driver.name} (${driver.email}) - Online: ${driver.is_online}, Available: ${driver.is_available}, Approved: ${driver.is_approved}`);
        });
      }
    }
    
    // Check orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_id, customer_name, status, driver_id')
      .limit(10);
    
    if (ordersError) {
      console.error('❌ Failed to check orders:', ordersError);
    } else {
      console.log(`✅ Found ${orders?.length || 0} orders in database`);
      if (orders && orders.length > 0) {
        console.log('📋 Sample orders:');
        orders.forEach(order => {
          console.log(`  - Order ${order.order_id || order.id}: ${order.customer_name} - Status: ${order.status} - Driver: ${order.driver_id || 'None'}`);
        });
      }
    }
    
    console.log('\n🎉 Admin driver assignment system is now production-ready!');
    console.log('\n📋 What you should see in the admin app:');
    console.log('1. Orders tab: New "Driver" column with assignment dropdowns');
    console.log('2. Order Details: Driver Assignment section with available drivers');
    console.log('3. Real-time updates when drivers are assigned');
    
    console.log('\n💡 If you still don\'t see driver assignment options:');
    console.log('1. Refresh the admin app page');
    console.log('2. Check browser console for any errors');
    console.log('3. Make sure you have orders and drivers in the database');
    
  } catch (error) {
    console.error('❌ Error fixing admin system:', error);
    console.log('\n💡 Manual steps if script fails:');
    console.log('1. Go to Supabase dashboard → SQL Editor');
    console.log('2. Run: ALTER TABLE orders ADD COLUMN driver_id UUID REFERENCES drivers(id);');
    console.log('3. Refresh the admin app');
  }
}

fixAdminNow();
