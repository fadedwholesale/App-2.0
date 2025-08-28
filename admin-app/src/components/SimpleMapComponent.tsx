import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZmFkZWRza2llczU3IiwiYSI6ImNtZWtxd21rYzA4enUyaXEyeDhvdmFyZTMifQ.jYXl3Gwi4LOIqRCxkEuU5A';

const SimpleMapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-97.7431);
  const [lat, setLat] = useState(30.2672);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    console.log('🗺️ Initializing simple map...');
    console.log('📍 Token:', mapboxgl.accessToken?.substring(0, 20) + '...');

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v10',
        center: [lng, lat],
        zoom: zoom,
        attributionControl: false,
        preserveDrawingBuffer: true
      });

      map.current.on('load', () => {
        console.log('✅ Simple map loaded successfully');
      });

      map.current.on('error', (e) => {
        console.error('❌ Simple map error:', e);
      });

      map.current.on('move', () => {
        if (map.current) {
          setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
          setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
          setZoom(parseFloat(map.current.getZoom().toFixed(2)));
        }
      });

      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl());

    } catch (error) {
      console.error('❌ Failed to initialize simple map:', error);
    }
  }, [lng, lat, zoom]);

  return (
    <div className="w-full h-96 rounded-lg border-2 border-gray-300">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-xs">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
    </div>
  );
};

export default SimpleMapComponent;
