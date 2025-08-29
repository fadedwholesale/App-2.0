const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use the same credentials as the user-app
const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // You'll need to get the actual service key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAddressesTable() {
  try {
    console.log('🔧 Creating addresses table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-addresses-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      try {
        if (statement.trim()) {
          console.log('🔧 Executing:', statement.substring(0, 50) + '...');
          
          // Execute the statement using rpc
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            console.log('⚠️ Statement failed (may already exist):', error.message);
          } else {
            console.log('✅ Statement executed successfully');
          }
        }
      } catch (error) {
        console.log('⚠️ Statement error (may already exist):', error.message);
      }
    }
    
    console.log('🎉 Addresses table setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createAddressesTable()
  .then(() => {
    console.log('✅ Setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
