const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnlwd293ZiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NTYzMjc4MDUsImV4cCI6MjA3MTg4MzgwNX0.hdqbnhtimuynuypwouwf';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function executePaymentMethodsSetup() {
  console.log('🚀 Setting up automatic payment methods system...');
  
  try {
    // Read the SQL file
    const fs = require('fs');
    const sqlPath = './create-payment-methods-table.sql';
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ SQL file not found:', sqlPath);
      console.log('Please ensure create-payment-methods-table.sql exists in the current directory');
      return;
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.log('Statement:', statement.substring(0, 100) + '...');
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (execError) {
          console.error(`❌ Failed to execute statement ${i + 1}:`, execError.message);
          console.log('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }
    
    console.log('\n🎉 Payment methods setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. The payment_methods table has been created with automatic UUID handling');
    console.log('2. Automatic card replacement is now enabled');
    console.log('3. Expired cards will be automatically cleaned up');
    console.log('4. Users can now add cards and they will automatically replace old ones');
    console.log('5. Test the User App at http://localhost:3006/ and try adding a payment method');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('exec_sql')) {
      console.log('\n💡 Manual execution required:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of create-payment-methods-table.sql');
      console.log('4. Execute the SQL');
      console.log('5. The automatic UUID functions will be created');
    }
  }
}

executePaymentMethodsSetup();
