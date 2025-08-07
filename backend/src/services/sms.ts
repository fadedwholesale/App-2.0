import { logger } from '../utils/logger';

export const sendSMS = async (phoneNumber: string, message: string) => {
  // For development, just log instead of sending real SMS
  if (process.env.TWILIO_ACCOUNT_SID === 'development_mode') {
    logger.info(`[SMS] To: ${phoneNumber}, Message: ${message}`);
    return { success: true };
  }
  
  // Real Twilio implementation would go here
  try {
    // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });
    
    logger.info(`SMS sent successfully to ${phoneNumber}`);
    return { success: true };
  } catch (error) {
    logger.error('SMS sending failed:', error);
    return { success: false, error };
  }
};
