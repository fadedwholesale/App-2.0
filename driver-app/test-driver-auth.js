import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDriverAuthentication() {
  try {
    console.log('🧪 Testing complete driver authentication flow...');
    
    // Step 1: Try to read drivers without authentication (should fail due to RLS)
    console.log('📋 Testing unauthenticated access...');
    const { data: unauthenticatedDrivers, error: unauthenticatedError } = await supabase
      .from('drivers')
      .select('*');
    
    if (unauthenticatedError) {
      console.log('✅ Expected error for unauthenticated access:', unauthenticatedError.message);
    } else {
      console.log('⚠️ Unexpected: Can access drivers without authentication');
    }
    
    // Step 2: Try to authenticate with the existing driver
    console.log('🔐 Testing driver authentication...');
    console.log('📧 Attempting login with: testdriver@example.com');
    
    // Test with the new test driver account
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'testdriver@example.com',
      password: 'test123456'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      console.log('💡 This is expected if the password is wrong');
      console.log('💡 The driver app will need the correct password to authenticate');
      return;
    }

    console.log('✅ Authentication successful:', authData.user.email);
    
    // Step 3: Now try to read drivers (should work when authenticated)
    console.log('📋 Testing authenticated access to drivers...');
    const { data: authenticatedDrivers, error: authenticatedError } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', authData.user.id);
    
    if (authenticatedError) {
      console.error('❌ Cannot access drivers even when authenticated:', authenticatedError);
      return;
    }
    
    console.log('✅ Can access drivers when authenticated, found:', authenticatedDrivers.length);
    
    if (authenticatedDrivers.length > 0) {
      const driver = authenticatedDrivers[0];
      console.log('📋 Driver profile:', {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        is_online: driver.is_online,
        is_available: driver.is_available
      });
      
      // Step 4: Test updating driver status (simulating toggleOnlineStatus)
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
        is_available: updatedDriver.is_available,
        updated_at: updatedDriver.updated_at
      });
      
      console.log('🎉 Driver authentication and status update test PASSED!');
      console.log('🔄 This should trigger a real-time update in the admin app!');
      
    } else {
      console.log('⚠️ No driver profile found for authenticated user');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDriverAuthentication();
