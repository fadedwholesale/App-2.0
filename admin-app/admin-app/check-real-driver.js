const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRealDriver() {
  console.log('🔍 Checking real driver account status...');
  
  try {
    // Check all users in auth
    console.log('📋 Checking auth.users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`✅ Found ${users.users.length} users in auth:`);
    users.users.forEach(user => {
      console.log(`  - ${user.email} (${user.id}) - Created: ${user.created_at}`);
    });
    
    // Check all drivers in public.drivers
    console.log('\n📋 Checking public.drivers...');
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*');
    
    if (driversError) {
      console.error('❌ Error fetching drivers:', driversError);
      return;
    }
    
    console.log(`✅ Found ${drivers.length} drivers in database:`);
    drivers.forEach(driver => {
      console.log(`  - ${driver.name} (${driver.email}) - Online: ${driver.is_online}, Available: ${driver.is_available}, Approved: ${driver.is_approved}`);
    });
    
    // Look specifically for cydiatools32@gmail.com
    const targetEmail = 'cydiatools32@gmail.com';
    const targetUser = users.users.find(u => u.email === targetEmail);
    const targetDriver = drivers.find(d => d.email === targetEmail);
    
    console.log(`\n🎯 Checking specific account: ${targetEmail}`);
    
    if (targetUser) {
      console.log('✅ User exists in auth.users');
      console.log(`  - ID: ${targetUser.id}`);
      console.log(`  - Created: ${targetUser.created_at}`);
      console.log(`  - Confirmed: ${targetUser.email_confirmed_at ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ User NOT found in auth.users');
    }
    
    if (targetDriver) {
      console.log('✅ Driver profile exists in public.drivers');
      console.log(`  - Driver ID: ${targetDriver.id}`);
      console.log(`  - User ID: ${targetDriver.user_id}`);
      console.log(`  - Online: ${targetDriver.is_online}`);
      console.log(`  - Available: ${targetDriver.is_available}`);
      console.log(`  - Approved: ${targetDriver.is_approved}`);
    } else {
      console.log('❌ Driver profile NOT found in public.drivers');
      
      // If user exists but no driver profile, create one
      if (targetUser) {
        console.log('🔧 Creating missing driver profile...');
        const { data: newDriver, error: createError } = await supabase
          .from('drivers')
          .insert([{
            user_id: targetUser.id,
            name: 'Jackeline Carrillo',
            email: targetEmail,
            phone: '',
            license_number: '',
            vehicle_make: '',
            vehicle_model: '',
            vehicle_year: null,
            vehicle_color: '',
            license_plate: '',
            is_online: false,
            is_available: false,
            is_approved: true,
            rating: 5.0,
            total_deliveries: 0
          }])
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Failed to create driver profile:', createError);
        } else {
          console.log('✅ Driver profile created successfully:', newDriver);
        }
      }
    }
    
    // Test the real driver login
    console.log('\n🧪 Testing real driver login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password: 'test123456' // You'll need to provide the actual password
    });
    
    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
      console.log('💡 The driver may need to reset their password or use a different password');
    } else {
      console.log('✅ Login successful!');
      console.log(`  - User ID: ${loginData.user.id}`);
      
      // Test status update
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
      } else {
        console.log('✅ Status update successful:', updateData);
      }
      
      // Sign out
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRealDriver();




