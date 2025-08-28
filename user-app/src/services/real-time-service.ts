import { supabase } from '../lib/supabase';

export interface Order {
  id: string;
  user_id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  items: any[];
  total: number;
  status: 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  driver_id?: string;
  driver_location?: { lat: number; lng: number };
  created_at: string;
  updated_at: string;
}

export interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  thc: string;
  cbd: string;
  supplier: string;
  status: string;
  image_url?: string;
}

class RealTimeService {
  private isConnected = false;
  private subscriptions: any[] = [];

  // Event callbacks
  private orderUpdateCallbacks: ((order: Order) => void)[] = [];
  private orderCancelledCallbacks: ((order: Order) => void)[] = [];
  // private orderAssignedCallbacks: ((order: Order) => void)[] = [];
  // private orderDeliveredCallbacks: ((order: Order) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];

  constructor() {
    this.initializeSupabaseRealtime();
  }

  private initializeSupabaseRealtime() {
    try {
      // Subscribe to orders table changes
      const ordersSubscription = supabase
        .channel('orders')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders' },
          async (payload) => {
            console.log('📦 Order change:', payload);
            const order = payload.new as Order;
            
            if (payload.eventType === 'UPDATE') {
              // Fetch driver location if order has a driver assigned
              if (order.driver_id) {
                try {
                  const { data: driverLocation, error } = await supabase
                    .from('driver_locations')
                    .select('latitude, longitude, updated_at')
                    .eq('driver_id', order.driver_id)
                    .single();
                  
                  if (driverLocation && !error) {
                    order.driver_location = {
                      lat: driverLocation.latitude,
                      lng: driverLocation.longitude
                    };
                    console.log('📍 Driver location fetched:', order.driver_location);
                  } else {
                    console.log('⚠️ No driver location found for driver:', order.driver_id);
                  }
                } catch (locationError) {
                  console.error('❌ Error fetching driver location:', locationError);
                }
              }
              
              this.notifyOrderUpdateCallbacks(order);
              
              // Check if order was cancelled
              if (order.status === 'cancelled') {
                console.log('❌ Order cancelled:', order);
                this.notifyOrderCancelledCallbacks(order);
              }
            } else if (payload.eventType === 'INSERT') {
              // New order created
              console.log('🆕 New order created:', order);
            }
          }
        )
        .subscribe((status) => {
          console.log('🔗 Supabase real-time status:', status);
          this.isConnected = status === 'SUBSCRIBED';
          this.notifyConnectionCallbacks(this.isConnected);
        });

      // Subscribe to driver_locations table changes
      const driverLocationsSubscription = supabase
        .channel('driver_locations')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'driver_locations' },
          async (payload) => {
            console.log('📍 Driver location change:', payload);
            const driverLocation = payload.new as DriverLocation;
            
            if (driverLocation && payload.eventType === 'UPDATE') {
              // Find orders with this driver and update them
              try {
                const { data: orders, error } = await supabase
                  .from('orders')
                  .select('*')
                  .eq('driver_id', driverLocation.driver_id)
                  .in('status', ['assigned', 'accepted', 'picked_up', 'in_transit']);
                
                if (orders && !error) {
                  orders.forEach(order => {
                    const updatedOrder = {
                      ...order,
                      driver_location: {
                        lat: driverLocation.latitude,
                        lng: driverLocation.longitude
                      }
                    };
                    console.log('📍 Updating order with new driver location:', updatedOrder.order_id);
                    this.notifyOrderUpdateCallbacks(updatedOrder);
                  });
                }
              } catch (orderError) {
                console.error('❌ Error updating orders with driver location:', orderError);
              }
            }
          }
        )
        .subscribe();

      // Subscribe to products table changes
      const productsSubscription = supabase
        .channel('products')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            console.log('📦 Product change:', payload);
          }
        )
        .subscribe();

      this.subscriptions.push(ordersSubscription, driverLocationsSubscription, productsSubscription);
    } catch (error) {
      console.error('Failed to initialize Supabase real-time:', error);
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }

  async connect(userId: string) {
    // Supabase connection is handled automatically
    console.log('🔗 User connected:', userId);
  }

  async disconnect() {
    // Unsubscribe from all channels
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.subscriptions = [];
    console.log('🔌 User disconnected');
  }

  // Event listeners
  onOrderUpdate(callback: (order: Order) => void) {
    this.orderUpdateCallbacks.push(callback);
  }

  // onOrderAssigned(callback: (order: Order) => void) {
  //   this.orderAssignedCallbacks.push(callback);
  // }

  // onOrderDelivered(callback: (order: Order) => void) {
  //   this.orderDeliveredCallbacks.push(callback);
  // }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
  }

  onOrderCancelled(callback: (order: Order) => void) {
    this.orderCancelledCallbacks.push(callback);
  }

  // Notify callbacks
  private notifyOrderUpdateCallbacks(order: Order) {
    this.orderUpdateCallbacks.forEach(callback => callback(order));
  }

  // private notifyOrderAssignedCallbacks(order: Order) {
  //   this.orderAssignedCallbacks.forEach(callback => callback(order));
  // }

  // private notifyOrderDeliveredCallbacks(order: Order) {
  //   this.orderDeliveredCallbacks.forEach(callback => callback(order));
  // }

  private notifyOrderCancelledCallbacks(order: Order) {
    this.orderCancelledCallbacks.forEach(callback => callback(order));
  }

  private notifyConnectionCallbacks(connected: boolean) {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  // API methods
  async getProducts(): Promise<Product[]> {
    try {
      console.log('🔍 Fetching products from Supabase...');
      const { data, error } = await supabase
        .from('products')
        .select('*, image_url')
        .order('name');

      if (error) {
        console.error('Supabase products query error:', error);
        throw error;
      }
      
      console.log('📦 Products fetched from Supabase:', data?.length || 0, 'products');
      if (data && data.length > 0) {
        console.log('Sample product:', data[0]);
        console.log('🖼️ Product image URL:', data[0].image_url);
      }
      
      return data || [];
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  }

  async createOrder(orderData: {
    user_id: string;
    customer_name: string;
    customer_phone: string;
    address: string;
    items: any[];
    total: number;
  }): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          user_id: orderData.user_id,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          address: orderData.address,
          items: orderData.items,
          total: orderData.total,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('📦 Order created successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  async getOrders(_userId: string): Promise<Order[]> {
    try {
      // Get the authenticated user's UUID first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.error('No authenticated user found');
        return [];
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id) // Use UUID instead of email
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch driver locations for orders with assigned drivers
      const ordersWithDriverLocation = await Promise.all((data || []).map(async (order) => {
        if (order.driver_id) {
          try {
            const { data: driverLocation, error: locationError } = await supabase
              .from('driver_locations')
              .select('latitude, longitude, updated_at')
              .eq('driver_id', order.driver_id)
              .single();
            
            if (driverLocation && !locationError) {
              order.driver_location = {
                lat: driverLocation.latitude,
                lng: driverLocation.longitude
              };
              console.log('📍 Driver location loaded for order:', order.order_id, order.driver_location);
            } else {
              console.log('⚠️ No driver location found for driver:', order.driver_id);
            }
          } catch (locationError) {
            console.error('❌ Error fetching driver location for order:', order.order_id, locationError);
          }
        }
        return order;
      }));

      console.log('📦 Orders loaded with driver locations:', ordersWithDriverLocation.length);
      return ordersWithDriverLocation;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  }

  // Cleanup
  removeAllListeners() {
    this.orderUpdateCallbacks = [];
    // this.orderAssignedCallbacks = [];
    // this.orderDeliveredCallbacks = [];
    this.connectionCallbacks = [];
  }
}

// Create singleton instance
export const realTimeService = new RealTimeService();
export default realTimeService;
