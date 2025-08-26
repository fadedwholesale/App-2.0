import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxOptimizationService, { 
  DriverLocation, 
  DeliveryLocation, 
  OptimizedRoute 
} from '../services/mapbox-optimization';

interface EnhancedAdminMapProps {
  drivers: DriverLocation[];
  deliveries: DeliveryLocation[];
  onRouteOptimized?: (routes: OptimizedRoute[]) => void;
  onDriverSelected?: (driverId: string) => void;
  onDeliverySelected?: (deliveryId: string) => void;
}

const EnhancedAdminMap: React.FC<EnhancedAdminMapProps> = ({
  drivers,
  deliveries,
  onRouteOptimized,
  onDriverSelected,
  onDeliverySelected
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const optimizationService = useRef<MapboxOptimizationService | null>(null);
  
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [etaData, setEtaData] = useState<Map<string, { duration: number; distance: number }>>(new Map());

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current) return;

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mapbox access token not found');
      return;
    }

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-97.7431, 30.2672], // Austin, TX
      zoom: 12
    });

    // Initialize optimization service
    optimizationService.current = new MapboxOptimizationService({
      accessToken
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Add drivers to map
  const addDriversToMap = useCallback(() => {
    console.log('🗺️ addDriversToMap called with drivers:', drivers.length);
    if (!map.current) {
      console.log('🗺️ Map not available for adding drivers');
      return;
    }

    // Remove existing driver markers
    const existingMarkers = document.querySelectorAll('.driver-marker');
    existingMarkers.forEach(marker => marker.remove());
    console.log('🗺️ Removed existing driver markers');

    drivers.forEach((driver, index) => {
      console.log(`🗺️ Processing driver ${index + 1}:`, driver);
      if (!driver.lat || !driver.lng) {
        console.log(`🗺️ Driver ${driver.name} has no coordinates`);
        return;
      }

      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'driver-marker';
      markerEl.style.width = '30px';
      markerEl.style.height = '30px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.backgroundColor = driver.isOnline && driver.isAvailable ? '#10B981' : '#6B7280';
      markerEl.style.border = '3px solid white';
      markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      markerEl.style.cursor = 'pointer';
      markerEl.title = `${driver.name} - ${driver.isOnline ? 'Online' : 'Offline'}`;

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3">
          <h3 class="font-bold text-lg">${driver.name}</h3>
          <p class="text-sm text-gray-600">Status: ${driver.isOnline ? 'Online' : 'Offline'}</p>
          <p class="text-sm text-gray-600">Available: ${driver.isAvailable ? 'Yes' : 'No'}</p>
          ${driver.currentOrder ? `<p class="text-sm text-blue-600">Current Order: ${driver.currentOrder}</p>` : ''}
          <button 
            class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            onclick="window.selectDriver('${driver.id}')"
          >
            Select Driver
          </button>
        </div>
      `);

      // Add marker to map
      if (map.current) {
        new mapboxgl.Marker(markerEl)
          .setLngLat([driver.lng, driver.lat])
          .setPopup(popup)
          .addTo(map.current);
      }

      // Add click handler
      markerEl.addEventListener('click', () => {
        setSelectedDriver(driver.id);
        onDriverSelected?.(driver.id);
      });
    });

    // Add global function for popup buttons
    (window as any).selectDriver = (driverId: string) => {
      setSelectedDriver(driverId);
      onDriverSelected?.(driverId);
    };
  }, [drivers, onDriverSelected]);

  // Add deliveries to map
  const addDeliveriesToMap = useCallback(() => {
    if (!map.current) return;

    // Remove existing delivery markers
    const existingMarkers = document.querySelectorAll('.delivery-marker');
    existingMarkers.forEach(marker => marker.remove());

    deliveries.forEach(delivery => {
      if (!delivery.lat || !delivery.lng) return;

      // Create custom marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'delivery-marker';
      markerEl.style.width = '25px';
      markerEl.style.height = '25px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.backgroundColor = delivery.priority === 'high' ? '#EF4444' : 
                                     delivery.priority === 'normal' ? '#F59E0B' : '#10B981';
      markerEl.style.border = '2px solid white';
      markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      markerEl.style.cursor = 'pointer';
      markerEl.title = `${delivery.address} - ${delivery.priority} priority`;

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3">
          <h3 class="font-bold text-lg">Delivery</h3>
          <p class="text-sm text-gray-600">${delivery.address}</p>
          <p class="text-sm text-gray-600">Priority: ${delivery.priority}</p>
          <button 
            class="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            onclick="window.selectDelivery('${delivery.id}')"
          >
            Select Delivery
          </button>
        </div>
      `);

      // Add marker to map
      if (map.current) {
        new mapboxgl.Marker(markerEl)
          .setLngLat([delivery.lng, delivery.lat])
          .setPopup(popup)
          .addTo(map.current);
      }

      // Add click handler
      markerEl.addEventListener('click', () => {
        setSelectedDelivery(delivery.id);
        onDeliverySelected?.(delivery.id);
      });
    });

    // Add global function for popup buttons
    (window as any).selectDelivery = (deliveryId: string) => {
      setSelectedDelivery(deliveryId);
      onDeliverySelected?.(deliveryId);
    };
  }, [deliveries, onDeliverySelected]);

  // Add optimized routes to map
  const addRoutesToMap = useCallback(() => {
    if (!map.current || optimizedRoutes.length === 0) return;

    // Remove existing routes
    if (map.current.getSource('optimized-routes')) {
      map.current.removeLayer('optimized-routes');
      map.current.removeSource('optimized-routes');
    }

    // Create route features
    const routeFeatures = optimizedRoutes.map((route, routeIndex) => {
      const coordinates = route.route.map(point => [point.lng, point.lat]);
      
      return {
        type: 'Feature' as const,
        properties: {
          routeId: routeIndex,
          driverId: route.driverId,
          driverName: route.driverName,
          totalDistance: route.totalDistance,
          totalTime: route.totalTime,
          totalEarnings: route.totalEarnings
        },
        geometry: {
          type: 'LineString' as const,
          coordinates
        }
      };
    });

    // Add route source and layer
    map.current.addSource('optimized-routes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: routeFeatures
      }
    });

    map.current.addLayer({
      id: 'optimized-routes',
      type: 'line',
      source: 'optimized-routes',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'driverId'], selectedDriver], '#3B82F6',
          '#10B981'
        ],
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Add route labels
    map.current.addLayer({
      id: 'route-labels',
      type: 'symbol',
      source: 'optimized-routes',
      layout: {
        'text-field': ['get', 'driverName'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-offset': [0, 1.25],
        'text-anchor': 'top',
        'text-size': 12
      },
      paint: {
        'text-color': '#1F2937',
        'text-halo-color': '#FFFFFF',
        'text-halo-width': 1
      }
    });
  }, [optimizedRoutes, selectedDriver]);

  // Optimize routes
  const optimizeRoutes = useCallback(async () => {
    if (!optimizationService.current) return;

    setIsOptimizing(true);
    try {
      const routes = await optimizationService.current.optimizeDispatch(drivers, deliveries);
      setOptimizedRoutes(routes);
      onRouteOptimized?.(routes);
    } catch (error) {
      console.error('Route optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [drivers, deliveries, onRouteOptimized]);

  // Calculate ETA for selected driver and delivery
  const calculateETA = useCallback(async () => {
    if (!optimizationService.current || !selectedDriver || !selectedDelivery) return;

    const driver = drivers.find(d => d.id === selectedDriver);
    const delivery = deliveries.find(d => d.id === selectedDelivery);

    if (!driver || !delivery) return;

    try {
      const eta = await optimizationService.current.getDeliveryETA(
        [driver.lng, driver.lat],
        [delivery.lng, delivery.lat]
      );

      setEtaData(prev => new Map(prev.set(`${selectedDriver}-${selectedDelivery}`, eta)));
    } catch (error) {
      console.error('ETA calculation failed:', error);
    }
  }, [selectedDriver, selectedDelivery, drivers, deliveries]);

  // Update map when data changes
  useEffect(() => {
    console.log('🗺️ EnhancedAdminMap - drivers:', drivers.length);
    console.log('🗺️ EnhancedAdminMap - deliveries:', deliveries.length);
    console.log('🗺️ EnhancedAdminMap - map loaded:', map.current?.isStyleLoaded());
    
    if (!map.current) {
      console.log('🗺️ Map not initialized yet');
      return;
    }
    
    if (!map.current.isStyleLoaded()) {
      console.log('🗺️ Map style not loaded yet, waiting...');
      const handleStyleLoad = () => {
        console.log('🗺️ Map style loaded, adding markers');
        addDriversToMap();
        addDeliveriesToMap();
      };
      map.current.once('styledata', handleStyleLoad);
      return;
    }

    console.log('🗺️ Adding markers to map');
    addDriversToMap();
    addDeliveriesToMap();
  }, [drivers, deliveries, addDriversToMap, addDeliveriesToMap]);

  // Update routes when optimized routes change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    addRoutesToMap();
  }, [optimizedRoutes, addRoutesToMap]);

  // Calculate ETA when selection changes
  useEffect(() => {
    if (selectedDriver && selectedDelivery) {
      calculateETA();
    }
  }, [selectedDriver, selectedDelivery, calculateETA]);

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Control Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <h3 className="font-bold text-lg mb-3">Dispatch Controls</h3>
        
        <button
          onClick={optimizeRoutes}
          disabled={isOptimizing}
          className="w-full mb-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isOptimizing ? 'Optimizing...' : 'Optimize Routes'}
        </button>

        {optimizedRoutes.length > 0 && (
          <div className="text-sm">
            <p className="font-semibold">Optimized Routes:</p>
            <p>Total Routes: {optimizedRoutes.length}</p>
            <p>Total Earnings: ${optimizedRoutes.reduce((sum, route) => sum + route.totalEarnings, 0).toFixed(2)}</p>
          </div>
        )}

        {selectedDriver && selectedDelivery && (
          <div className="mt-3 p-2 bg-gray-50 rounded">
            <p className="text-sm font-semibold">ETA:</p>
            {etaData.get(`${selectedDriver}-${selectedDelivery}`) && (
              <>
                <p className="text-xs">Distance: {(etaData.get(`${selectedDriver}-${selectedDelivery}`)!.distance / 1000).toFixed(1)} km</p>
                <p className="text-xs">Time: {Math.round(etaData.get(`${selectedDriver}-${selectedDelivery}`)!.duration / 60)} min</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Route Information Panel */}
      {optimizedRoutes.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-sm">
          <h3 className="font-bold text-lg mb-3">Route Details</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {optimizedRoutes.map((route) => (
              <div 
                key={route.driverId}
                className={`p-2 rounded cursor-pointer ${
                  selectedDriver === route.driverId ? 'bg-blue-100 border-blue-300' : 'bg-gray-50'
                }`}
                onClick={() => setSelectedDriver(route.driverId)}
              >
                <p className="font-semibold text-sm">{route.driverName}</p>
                <p className="text-xs text-gray-600">
                  {route.route.length - 1} deliveries
                </p>
                <p className="text-xs text-gray-600">
                  ${route.totalEarnings.toFixed(2)} earnings
                </p>
                <p className="text-xs text-gray-600">
                  {Math.round(route.totalTime / 60)} min
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAdminMap;
