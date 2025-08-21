import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZmFkZWRza2llcyIsImEiOiJjbTZ0Z2Z0Z2Z0Z2Z0In0.example'; // Replace with your actual token

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

interface AdminMapComponentProps {
  drivers?: Driver[];
  deliveries?: Delivery[];
  onDriverSelect?: (driver: Driver) => void;
  onDeliverySelect?: (delivery: Delivery) => void;
  className?: string;
}

const AdminMapComponent: React.FC<AdminMapComponentProps> = ({
  drivers = [],
  deliveries = [],
  onDriverSelect,
  onDeliverySelect,
  className = "w-full h-96 rounded-lg"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });

    map.current.on('move', () => {
      if (map.current) {
        setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
        setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
        setZoom(parseFloat(map.current.getZoom().toFixed(2)));
      }
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

  }, [lng, lat, zoom]);

  // Add markers when drivers or deliveries change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

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
    });

  }, [drivers, deliveries, onDriverSelect, onDeliverySelect]);

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-xs">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
      
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
    </div>
  );
};

export default AdminMapComponent;

