// Test imports to identify the issue
console.log('Testing imports...');

try {
  // Test the service imports
  import('./services/api-integration-service').then(module => {
    console.log('✅ API service import successful:', module);
  }).catch(error => {
    console.error('❌ API service import failed:', error);
  });

  import('./services/cannabis-delivery-store').then(module => {
    console.log('✅ Store import successful:', module);
  }).catch(error => {
    console.error('❌ Store import failed:', error);
  });
} catch (error) {
  console.error('❌ Import test failed:', error);
}

export {};
