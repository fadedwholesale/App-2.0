// Test Mapbox access directly
const token = 'pk.eyJ1IjoiZmFkZWRza2llczU3IiwiYSI6ImNtZW00dHRyajBod3IyeHEyZHdnYm1yeW0ifQ.P4RajEEKqe1dBpyehD-iAA';

async function testMapboxDirect() {
  console.log('🧪 Testing Mapbox direct access...');
  console.log('📍 Token:', token.substring(0, 20) + '...');
  
  try {
    // Test 1: Check styles endpoint
    const stylesUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${token}`;
    console.log('📍 Testing styles URL:', stylesUrl);
    
    const response = await fetch(stylesUrl);
    console.log('📍 Response status:', response.status);
    console.log('📍 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Styles API working');
      console.log('📍 Style name:', data.name);
      console.log('📍 Style version:', data.version);
    } else {
      console.log('❌ Styles API failed:', response.status, response.statusText);
    }
    
    // Test 2: Check if we can access the style tiles
    const tileUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/0/0/0@2x?access_token=${token}`;
    console.log('📍 Testing tile URL:', tileUrl);
    
    const tileResponse = await fetch(tileUrl);
    console.log('📍 Tile response status:', tileResponse.status);
    
    if (tileResponse.ok) {
      console.log('✅ Tiles API working');
    } else {
      console.log('❌ Tiles API failed:', tileResponse.status, tileResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testMapboxDirect();




