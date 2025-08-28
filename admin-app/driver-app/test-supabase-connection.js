import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDriverConnection() {
  try {
    console.log('🧪 Testing driver app Supabase connection...');
    
    // Test 1: Check if we can read drivers table
    console.log('📋 Testing drivers table access...');
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .limit(1);
    
    if (driversError) {
      console.error('❌ Cannot access drivers table:', driversError);
      return;
    }
    
    console.log('✅ Can access drivers table, found', drivers.length, 'drivers');
    
    if (drivers.length > 0) {
      const driver = drivers[0];
      console.log('📋 Sample driver:', {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        is_online: driver.is_online,
        is_available: driver.is_available
      });
      
      // Test 2: Try to update the driver status (simulating toggleOnlineStatus)
      console.log('🔄 Testing driver status update...');
      const { data: updatedDriver, error: updateError } = await supabase
        .from('drivers')
        .update({ 
          is_online: !driver.is_online, 
          is_available: !driver.is_available,
          updated_at: new Date().toISOString()
        })
        .eq('id', driver.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Cannot update driver status:', updateError);
        return;
      }
      
      console.log('✅ Successfully updated driver status:', {
        id: updatedDriver.id,
        name: updatedDriver.name,
        is_online: updatedDriver.is_online,
        is_available: updatedDriver.is_available
      });
      
      // Test 3: Test authentication (if we have credentials)
      console.log('🔐 Testing authentication...');
      console.log('⚠️ Note: This requires valid driver credentials');
      console.log('📧 Try logging in with: cydiatools32@gmail.com');
      
    } else {
      console.log('⚠️ No drivers found in database');
    }
    
    console.log('✅ Supabase connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Supabase connection:', error);
  }
}

testDriverConnection();




