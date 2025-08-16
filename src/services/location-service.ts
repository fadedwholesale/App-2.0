import { wsService } from './simple-websocket';

export interface LocationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export interface GeofenceZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // meters
  active: boolean;
  type: 'delivery_zone' | 'restricted_zone' | 'pickup_zone';
  allowedUsers: string[];
  timeRestrictions?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
  heading?: number;
  speed?: number;
  isWithinServiceArea: boolean;
  nearestZone?: string;
}

class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private currentLocation: LocationData | null = null;
  private permissionGranted: boolean = false;
  private geofences: GeofenceZone[] = [];
  private lastLocationUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 10000; // 10 seconds

  static getInstance(): LocationService {
    if (!this.instance) {
      this.instance = new LocationService();
    }
    return this.instance;
  }

  // Request location permission with user-friendly prompts
  async requestLocationPermission(): Promise<LocationPermission> {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        return { granted: false, denied: true, prompt: false };
      }

      // Check current permission status
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        
        if (permission.state === 'granted') {
          this.permissionGranted = true;
          return { granted: true, denied: false, prompt: false };
        }
        
        if (permission.state === 'denied') {
          return { granted: false, denied: true, prompt: false };
        }
      }

      // Request permission by attempting to get current position
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.permissionGranted = true;
            this.updateCurrentLocation(position);
            resolve({ granted: true, denied: false, prompt: false });
          },
          (error) => {
            console.error('Location permission denied:', error);
            
            // Provide specific error handling
            let denied = true;
            if (error.code === error.PERMISSION_DENIED) {
              denied = true;
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              denied = false; // Technical issue, not user denial
            }
            
            resolve({ granted: false, denied, prompt: false });
          },
          {
            timeout: 10000,
            maximumAge: 60000,
            enableHighAccuracy: true
          }
        );
      });
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return { granted: false, denied: true, prompt: false };
    }
  }

  // Start location tracking with geofencing
  async startLocationTracking(userType: 'driver' | 'customer', userId: string): Promise<boolean> {
    if (!this.permissionGranted) {
      const permission = await this.requestLocationPermission();
      if (!permission.granted) {
        return false;
      }
    }

    try {
      // Stop any existing tracking
      this.stopLocationTracking();

      // Start watching position
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          if (now - this.lastLocationUpdate >= this.UPDATE_INTERVAL) {
            this.updateCurrentLocation(position);
            this.checkGeofences(userType, userId);
            this.lastLocationUpdate = now;
          }
        },
        (error) => {
          console.error('Location tracking error:', error);
          this.handleLocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 5000
        }
      );

      console.log('✅ Location tracking started for', userType, userId);
      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return false;
    }
  }

  // Stop location tracking
  stopLocationTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('📍 Location tracking stopped');
    }
  }

  // Update current location and check service area
  private updateCurrentLocation(position: GeolocationPosition): void {
    const locationData: LocationData = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString(),
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      isWithinServiceArea: this.isWithinServiceArea(
        position.coords.latitude, 
        position.coords.longitude
      ),
      nearestZone: this.findNearestZone(
        position.coords.latitude, 
        position.coords.longitude
      )
    };

    this.currentLocation = locationData;

    // Broadcast location update securely (no sensitive user data)
    wsService.send({
      type: 'location:update',
      data: {
        lat: locationData.lat,
        lng: locationData.lng,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp,
        isWithinServiceArea: locationData.isWithinServiceArea
      }
    });
  }

  // Check if location is within geofences
  private checkGeofences(userType: string, userId: string): void {
    if (!this.currentLocation) return;

    for (const geofence of this.geofences) {
      const distance = this.calculateDistance(
        this.currentLocation.lat,
        this.currentLocation.lng,
        geofence.center.lat,
        geofence.center.lng
      );

      const isInside = distance <= geofence.radius;
      const wasInside = this.isUserInGeofence(userId, geofence.id);

      // Check time restrictions
      if (geofence.timeRestrictions) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime < geofence.timeRestrictions.start || currentTime > geofence.timeRestrictions.end) {
          continue; // Skip this geofence due to time restrictions
        }
      }

      // Trigger events for zone entry/exit
      if (isInside && !wasInside) {
        this.handleGeofenceEntry(userType, userId, geofence);
      } else if (!isInside && wasInside) {
        this.handleGeofenceExit(userType, userId, geofence);
      }
    }
  }

  // Handle geofence entry
  private handleGeofenceEntry(userType: string, userId: string, geofence: GeofenceZone): void {
    console.log(`📍 ${userType} ${userId} entered geofence: ${geofence.name}`);
    
    wsService.send({
      type: 'geofence:entry',
      data: {
        userType,
        userId,
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        timestamp: new Date().toISOString(),
        location: this.currentLocation
      }
    });
  }

  // Handle geofence exit
  private handleGeofenceExit(userType: string, userId: string, geofence: GeofenceZone): void {
    console.log(`📍 ${userType} ${userId} exited geofence: ${geofence.name}`);
    
    wsService.send({
      type: 'geofence:exit',
      data: {
        userType,
        userId,
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        timestamp: new Date().toISOString(),
        location: this.currentLocation
      }
    });
  }

  // Check if location is within service area (Austin metro area for demo)
  private isWithinServiceArea(lat: number, lng: number): boolean {
    const austinCenter = { lat: 30.2672, lng: -97.7431 };
    const serviceRadius = 50000; // 50km radius
    
    const distance = this.calculateDistance(lat, lng, austinCenter.lat, austinCenter.lng);
    return distance <= serviceRadius;
  }

  // Find nearest zone
  private findNearestZone(lat: number, lng: number): string | undefined {
    let nearestZone: string | undefined;
    let minDistance = Infinity;

    for (const geofence of this.geofences) {
      const distance = this.calculateDistance(lat, lng, geofence.center.lat, geofence.center.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestZone = geofence.name;
      }
    }

    return nearestZone;
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Check if user is currently in a geofence (implementation would track this)
  private isUserInGeofence(userId: string, geofenceId: string): boolean {
    // This would be tracked in a more comprehensive implementation
    return false;
  }

  // Handle location errors
  private handleLocationError(error: GeolocationPositionError): void {
    let errorMessage = 'Location access error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }
    
    console.error(errorMessage, error);
    
    wsService.send({
      type: 'location:error',
      data: {
        error: errorMessage,
        code: error.code,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Public methods
  getCurrentLocation(): LocationData | null {
    return this.currentLocation;
  }

  getPermissionStatus(): boolean {
    return this.permissionGranted;
  }

  addGeofence(geofence: GeofenceZone): void {
    this.geofences.push(geofence);
  }

  removeGeofence(geofenceId: string): void {
    this.geofences = this.geofences.filter(g => g.id !== geofenceId);
  }

  getGeofences(): GeofenceZone[] {
    return this.geofences;
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();

// React hook for location services
export const useLocation = () => {
  return {
    requestPermission: locationService.requestLocationPermission.bind(locationService),
    startTracking: locationService.startLocationTracking.bind(locationService),
    stopTracking: locationService.stopLocationTracking.bind(locationService),
    getCurrentLocation: locationService.getCurrentLocation.bind(locationService),
    getPermissionStatus: locationService.getPermissionStatus.bind(locationService),
    addGeofence: locationService.addGeofence.bind(locationService),
    removeGeofence: locationService.removeGeofence.bind(locationService),
    getGeofences: locationService.getGeofences.bind(locationService)
  };
};
