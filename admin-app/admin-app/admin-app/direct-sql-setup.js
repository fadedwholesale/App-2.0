import fetch from 'node-fetch';

// Supabase configuration
const supabaseUrl = 'https://hdqbnhtimuyynuywowuf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFKVabSSl4FW0bidDrvl2v9CfQ';

async function executeSQL(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

async function addLocationTrackingFields() {
  console.log('🔄 Adding location tracking fields to drivers table...');
  
  const sqlCommands = [
    `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_location JSONB;`,
    `ALTER TABLE drivers ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;`,
    `CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIN (current_location);`,
    `DROP POLICY IF EXISTS "Drivers can update their own location" ON drivers;`,
    `CREATE POLICY "Drivers can update their own location" ON drivers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
    `DROP POLICY IF EXISTS "Admins can read driver locations" ON drivers;`,
    `CREATE POLICY "Admins can read driver locations" ON drivers FOR SELECT USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin'));`
  ];

  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i];
    console.log(`\n📝 Executing SQL command ${i + 1}/${sqlCommands.length}...`);
    console.log(`SQL: ${sql}`);
    
    const { data, error } = await executeSQL(sql);
    
    if (error) {
      console.error(`❌ Error:`, error.message);
    } else {
      console.log(`✅ Success:`, data);
    }
  }

  console.log('\n🎉 Location tracking setup completed!');
}

// Run the setup
addLocationTrackingFields();




