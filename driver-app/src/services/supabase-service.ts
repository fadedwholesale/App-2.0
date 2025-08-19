import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type Product = Database['public']['Tables']['products']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type Driver = Database['public']['Tables']['drivers']['Row']

export class DriverSupabaseService {
  // Authentication
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  // Driver operations
  async createDriver(driverData: Omit<Driver, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('drivers')
      .insert(driverData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async getDriver(driverId: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single()
    
    if (error) throw error
    return data
  }

  async updateDriverStatus(driverId: string, isOnline: boolean, isAvailable: boolean) {
    const { data, error } = await supabase
      .from('drivers')
      .update({ is_online: isOnline, is_available: isAvailable })
      .eq('id', driverId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateDriverLocation(driverId: string, location: any) {
    const { data, error } = await supabase
      .from('drivers')
      .update({ current_location: location })
      .eq('id', driverId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Orders
  async getAvailableOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'confirmed')
      .is('driver_id', null)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  }

  async getDriverOrders(driverId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async acceptOrder(orderId: string, driverId: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        driver_id: driverId,
        status: 'assigned'
      })
      .eq('id', orderId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async getOrder(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (error) throw error
    return data
  }

  // Real-time subscriptions
  subscribeToAvailableOrders(callback: (order: Order) => void) {
    return supabase
      .channel('available-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.confirmed'
        },
        (payload) => {
          callback(payload.new as Order)
        }
      )
      .subscribe()
  }

  subscribeToDriverOrders(driverId: string, callback: (order: Order) => void) {
    return supabase
      .channel(`driver-orders-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          callback(payload.new as Order)
        }
      )
      .subscribe()
  }

  subscribeToOrderUpdates(orderId: string, callback: (order: Order) => void) {
    return supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          callback(payload.new as Order)
        }
      )
      .subscribe()
  }

  // Earnings tracking
  async getDriverEarnings(driverId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', 'delivered')

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}

export const driverSupabaseService = new DriverSupabaseService()
