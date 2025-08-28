import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestDriver() {
  try {
    console.log('🧪 Creating test driver account...');
    
    // Create a test driver account
    const testDriver = {
      email: 'testdriver@example.com',
      password: 'test123456',
      name: 'Test Driver',
      phone: '555-1234',
      license_number: 'TEST123'
    };
    
    console.log('📧 Creating account for:', testDriver.email);
    
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testDriver.email,
      password: testDriver.password,
      email_confirm: true,
      user_metadata: {
        name: testDriver.name,
        role: 'driver'
      }
    });

    if (authError) {
      console.error('❌ Failed to create auth user:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user.email);
    
    // Step 2: Create driver profile
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .insert([{
        user_id: authData.user.id,
        name: testDriver.name,
        email: testDriver.email,
        phone: testDriver.phone,
        license_number: testDriver.license_number,
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        vehicle_year: 2020,
        vehicle_color: 'Silver',
        license_plate: 'TEST123',
        is_online: false,
        is_available: false,
        is_approved: true,
        rating: 5.0,
        total_deliveries: 0
      }])
      .select()
      .single();

    if (driverError) {
      console.error('❌ Failed to create driver profile:', driverError);
      return;
    }

    console.log('✅ Driver profile created:', {
      id: driverData.id,
      name: driverData.name,
      email: driverData.email,
      is_approved: driverData.is_approved
    });
    
    console.log('🎉 Test driver account created successfully!');
    console.log('📋 Login credentials:');
    console.log('   Email:', testDriver.email);
    console.log('   Password:', testDriver.password);
    console.log('💡 Use these credentials in the driver app to test the online status functionality!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestDriver();




