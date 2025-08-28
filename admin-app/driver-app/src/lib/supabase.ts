import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ'

// Service role key for bypassing RLS
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM5MTExMiwiZXhwIjoyMDcwOTY3MTEyfQ.-FMqyNZagI4H6srNWFK5VabSSl4FW0bidDrvl2v9CfQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string
          date_of_birth: string
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone: string
          date_of_birth: string
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string
          date_of_birth?: string
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category: string
          price: number
          stock: number
          thc: string
          cbd: string
          supplier: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          price: number
          stock: number
          thc: string
          cbd: string
          supplier: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          price?: number
          stock?: number
          thc?: string
          cbd?: string
          supplier?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_id: string
          customer_name: string
          customer_phone: string
          address: string
          items: any[]
          total: number
          status: string
          driver_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          customer_name: string
          customer_phone: string
          address: string
          items: any[]
          total: number
          status?: string
          driver_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_id?: string
          customer_name?: string
          customer_phone?: string
          address?: string
          items?: any[]
          total?: number
          status?: string
          driver_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          is_online: boolean
          is_available: boolean
          current_location: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          is_online?: boolean
          is_available?: boolean
          current_location?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          is_online?: boolean
          is_available?: boolean
          current_location?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
