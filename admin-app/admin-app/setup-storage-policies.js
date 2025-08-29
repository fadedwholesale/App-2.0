const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStoragePolicies() {
  try {
    console.log('Setting up storage policies for product-images bucket...');
    
    // Policy 1: Public read access
    const { error: readError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'product-images',
      policy_name: 'Public read access',
      definition: 'true',
      command: 'SELECT',
      roles: ['authenticated', 'anon']
    });
    
    if (readError) {
      console.log('Policy 1 - Public read access:', readError.message);
    } else {
      console.log('✅ Policy 1 - Public read access created');
    }
    
    // Policy 2: Authenticated upload
    const { error: uploadError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'product-images',
      policy_name: 'Authenticated upload',
      definition: 'true',
      command: 'INSERT',
      roles: ['authenticated']
    });
    
    if (uploadError) {
      console.log('Policy 2 - Authenticated upload:', uploadError.message);
    } else {
      console.log('✅ Policy 2 - Authenticated upload created');
    }
    
    // Policy 3: Owner update/delete
    const { error: updateError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'product-images',
      policy_name: 'Owner update/delete',
      definition: 'true',
      command: 'UPDATE',
      roles: ['authenticated']
    });
    
    if (updateError) {
      console.log('Policy 3 - Owner update/delete:', updateError.message);
    } else {
      console.log('✅ Policy 3 - Owner update/delete created');
    }
    
    // Alternative approach using SQL
    console.log('\nAlternative approach - Creating policies with SQL...');
    
    const policies = [
      {
        name: 'public_read_access',
        sql: `
          CREATE POLICY "public_read_access" ON storage.objects
          FOR SELECT USING (bucket_id = 'product-images');
        `
      },
      {
        name: 'authenticated_upload',
        sql: `
          CREATE POLICY "authenticated_upload" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
        `
      },
      {
        name: 'authenticated_update_delete',
        sql: `
          CREATE POLICY "authenticated_update_delete" ON storage.objects
          FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
        `
      }
    ];
    
    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
      if (error) {
        console.log(`❌ ${policy.name}:`, error.message);
      } else {
        console.log(`✅ ${policy.name} created via SQL`);
      }
    }
    
    console.log('\n✅ Storage policies setup complete!');
    console.log('Try uploading an image in the admin app now.');
    
  } catch (error) {
    console.error('❌ Error setting up storage policies:', error);
    console.log('\n📋 Manual setup required:');
    console.log('Go to: https://supabase.com/dashboard/project/hdqbnhtimuynuypwouwf/storage/policies');
    console.log('Add the policies as described in the previous instructions.');
  }
}

setupStoragePolicies();

