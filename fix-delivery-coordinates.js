import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDeliveryCoordinates() {
  try {
    console.log('🔧 Fixing delivery coordinates from San Antonio to Austin...');
    
    // Austin downtown coordinates
    const austinLat = 30.2672;
    const austinLng = -97.7431;
    
    // Get all orders with San Antonio coordinates (around 29.6 latitude)
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('delivery_lat', 29.5)
      .lte('delivery_lat', 30.0)
      .gte('delivery_lng', -98.7)
      .lte('delivery_lng', -98.6);
    
    if (error) {
      console.error('❌ Error fetching orders:', error);
      return;
    }
    
    console.log(`📋 Found ${orders.length} orders with San Antonio coordinates`);
    
    if (orders.length > 0) {
      console.log('🔧 Updating delivery coordinates to Austin...');
      
      for (const order of orders) {
        console.log(`📍 Order ${order.id}: ${order.delivery_address}`);
        console.log(`📍 Old coordinates: ${order.delivery_lat}, ${order.delivery_lng}`);
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            delivery_lat: austinLat,
            delivery_lng: austinLng 
          })
          .eq('id', order.id);
        
        if (updateError) {
          console.error(`❌ Error updating order ${order.id}:`, updateError);
        } else {
          console.log(`✅ Updated order ${order.id} to Austin coordinates: ${austinLat}, ${austinLng}`);
        }
      }
    }
    
    // Verify the fix
    const { data: updatedOrders, error: verifyError } = await supabase
      .from('orders')
      .select('id, delivery_address, delivery_lat, delivery_lng')
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Error verifying orders:', verifyError);
    } else {
      console.log('✅ Sample orders after fix:');
      updatedOrders.forEach(order => {
        console.log(`  Order ${order.id}: ${order.delivery_address} (lat: ${order.delivery_lat}, lng: ${order.delivery_lng})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixDeliveryCoordinates();
