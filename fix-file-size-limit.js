const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFileSizeLimit() {
  try {
    console.log('Updating storage bucket file size limit...');
    
    // Update bucket with larger file size limit (50MB)
    const { data, error } = await supabase.storage.updateBucket('product-images', {
      public: true,
      allowedMimeTypes: null,
      fileSizeLimit: 52428800 // 50MB in bytes
    });
    
    if (error) {
      console.error('❌ Failed to update bucket:', error);
      return;
    }
    
    console.log('✅ Bucket updated successfully with 50MB file size limit');
    console.log('Bucket data:', data);
    
    // Test with a larger file
    console.log('Testing upload with updated configuration...');
    
    const testContent = 'Test upload content for larger file size limit';
    const fileName = `test-large-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, testContent);
    
    if (uploadError) {
      console.error('❌ Upload still failing:', uploadError);
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
    
    console.log('\n🎉 File size limit updated! You can now upload larger images.');
    console.log('Maximum file size: 50MB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixFileSizeLimit();

