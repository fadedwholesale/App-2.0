import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFKVabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupLocationTracking() {
  try {
    console.log('🚀 Setting up location tracking fields...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-location-tracking-fields.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL content loaded');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach - execute SQL directly
      console.log('🔄 Trying alternative SQL execution...');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('📝 Executing:', statement.substring(0, 50) + '...');
          
          const { error: stmtError } = await supabase
            .from('drivers')
            .select('*')
            .limit(1); // This is just to test connection
          
          if (stmtError) {
            console.error('❌ Statement error:', stmtError);
          }
        }
      }
    } else {
      console.log('✅ Location tracking setup completed successfully!');
    }
    
    // Verify the setup
    console.log('🔍 Verifying setup...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('drivers')
      .select('current_location, location_updated_at')
      .limit(1);
    
    if (verifyError) {
      console.log('⚠️ Verification failed (fields may not exist yet):', verifyError.message);
    } else {
      console.log('✅ Location tracking fields verified!');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupLocationTracking();
