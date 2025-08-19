import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type Product = Database['public']['Tables']['products']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type Driver = Database['public']['Tables']['drivers']['Row']

export class AdminSupabaseService {
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

  // Users management
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async deleteUser(userId: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) throw error
  }

  // Products management
  async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateProduct(productId: string, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async deleteProduct(productId: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
    
    if (error) throw error
  }

  // Orders management
  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async getOrdersByStatus(status: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async updateOrderStatus(orderId: string, status: string, driverId?: string) {
    const updates: Partial<Order> = { status }
    if (driverId) updates.driver_id = driverId

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
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

  // Drivers management
  async getAllDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async getOnlineDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_online', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  async createDriver(driverData: Omit<Driver, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('drivers')
      .insert(driverData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateDriver(driverId: string, updates: Partial<Driver>) {
    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', driverId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async deleteDriver(driverId: string) {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', driverId)
    
    if (error) throw error
  }

  // Analytics
  async getOrderAnalytics(startDate?: string, endDate?: string) {
    let query = supabase
      .from('orders')
      .select('*')

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

  async getRevenueAnalytics(startDate?: string, endDate?: string) {
    let query = supabase
      .from('orders')
      .select('total, created_at')
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

  // Real-time subscriptions
  subscribeToOrders(callback: (order: Order) => void) {
    return supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          callback(payload.new as Order)
        }
      )
      .subscribe()
  }

  subscribeToDrivers(callback: (driver: Driver) => void) {
    return supabase
      .channel('admin-drivers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers'
        },
        (payload) => {
          callback(payload.new as Driver)
        }
      )
      .subscribe()
  }

  subscribeToProducts(callback: (product: Product) => void) {
    return supabase
      .channel('admin-products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          callback(payload.new as Product)
        }
      )
      .subscribe()
  }
}

export const adminSupabaseService = new AdminSupabaseService()
