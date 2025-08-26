// Test Mapbox API access
const token = 'pk.eyJ1IjoiZmFkZWRza2llczU3IiwiYSI6ImNtZW00dHRyajBod3IyeHEyZHdnYm1yeW0ifQ.P4RajEEKqe1dBpyehD-iAA';

async function testMapbox() {
  console.log('🧪 Testing Mapbox API access...');
  
  try {
    // Test 1: Check if we can access Mapbox styles
    const styleUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${token}`;
    const response = await fetch(styleUrl);
    
    if (response.ok) {
      console.log('✅ Mapbox styles API accessible');
      const data = await response.json();
      console.log('📍 Style data received:', Object.keys(data));
    } else {
      console.log('❌ Mapbox styles API failed:', response.status, response.statusText);
    }
    
    // Test 2: Check if we can access Mapbox tiles
    const tileUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/0/0/0@2x?access_token=${token}`;
    const tileResponse = await fetch(tileUrl);
    
    if (tileResponse.ok) {
      console.log('✅ Mapbox tiles API accessible');
    } else {
      console.log('❌ Mapbox tiles API failed:', tileResponse.status, tileResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ Network error testing Mapbox:', error.message);
  }
}

testMapbox();
