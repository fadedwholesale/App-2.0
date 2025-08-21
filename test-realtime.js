import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRealtimeUpdates() {
  try {
    console.log('🧪 Testing real-time driver status updates...');
    
    // Get current driver
    const { data: drivers, error: fetchError } = await supabase
      .from('drivers')
      .select('*')
      .limit(1);
    
    if (fetchError || drivers.length === 0) {
      console.error('❌ No drivers found');
      return;
    }
    
    const driver = drivers[0];
    console.log('📋 Current driver status:', {
      id: driver.id,
      name: driver.name,
      is_online: driver.is_online,
      is_available: driver.is_available
    });
    
    // Toggle the online status
    const newOnlineStatus = !driver.is_online;
    const newAvailableStatus = newOnlineStatus;
    
    console.log(`🔄 Toggling driver status to: Online=${newOnlineStatus}, Available=${newAvailableStatus}`);
    
    // Update the driver status
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update({ 
        is_online: newOnlineStatus, 
        is_available: newAvailableStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', driver.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating driver:', updateError);
      return;
    }
    
    console.log('✅ Driver status updated successfully:', {
      id: updatedDriver.id,
      name: updatedDriver.name,
      is_online: updatedDriver.is_online,
      is_available: updatedDriver.is_available,
      updated_at: updatedDriver.updated_at
    });
    
    console.log('🔄 This should trigger a real-time update in the admin app!');
    console.log('📱 Check the admin app browser console for real-time subscription logs.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRealtimeUpdates();
