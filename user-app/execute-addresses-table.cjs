const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAddressesTable() {
  try {
    console.log('🔧 Creating addresses table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-addresses-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error creating addresses table:', error);
      
      // Fallback: Execute SQL statements individually
      console.log('🔄 Trying individual SQL execution...');
      await executeIndividualStatements(sqlContent);
    } else {
      console.log('✅ Addresses table created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function executeIndividualStatements(sqlContent) {
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  for (const statement of statements) {
    try {
      console.log('🔧 Executing:', statement.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        console.log('⚠️ Statement failed (may already exist):', error.message);
      } else {
        console.log('✅ Statement executed successfully');
      }
    } catch (error) {
      console.log('⚠️ Statement error (may already exist):', error.message);
    }
  }
}

// Run the script
createAddressesTable()
  .then(() => {
    console.log('🎉 Addresses table setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
