import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZmFkZWRza2llczU3IiwiYSI6ImNtZWtxd21rYzA4enUyaXEyeDhvdmFyZTMifQ.jYXl3Gwi4LOIqRCxkEuU5A';

const BasicMapComponent: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    console.log('🗺️ Initializing basic map...');
    console.log('📍 Token:', mapboxgl.accessToken?.substring(0, 20) + '...');

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 22
            }
          ]
        },
        center: [-97.7431, 30.2672], // Austin, TX
        zoom: 10
      });

      map.current.on('load', () => {
        console.log('✅ Basic map loaded successfully');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('❌ Basic map error:', e);
        setError(`Map error: ${e.error?.message || 'Unknown error'}`);
      });

    } catch (error) {
      console.error('❌ Failed to initialize basic map:', error);
      setError(`Failed to load map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  return (
    <div className="w-full h-96 rounded-lg border-2 border-gray-300 relative">
      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">🗺️ Map Error</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      ) : !mapLoaded ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="text-blue-600 text-lg font-semibold mb-2">🗺️ Loading Map...</div>
            <div className="text-gray-600">Please wait</div>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} className="w-full h-full rounded-lg" />
      )}
    </div>
  );
};

export default BasicMapComponent;




