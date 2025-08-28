const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDriverTable() {
  try {
    console.log('🔧 Fixing driver table structure...');
    
    // Read the SQL file
    const fs = require('fs');
    const sql = fs.readFileSync('fix-drivers-table.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }
    
    console.log('✅ Driver table structure fixed successfully!');
    console.log('📊 Data:', data);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixDriverTable();




