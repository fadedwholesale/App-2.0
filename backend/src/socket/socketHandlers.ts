import { Server } from 'socket.io';

export const initializeSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Handle order updates
    socket.on('order_update', (data) => {
      io.emit('order_updated', data);
    });

    // Handle driver location updates
    socket.on('driver_location', (data) => {
      io.emit('location_updated', data);
    });
  });
};
