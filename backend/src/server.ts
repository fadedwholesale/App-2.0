import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3006;

// Supabase configuration
const supabaseUrl = 'https://hdqbnhtimuynuypwouwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkcWJuaHRpbXV5bnV5cHdvdXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTExMTIsImV4cCI6MjA3MDk2NzExMn0.JU4TzFtiUmVDAJ0QNu7lcu5RcXEJw6jhNUB86L1YTSQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Active connections tracking
const activeConnections = {
  users: new Map(),
  drivers: new Map(),
  admins: new Map()
};

// Real-time order tracking
const activeOrders = new Map();
const driverLocations = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    connections: {
      users: activeConnections.users.size,
      drivers: activeConnections.drivers.size,
      admins: activeConnections.admins.size
    }
  });
});

// API Endpoints
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('name');
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, customer_name, customer_phone, address, items, total } = req.body;
    
    const order_id = `FS${Date.now()}`;
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id,
        order_id,
        customer_name,
        customer_phone,
        address,
        items,
        total,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Notify admin about new order
    io.to('admin').emit('new_order', data);
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, driver_id } = req.body;
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status, driver_id, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Notify relevant parties
    if (driver_id) {
      io.to(`driver_${driver_id}`).emit('order_assigned', data);
    }
    
    io.to('admin').emit('order_status_updated', data);
    io.to(`user_${data.user_id}`).emit('order_status_updated', data);
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/drivers/available', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('is_online', true)
      .eq('is_available', true);
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/drivers/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_online, is_available, current_location } = req.body;
    
    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        is_online, 
        is_available, 
        current_location,
        updated_at: new Date() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update driver location tracking
    if (current_location) {
      driverLocations.set(id, current_location);
    }
    
    // Notify admin about driver status change
    io.to('admin').emit('driver_status_updated', data);
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // User connection
  socket.on('user:connect', (data) => {
    const { user_id } = data;
    activeConnections.users.set(user_id, socket.id);
    socket.join(`user_${user_id}`);
    socket.join('users');
    console.log(`User ${user_id} connected`);
  });

  // Driver connection
  socket.on('driver:connect', (data) => {
    const { driver_id } = data;
    activeConnections.drivers.set(driver_id, socket.id);
    socket.join(`driver_${driver_id}`);
    socket.join('drivers');
    console.log(`Driver ${driver_id} connected`);
  });

  // Admin connection
  socket.on('admin:connect', () => {
    activeConnections.admins.set(socket.id, 'admin');
    socket.join('admin');
    console.log('Admin connected');
  });

  // Driver location updates
  socket.on('driver:location_update', (data) => {
    const { driver_id, location } = data;
    driverLocations.set(driver_id, location);
    
    // Update driver location in database
    supabase
      .from('drivers')
      .update({ current_location: location })
      .eq('id', driver_id);
    
    // Notify admin about location update
    io.to('admin').emit('driver_location_updated', { driver_id, location });
  });

  // Order status updates
  socket.on('order:status_update', async (data) => {
    const { order_id, status, driver_id } = data;
    
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date() })
        .eq('id', order_id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Notify all relevant parties
      io.to('admin').emit('order_status_updated', order);
      io.to(`user_${order.user_id}`).emit('order_status_updated', order);
      if (driver_id) {
        io.to(`driver_${driver_id}`).emit('order_status_updated', order);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  });

  // Driver accepts order
  socket.on('driver:accept_order', async (data) => {
    const { order_id, driver_id } = data;
    
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({ 
          status: 'assigned', 
          driver_id,
          updated_at: new Date() 
        })
        .eq('id', order_id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Notify all parties
      io.to('admin').emit('order_assigned', order);
      io.to(`user_${order.user_id}`).emit('order_assigned', order);
      io.to(`driver_${driver_id}`).emit('order_accepted', order);
      
      // Update driver availability
      await supabase
        .from('drivers')
        .update({ is_available: false })
        .eq('id', driver_id);
        
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  });

  // Driver completes order
  socket.on('driver:complete_order', async (data) => {
    const { order_id, driver_id } = data;
    
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered', 
          updated_at: new Date() 
        })
        .eq('id', order_id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Notify all parties
      io.to('admin').emit('order_delivered', order);
      io.to(`user_${order.user_id}`).emit('order_delivered', order);
      io.to(`driver_${driver_id}`).emit('order_completed', order);
      
      // Update driver availability
      await supabase
        .from('drivers')
        .update({ is_available: true })
        .eq('id', driver_id);
        
    } catch (error) {
      console.error('Error completing order:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up connections
    for (const [key, value] of activeConnections.users.entries()) {
      if (value === socket.id) {
        activeConnections.users.delete(key);
        break;
      }
    }
    
    for (const [key, value] of activeConnections.drivers.entries()) {
      if (value === socket.id) {
        activeConnections.drivers.delete(key);
        break;
      }
    }
    
    for (const [key, value] of activeConnections.admins.entries()) {
      if (value === socket.id) {
        activeConnections.admins.delete(key);
        break;
      }
    }
  });
});

// Supabase real-time subscriptions
const setupSupabaseRealtime = () => {
  // Orders real-time subscription
  supabase
    .channel('orders')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'orders' 
    }, (payload) => {
      console.log('Order change:', payload);
      
      // Broadcast to relevant clients
      if (payload.eventType === 'INSERT') {
        io.to('admin').emit('new_order', payload.new);
      } else if (payload.eventType === 'UPDATE') {
        io.to('admin').emit('order_updated', payload.new);
        io.to(`user_${payload.new.user_id}`).emit('order_updated', payload.new);
        if (payload.new.driver_id) {
          io.to(`driver_${payload.new.driver_id}`).emit('order_updated', payload.new);
        }
      }
    })
    .subscribe();

  // Drivers real-time subscription
  supabase
    .channel('drivers')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'drivers' 
    }, (payload) => {
      console.log('Driver change:', payload);
      
      if (payload.eventType === 'UPDATE') {
        io.to('admin').emit('driver_updated', payload.new);
      }
    })
    .subscribe();
};

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  
  // Setup Supabase real-time
  setupSupabaseRealtime();
  console.log('🔗 Supabase real-time subscriptions active');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});

export { io, supabase };
