import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZmFkZWRza2llczU3IiwiYSI6ImNtZW00dHRyajBod3IyeHEyZHdnYm1yeW0ifQ.P4RajEEKqe1dBpyehD-iAA';

interface Driver {
  id: string;
  name: string;
  location: [number, number];
  status: 'available' | 'busy' | 'offline';
  currentOrder?: string;
}

interface Delivery {
  id: string;
  customerName: string;
  address: string;
  status: 'pending' | 'assigned' | 'in-transit' | 'delivered';
  driverId?: string;
  location: [number, number];
}

interface WorkingMapComponentProps {
  drivers?: Driver[];
  deliveries?: Delivery[];
  onDriverSelect?: (driver: Driver) => void;
  onDeliverySelect?: (delivery: Delivery) => void;
  className?: string;
}

const WorkingMapComponent: React.FC<WorkingMapComponentProps> = ({
  drivers = [],
  deliveries = [],
  onDriverSelect,
  onDeliverySelect,
  className = "w-full h-96 rounded-lg"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log('🗺️ Initializing working map...');

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-97.7431, 30.2672], // Austin, TX
        zoom: 12
      });

      console.log('✅ Map object created');

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        setIsLoading(false);
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
        setError(`Map error: ${e.error?.message || 'Unknown error'}`);
        setIsLoading(false);
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
      setError(`Failed to load map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, []);

  // Update markers when drivers or deliveries change
  const updateMarkers = useCallback(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add driver markers
    drivers.forEach(driver => {
      const color = driver.status === 'available' ? '#10B981' : 
                   driver.status === 'busy' ? '#F59E0B' : '#6B7280';
      
      const marker = new mapboxgl.Marker({ color })
        .setLngLat(driver.location)
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-lg">${driver.name}</h3>
            <p class="text-sm text-gray-600">Status: ${driver.status}</p>
            ${driver.currentOrder ? `<p class="text-sm text-blue-600">Order: ${driver.currentOrder}</p>` : ''}
          </div>
        `))
        .addTo(map.current!);

      // Add click handler
      marker.getElement().addEventListener('click', () => {
        if (onDriverSelect) {
          onDriverSelect(driver);
        }
      });

      markersRef.current.push(marker);
    });

    // Add delivery markers
    deliveries.forEach(delivery => {
      const color = delivery.status === 'pending' ? '#EF4444' :
                   delivery.status === 'assigned' ? '#F59E0B' :
                   delivery.status === 'in-transit' ? '#3B82F6' : '#10B981';
      
      const marker = new mapboxgl.Marker({ color })
        .setLngLat(delivery.location)
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-lg">${delivery.customerName}</h3>
            <p class="text-sm text-gray-600">${delivery.address}</p>
            <p class="text-sm text-blue-600">Status: ${delivery.status}</p>
          </div>
        `))
        .addTo(map.current!);

      // Add click handler
      marker.getElement().addEventListener('click', () => {
        if (onDeliverySelect) {
          onDeliverySelect(delivery);
        }
      });

      markersRef.current.push(marker);
    });

    console.log(`📍 Updated ${drivers.length} drivers and ${deliveries.length} deliveries`);
  }, [drivers, deliveries, onDriverSelect, onDeliverySelect]);

  // Update markers when map is ready and data changes
  useEffect(() => {
    if (map.current && !isLoading) {
      updateMarkers();
    }
  }, [updateMarkers, isLoading]);

  return (
    <div className={className}>
      {isLoading ? (
        <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-blue-600 text-lg font-semibold mb-2">🗺️ Loading Map...</div>
            <div className="text-gray-600">Initializing Mapbox...</div>
          </div>
        </div>
      ) : error ? (
        <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">🗺️ Map Error</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="w-full h-full rounded-lg" />
          
          {/* Legend */}
          <div className="absolute bottom-2 left-2 bg-white p-3 rounded shadow text-xs">
            <div className="font-semibold mb-2">Legend</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Available Driver</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Busy Driver</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Pending Delivery</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>In Transit</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkingMapComponent;
