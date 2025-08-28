// Test GPS tracking functionality
console.log('🧪 GPS Tracking Test Script');

// Test 1: Check if geolocation is available
if (navigator.geolocation) {
  console.log('✅ Geolocation API is available');
  
  // Test 2: Get current position
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log('✅ GPS Position received:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString()
      });
      
      // Test 3: Start watching position
      const watchId = navigator.geolocation.watchPosition(
        (watchPosition) => {
          console.log('✅ GPS Watch Position received:', {
            latitude: watchPosition.coords.latitude,
            longitude: watchPosition.coords.longitude,
            accuracy: watchPosition.coords.accuracy,
            timestamp: new Date(watchPosition.timestamp).toISOString()
          });
        },
        (error) => {
          console.error('❌ GPS Watch Error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
      
      console.log('✅ GPS watching started with ID:', watchId);
      
      // Stop watching after 10 seconds
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        console.log('✅ GPS watching stopped');
      }, 10000);
      
    },
    (error) => {
      console.error('❌ GPS Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
} else {
  console.error('❌ Geolocation API is not available');
}

console.log('🧪 GPS Test Script Complete');



