import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugSupabase() {
  console.log('🔍 Debugging Supabase connection...');
  
  try {
    // Test 1: Check if we can connect
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError);
      return;
    }
    console.log('✅ Connection successful');
    
    // Test 2: Get all products without any filters
    console.log('2. Fetching all products...');
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('*');
    
    if (allError) {
      console.error('❌ All products query failed:', allError);
    } else {
      console.log('📦 All products found:', allProducts?.length || 0);
      if (allProducts && allProducts.length > 0) {
        console.log('Sample product:', allProducts[0]);
      }
    }
    
    // Test 3: Get products with status filter
    console.log('3. Fetching products with status filter...');
    const { data: activeProducts, error: activeError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active');
    
    if (activeError) {
      console.error('❌ Active products query failed:', activeError);
    } else {
      console.log('📦 Active products found:', activeProducts?.length || 0);
    }
    
    // Test 4: Check table structure
    console.log('4. Checking table structure...');
    const { data: structure, error: structureError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Structure check failed:', structureError);
    } else if (structure && structure.length > 0) {
      console.log('📋 Table columns:', Object.keys(structure[0]));
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
  }
}

debugSupabase();
