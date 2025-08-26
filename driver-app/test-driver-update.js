import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDriverLoginAndUpdate() {
  try {
    console.log('🧪 Testing driver login and status update...');
    
    // Step 1: Login as driver (simulating driver app)
    console.log('🔐 Attempting driver login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'cydiatools32@gmail.com',
      password: 'password123' // You'll need to use the actual password
    });

    if (authError) {
      console.error('❌ Login failed:', authError);
      return;
    }

    console.log('✅ Login successful:', authData.user.email);
    
    // Step 2: Load driver profile
    console.log('📋 Loading driver profile...');
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (driverError) {
      console.error('❌ Failed to load driver profile:', driverError);
      return;
    }

    console.log('✅ Driver profile loaded:', {
      id: driverData.id,
      name: driverData.name,
      is_online: driverData.is_online,
      is_available: driverData.is_available
    });
    
    // Step 3: Update online status (simulating toggleOnlineStatus)
    console.log('🔄 Updating online status...');
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update({ 
        is_online: true, 
        is_available: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', driverData.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update driver status:', updateError);
      return;
    }

    console.log('✅ Driver status updated successfully:', {
      id: updatedDriver.id,
      name: updatedDriver.name,
      is_online: updatedDriver.is_online,
      is_available: updatedDriver.is_available,
      updated_at: updatedDriver.updated_at
    });
    
    console.log('🔄 Now check the admin app to see if it picks up this change!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDriverLoginAndUpdate();




