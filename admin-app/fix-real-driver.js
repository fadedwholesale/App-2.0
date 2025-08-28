const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRealDriver() {
  console.log('🔧 Fixing real driver account...');
  
  try {
    // Check all drivers in public.drivers
    console.log('📋 Checking public.drivers...');
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
    const targetDriver = drivers.find(d => d.email === targetEmail);
    
    console.log(`\n🎯 Checking specific account: ${targetEmail}`);
    
    if (targetDriver) {
      console.log('✅ Driver profile exists in public.drivers');
      console.log(`  - Driver ID: ${targetDriver.id}`);
      console.log(`  - User ID: ${targetDriver.user_id}`);
      console.log(`  - Online: ${targetDriver.is_online}`);
      console.log(`  - Available: ${targetDriver.is_available}`);
      console.log(`  - Approved: ${targetDriver.is_approved}`);
      
      // Update the driver to be online and available
      console.log('\n🔄 Updating driver status to online...');
      const { data: updateData, error: updateError } = await supabase
        .from('drivers')
        .update({ 
          is_online: true, 
          is_available: true,
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetDriver.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Status update failed:', updateError);
      } else {
        console.log('✅ Status update successful:', updateData);
        console.log('🎉 The driver should now appear as online in the admin app!');
      }
      
    } else {
      console.log('❌ Driver profile NOT found in public.drivers');
      console.log('💡 The driver account may not exist or may be using a different email');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixRealDriver();




