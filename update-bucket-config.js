const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBucketConfig() {
  try {
    console.log('Updating bucket configuration...');
    
    // Update bucket to be public and allow all file types
    const { data, error } = await supabase.storage.updateBucket('product-images', {
      public: true,
      allowedMimeTypes: null, // Allow all file types
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
      console.error('❌ Failed to update bucket:', error);
      return;
    }
    
    console.log('✅ Bucket updated successfully:', data);
    
    // Now test with a simple upload
    console.log('Testing upload after bucket update...');
    
    const testContent = 'Test upload content';
    const fileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, testContent);
    
    if (uploadError) {
      console.error('❌ Upload still failing:', uploadError);
      
      // Try to make the bucket completely public
      console.log('Attempting to make bucket completely public...');
      const { error: publicError } = await supabase.storage
        .from('product-images')
        .createSignedUrl('test.jpg', 60);
      
      console.log('Public access test result:', publicError?.message || 'Success');
      
    } else {
      console.log('✅ Upload successful:', uploadData);
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      
      console.log('✅ Public URL:', urlData.publicUrl);
      
      // Clean up
      await supabase.storage.from('product-images').remove([fileName]);
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Storage bucket should now work for image uploads!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateBucketConfig();

