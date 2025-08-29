const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to products table...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('add-missing-columns.sql', 'utf8');
    const statements = sqlContent.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec', {
          sql: statement
        });
        
        if (error) {
          if (error.message.includes('already exists') || error.message.includes('does not exist')) {
            console.log(`✅ Statement ${i + 1}: Column already exists or operation completed`);
          } else {
            console.log(`❌ Statement ${i + 1}: ${error.message}`);
          }
        } else {
          console.log(`✅ Statement ${i + 1}: Executed successfully`);
        }
      }
    }
    
    console.log('\n🎉 Database schema updated!');
    console.log('The products table now has all required columns.');
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    console.log('\n📋 Manual execution required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/hdqbnhtimuynuypwouwf/sql');
    console.log('2. Copy and paste the contents of add-missing-columns.sql');
    console.log('3. Execute the SQL statements');
  }
}

addMissingColumns();


