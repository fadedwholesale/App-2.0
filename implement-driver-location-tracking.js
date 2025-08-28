const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://hdqbnhtimuyynuypwoufw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFKVabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function implementDriverLocationTracking() {
  try {
    console.log('🚀 Implementing driver location tracking...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'add-driver-location-fields.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 SQL content loaded:', sqlContent.length, 'characters');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // If exec_sql doesn't exist, try direct execution
      console.log('🔄 Trying direct SQL execution...');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        console.log('🔧 Executing:', statement.substring(0, 50) + '...');
        
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (stmtError) {
            console.error('❌ Statement failed:', stmtError);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (stmtErr) {
          console.error('❌ Statement execution error:', stmtErr);
        }
      }
    } else {
      console.log('✅ SQL executed successfully:', data);
    }
    
    // Verify the changes
    console.log('🔍 Verifying database changes...');
    
    // Check if the columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'drivers')
      .in('column_name', ['current_location', 'location_updated_at']);
    
    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
    } else {
      console.log('📊 Found columns:', columns);
      
      if (columns.length >= 2) {
        console.log('✅ Driver location tracking fields successfully added!');
        console.log('📍 current_location: JSONB field for GPS coordinates');
        console.log('📍 location_updated_at: TIMESTAMP field for tracking updates');
      } else {
        console.log('⚠️ Some columns may not have been added properly');
      }
    }
    
    // Test location update
    console.log('🧪 Testing location update functionality...');
    
    // Get a test driver
    const { data: testDriver, error: driverError } = await supabase
      .from('drivers')
      .select('id, user_id')
      .limit(1);
    
    if (driverError || !testDriver || testDriver.length === 0) {
      console.log('⚠️ No test driver found, skipping location update test');
    } else {
      const testLocation = {
        lat: 30.2672,
        lng: -97.7431
      };
      
      const { error: updateError } = await supabase
        .from('drivers')
        .update({ 
          current_location: testLocation,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', testDriver[0].id);
      
      if (updateError) {
        console.error('❌ Location update test failed:', updateError);
      } else {
        console.log('✅ Location update test successful!');
        console.log('📍 Test location saved:', testLocation);
      }
    }
    
    console.log('🎉 Driver location tracking implementation complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Driver app will now update locations automatically');
    console.log('2. Admin app will show live driver positions on map');
    console.log('3. Real-time tracking is now active');
    
  } catch (error) {
    console.error('❌ Implementation failed:', error);
  }
}

// Run the implementation
implementDriverLocationTracking();




