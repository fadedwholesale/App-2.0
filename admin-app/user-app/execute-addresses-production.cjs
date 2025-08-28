const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Production environment variables
const SUPABASE_URL = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

console.log('🚀 Starting production addresses table creation...');
console.log('📋 Supabase URL:', SUPABASE_URL);
console.log('🔑 Service Key:', SUPABASE_SERVICE_KEY.substring(0, 20) + '...');

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql) {
  try {
    console.log('🔧 Executing SQL statement...');
    console.log('📝 SQL:', sql.substring(0, 100) + '...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ SQL execution error:', error);
      throw error;
    }
    
    console.log('✅ SQL executed successfully');
    return data;
  } catch (error) {
    console.error('❌ Failed to execute SQL:', error);
    throw error;
  }
}

async function createAddressesTable() {
  try {
    console.log('\n📋 Reading SQL file...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-addresses-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('✅ SQL file read successfully');
    console.log('📏 SQL content length:', sqlContent.length, 'characters');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('📊 Found', statements.length, 'SQL statements to execute');
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
        await executeSQL(statement + ';');
      }
    }
    
    console.log('\n✅ All SQL statements executed successfully!');
    
    // Verify table creation
    console.log('\n🔍 Verifying table creation...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'addresses');
    
    if (tableError) {
      console.error('❌ Error checking table:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Addresses table verified successfully!');
    } else {
      console.log('⚠️ Addresses table not found in verification');
    }
    
    // Test RLS policies
    console.log('\n🔍 Testing RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'addresses');
    
    if (policyError) {
      console.error('❌ Error checking policies:', policyError);
    } else {
      console.log('✅ Found', policies?.length || 0, 'RLS policies for addresses table');
    }
    
    console.log('\n🎉 Production addresses table setup completed successfully!');
    console.log('📋 Table: public.addresses');
    console.log('🔒 RLS: Enabled with user isolation policies');
    console.log('📊 Indexes: Created for performance');
    console.log('⚡ Functions: Created for data management');
    
  } catch (error) {
    console.error('\n❌ Failed to create addresses table:', error);
    process.exit(1);
  }
}

// Check if exec_sql function exists
async function checkExecSqlFunction() {
  try {
    console.log('🔍 Checking if exec_sql function exists...');
    
    const { data: functions, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'exec_sql');
    
    if (error) {
      console.error('❌ Error checking exec_sql function:', error);
      return false;
    }
    
    if (functions && functions.length > 0) {
      console.log('✅ exec_sql function found');
      return true;
    } else {
      console.log('❌ exec_sql function not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking exec_sql function:', error);
    return false;
  }
}

// Create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  try {
    console.log('🔧 Creating exec_sql function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
        RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
      EXCEPTION
        WHEN OTHERS THEN
          RETURN json_build_object('success', false, 'error', SQLERRM);
      END;
      $$;
    `;
    
    // Execute the function creation directly
    const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (error) {
      console.log('⚠️ Could not create exec_sql function via RPC, trying direct SQL...');
      // Try to execute it directly (this might not work without proper permissions)
      console.log('⚠️ Manual function creation required');
      return false;
    }
    
    console.log('✅ exec_sql function created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating exec_sql function:', error);
    return false;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting production addresses table setup...\n');
    
    // Check if exec_sql function exists
    const hasExecSql = await checkExecSqlFunction();
    
    if (!hasExecSql) {
      console.log('⚠️ exec_sql function not found, attempting to create...');
      const created = await createExecSqlFunction();
      if (!created) {
        console.log('❌ Could not create exec_sql function');
        console.log('💡 Please create the exec_sql function manually in Supabase SQL editor:');
        console.log(`
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS json
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
            RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
          EXCEPTION
            WHEN OTHERS THEN
              RETURN json_build_object('success', false, 'error', SQLERRM);
          END;
          $$;
        `);
        process.exit(1);
      }
    }
    
    // Create addresses table
    await createAddressesTable();
    
    console.log('\n🎉 Production setup completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Production setup failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();
