const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDriverStatus() {
  try {
    console.log('🔍 Checking driver status in database...');
    
    // Check drivers table structure
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching drivers:', error);
      return;
    }
    
    console.log('📊 Total drivers found:', drivers.length);
    
    if (drivers.length > 0) {
      console.log('📋 Sample driver data:', drivers[0]);
      console.log('🚚 Online drivers:', drivers.filter(d => d.is_online).length);
      console.log('🚚 Available drivers:', drivers.filter(d => d.is_available).length);
      
      // Show all drivers with their status
      drivers.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.name} (${driver.email}) - Online: ${driver.is_online}, Available: ${driver.is_available}`);
      });
    } else {
      console.log('⚠️ No drivers found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDriverStatus();




