import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZmFkZWRza2llcyIsImEiOiJjbTZ0Z2Z0Z2Z0Z2Z0In0.example'; // Replace with your actual token

interface MapComponentProps {
  userLocation?: [number, number] | null;
  driverLocation?: [number, number] | null;
  deliveryAddress?: string;
  deliveryLocation?: [number, number] | null;
  onLocationSelect?: (location: [number, number]) => void;
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  userLocation,
  driverLocation,
  deliveryAddress,
  deliveryLocation,
  onLocationSelect,
  className = "w-full h-64 rounded-lg"
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

    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-left'
    );

    // Handle map clicks for location selection
    map.current.on('click', (e) => {
      if (onLocationSelect) {
        onLocationSelect([e.lngLat.lng, e.lngLat.lat]);
      }
    });

  }, [lng, lat, zoom, onLocationSelect]);

  // Add markers when locations change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add user location marker
    if (userLocation && map.current) {
      new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat(userLocation)
        .setPopup(new mapboxgl.Popup().setHTML('<h3>Your Location</h3>'))
        .addTo(map.current);
    }

    // Add driver location marker
    if (driverLocation && map.current) {
      new mapboxgl.Marker({ color: '#10B981' })
        .setLngLat(driverLocation)
        .setPopup(new mapboxgl.Popup().setHTML('<h3>Driver Location</h3>'))
        .addTo(map.current);
    }

    // Add delivery address marker
    if (deliveryLocation && map.current) {
      new mapboxgl.Marker({ color: '#EF4444' })
        .setLngLat(deliveryLocation)
        .setPopup(new mapboxgl.Popup().setHTML(`<h3>Delivery Address</h3><p>${deliveryAddress || 'Your delivery location'}</p>`))
        .addTo(map.current);
    } else if (deliveryAddress && !deliveryLocation) {
      // Fallback: Geocode the address to get coordinates
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${mapboxgl.accessToken}`)
        .then(response => response.json())
        .then(data => {
          if (data.features && data.features.length > 0 && map.current) {
            const [lng, lat] = data.features[0].center;
            new mapboxgl.Marker({ color: '#EF4444' })
              .setLngLat([lng, lat])
              .setPopup(new mapboxgl.Popup().setHTML(`<h3>Delivery Address</h3><p>${deliveryAddress}</p>`))
              .addTo(map.current);
          }
        })
        .catch(error => console.error('Error geocoding address:', error));
    }

  }, [userLocation, driverLocation, deliveryAddress]);

  return (
    <div className={className}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      <div className="absolute top-2 left-2 bg-white p-2 rounded shadow text-xs">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
    </div>
  );
};

export default MapComponent;
