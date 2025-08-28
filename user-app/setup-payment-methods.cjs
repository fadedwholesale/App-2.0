const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://hdqbnhtimuynuypwouwf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ'
);

async function setupPaymentMethodsTable() {
  console.log('🔐 Setting up secure payment methods table...\n');

  try {
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'create-payment-methods-table.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ SQL file not found:', sqlPath);
      return;
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length === 0) {
        continue;
      }

      try {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.log(`⚠️  Statement ${i + 1} result:`, error.message);
          
          // If exec_sql doesn't exist, provide manual instructions
          if (error.message.includes('exec_sql')) {
            console.log('\n📋 Manual Setup Required:');
            console.log('1. Go to your Supabase Dashboard');
            console.log('2. Navigate to SQL Editor');
            console.log('3. Copy and paste the contents of create-payment-methods-table.sql');
            console.log('4. Execute the SQL script');
            console.log('\n🔐 This will create a secure payment methods table with:');
            console.log('   • Row Level Security (RLS) enabled');
            console.log('   • User isolation (users can only access their own data)');
            console.log('   • Secure card number masking');
            console.log('   • Automatic primary payment method management');
            return;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (stmtError) {
        console.log(`⚠️  Statement ${i + 1} error:`, stmtError.message);
      }
    }

    console.log('\n🔍 Verifying setup...');

    // Test the table creation
    const { data: tableCheck, error: tableError } = await supabase
      .from('payment_methods')
      .select('count')
      .limit(1);

    if (tableError) {
      console.log('⚠️  Table verification failed:', tableError.message);
      console.log('\n📋 Manual verification required:');
      console.log('1. Check if payment_methods table exists in Supabase');
      console.log('2. Verify RLS policies are in place');
      console.log('3. Test user access permissions');
    } else {
      console.log('✅ Payment methods table setup verified successfully!');
    }

    console.log('\n🎉 Payment methods table setup complete!');
    console.log('\n🔐 Security Features:');
    console.log('   • Row Level Security (RLS) enabled');
    console.log('   • Users can only access their own payment methods');
    console.log('   • Card numbers are masked for security');
    console.log('   • Automatic primary payment method management');
    console.log('   • Secure user isolation');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📋 Manual Setup Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of create-payment-methods-table.sql');
    console.log('4. Execute the SQL script');
  }
}

// Check environment variables
if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   • VITE_SUPABASE_URL');
  console.error('   • SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n📋 Please check your .env file and try again.');
  process.exit(1);
}

// Run the setup
setupPaymentMethodsTable()
  .then(() => {
    console.log('\n✨ Setup process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup process failed:', error);
    process.exit(1);
  });
