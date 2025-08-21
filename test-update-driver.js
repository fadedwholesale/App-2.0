import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDriverUpdate() {
  try {
    console.log('🧪 Testing driver status update...');
    
    // First, get the current driver
    const { data: drivers, error: fetchError } = await supabase
      .from('drivers')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching drivers:', fetchError);
      return;
    }
    
    if (drivers.length === 0) {
      console.log('⚠️ No drivers found to test with');
      return;
    }
    
    const driver = drivers[0];
    console.log('📋 Current driver status:', {
      id: driver.id,
      name: driver.name,
      is_online: driver.is_online,
      is_available: driver.is_available
    });
    
    // Update the driver to online
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update({ 
        is_online: true, 
        is_available: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', driver.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating driver:', updateError);
      return;
    }
    
    console.log('✅ Driver updated successfully:', {
      id: updatedDriver.id,
      name: updatedDriver.name,
      is_online: updatedDriver.is_online,
      is_available: updatedDriver.is_available,
      updated_at: updatedDriver.updated_at
    });
    
    console.log('🔄 Now check the admin app to see if it picks up this change in real-time!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDriverUpdate();
