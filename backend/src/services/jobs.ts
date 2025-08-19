import Bull from 'bull';

export const initializeJobs = async () => {
  try {
    // Initialize background job queues
    const orderQueue = new Bull('order-processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      }
    });

    const notificationQueue = new Bull('notifications', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      }
    });

    console.log('Background job queues initialized');
    return { orderQueue, notificationQueue };
  } catch (error) {
    console.error('Failed to initialize job queues:', error);
    throw error;
  }
};
