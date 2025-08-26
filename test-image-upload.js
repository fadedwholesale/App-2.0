const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageUpload() {
  try {
    console.log('Testing image upload to product-images bucket...');
    
    // Create a simple test text file to upload
    const testContent = 'This is a test file for storage upload';
    const fileName = `test-${Date.now()}.txt`;
    
    // Upload test file
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, testContent, {
        contentType: 'text/plain'
      });
    
    if (error) {
      console.error('❌ Upload failed:', error);
      return;
    }
    
    console.log('✅ Test upload successful:', data);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    console.log('✅ Public URL:', urlData.publicUrl);
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('product-images')
      .remove([fileName]);
    
    if (deleteError) {
      console.log('⚠️  Could not delete test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Storage bucket is working! Image upload should work in admin app.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImageUpload();

