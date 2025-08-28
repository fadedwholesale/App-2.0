import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZmFkZWRza2llczU3IiwiYSI6ImNtZW00dHRyajBod3IyeHEyZHdnYm1yeW0ifQ.P4RajEEKqe1dBpyehD-iAA';

interface SimpleTestMapProps {
  drivers?: any[];
  deliveries?: any[];
}

const SimpleTestMap: React.FC<SimpleTestMapProps> = ({ drivers = [], deliveries = [] }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    console.log('🧪 Simple test map starting...');
    console.log('📍 Token:', mapboxgl.accessToken ? 'Present' : 'Missing');
    console.log('📍 Container:', mapContainer.current);
    console.log('📍 Container size:', mapContainer.current.offsetWidth, 'x', mapContainer.current.offsetHeight);

    setStatus('Creating map...');

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-97.7431, 30.2672], // Austin, TX
        zoom: 10
      });

      console.log('✅ Map object created');

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        setStatus('Map loaded!');
        updateMarkers();
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
        setStatus(`Error: ${e.error?.message || 'Unknown error'}`);
      });

      map.current.on('styleload', () => {
        console.log('✅ Style loaded');
        setStatus('Style loaded!');
      });

      map.current.on('styledata', () => {
        console.log('✅ Style data loaded');
        setStatus('Style data loaded!');
      });

    } catch (error) {
      console.error('❌ Failed to create map:', error);
      setStatus(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Update markers function
  const updateMarkers = () => {
    if (!map.current) return;

    console.log('📍 Updating markers...');
    console.log('📍 Drivers data:', drivers);
    console.log('📍 Deliveries data:', deliveries);

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add driver markers
    drivers.forEach((driver: any) => {
      console.log('📍 Processing driver:', driver);
      const location = driver.location || [-97.7431, 30.2672];
      
      console.log('📍 Driver location:', location);
      
      // Create a custom driver marker with a different style
      const driverMarker = new mapboxgl.Marker({ 
        color: '#3B82F6', // Blue color for drivers
        scale: 1.2 // Make it slightly larger
      })
        .setLngLat(location)
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-lg">🚗 ${driver.name}</h3>
            <p class="text-sm text-gray-600">Status: ${driver.status}</p>
            <p class="text-xs text-blue-600">Driver Location</p>
          </div>
        `))
        .addTo(map.current!);

      markersRef.current.push(driverMarker);
      console.log('📍 Added driver marker for:', driver.name);
    });

    // Add delivery markers
    deliveries.forEach((delivery: any) => {
      const location = delivery.location || [-97.7431, 30.2672];
      
      // Create a custom delivery marker
      const deliveryMarker = new mapboxgl.Marker({ 
        color: '#EF4444', // Red color for deliveries
        scale: 1.0
      })
        .setLngLat(location)
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-lg">📦 ${delivery.customerName}</h3>
            <p class="text-sm text-gray-600">${delivery.address}</p>
            <p class="text-sm text-blue-600">Status: ${delivery.status}</p>
            <p class="text-xs text-red-600">Delivery Address</p>
          </div>
        `))
        .addTo(map.current!);

      markersRef.current.push(deliveryMarker);
    });

    console.log(`📍 Updated ${drivers.length} drivers and ${deliveries.length} deliveries`);
  };

  // Update markers when data changes
  useEffect(() => {
    if (map.current && status === 'Map loaded!') {
      updateMarkers();
    }
  }, [drivers, deliveries, status]);

  return (
    <div className="w-full h-96 border-2 border-red-500 relative">
      <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-xs z-10">
        Status: {status}
      </div>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default SimpleTestMap;
