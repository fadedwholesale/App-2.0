const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - using anon key for client-side testing
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.5b24d03d5f55a43169d3c4b369ca412d38a3837aec7b5913179d6cb2464095d1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDriverAuth() {
  console.log('🧪 Testing driver app authentication flow...');
  
  try {
    // Test 1: Try to sign in with the real driver account
    console.log('\n📧 Testing login with cydiatools32@gmail.com...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'cydiatools32@gmail.com',
      password: 'test123456' // This is the password you need to provide
    });
    
    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      console.log('💡 The driver needs to use their actual password');
      console.log('💡 If they forgot their password, they can reset it in the app');
      return;
    }
    
    console.log('✅ Login successful!');
    console.log(`  - User ID: ${loginData.user.id}`);
    console.log(`  - Email: ${loginData.user.email}`);
    
    // Test 2: Load driver profile from database
    console.log('\n📋 Loading driver profile...');
    
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single();
    
    if (driverError) {
      console.error('❌ Failed to load driver profile:', driverError);
      console.log('💡 The driver profile may not exist in the database');
      return;
    }
    
    console.log('✅ Driver profile loaded:');
    console.log(`  - Driver ID: ${driverData.id}`);
    console.log(`  - Name: ${driverData.name}`);
    console.log(`  - Email: ${driverData.email}`);
    console.log(`  - Online: ${driverData.is_online}`);
    console.log(`  - Available: ${driverData.is_available}`);
    console.log(`  - Approved: ${driverData.is_approved}`);
    
    // Test 3: Update driver status
    console.log('\n🔄 Testing driver status update...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('drivers')
      .update({ 
        is_online: true, 
        is_available: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', loginData.user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Status update failed:', updateError);
      console.log('💡 This may be due to RLS policies');
    } else {
      console.log('✅ Status update successful:');
      console.log(`  - Online: ${updateData.is_online}`);
      console.log(`  - Available: ${updateData.is_available}`);
      console.log('🎉 The driver should now appear as online in the admin app!');
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDriverAuth();




