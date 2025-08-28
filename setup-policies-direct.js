const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStoragePolicies() {
  try {
    console.log('Setting up storage policies using direct SQL execution...');
    
    // Enable RLS on storage.objects if not already enabled
    console.log('Enabling RLS on storage.objects...');
    const { error: rlsError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.log('RLS enable result:', rlsError.message);
    } else {
      console.log('✅ RLS enabled on storage.objects');
    }
    
    // Create policies using direct SQL execution
    const policies = [
      {
        name: 'Public read access for product images',
        sql: `
          CREATE POLICY "public_read_product_images" ON storage.objects
          FOR SELECT
          USING (bucket_id = 'product-images');
        `
      },
      {
        name: 'Authenticated upload for product images',
        sql: `
          CREATE POLICY "authenticated_upload_product_images" ON storage.objects
          FOR INSERT
          WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
        `
      },
      {
        name: 'Authenticated update/delete for product images',
        sql: `
          CREATE POLICY "authenticated_update_delete_product_images" ON storage.objects
          FOR UPDATE
          USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
        `
      },
      {
        name: 'Authenticated delete for product images',
        sql: `
          CREATE POLICY "authenticated_delete_product_images" ON storage.objects
          FOR DELETE
          USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
        `
      }
    ];
    
    for (const policy of policies) {
      console.log(`Creating: ${policy.name}...`);
      const { data, error } = await supabase.rpc('exec', {
        sql: policy.sql
      });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`✅ ${policy.name} (already exists)`);
        } else {
          console.log(`❌ ${policy.name}:`, error.message);
        }
      } else {
        console.log(`✅ ${policy.name} created successfully`);
      }
    }
    
    console.log('\n✅ Storage policies setup complete!');
    console.log('Image upload should now work in the admin app.');
    
  } catch (error) {
    console.error('❌ Error setting up storage policies:', error);
    console.log('\n📋 Manual setup still required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/hdqbnhtimuynuypwouwf/storage/policies');
    console.log('2. Click on the product-images bucket');
    console.log('3. Click "New Policy" and add the policies manually');
  }
}

setupStoragePolicies();

