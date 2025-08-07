export const calculateDeliveryFee = (subtotal: number, lat?: number, lng?: number): number => {
  const baseDeliveryFee = 5.99;
  
  // Free delivery for orders over $50
  if (subtotal >= 50) {
    return 0;
  }
  
  // Add distance-based fee if coordinates provided
  if (lat && lng) {
    // Mock distance calculation - in reality would use Google Maps API
    const distance = Math.random() * 10; // Mock distance in miles
    const distanceFee = distance > 5 ? (distance - 5) * 0.50 : 0;
    return baseDeliveryFee + distanceFee;
  }
  
  return baseDeliveryFee;
};

export const calculateTax = (subtotal: number): number => {
  const taxRate = 0.0875; // 8.75% tax rate
  return subtotal * taxRate;
};

export const calculateLoyaltyPoints = (total: number): number => {
  // 1 point per $1 spent
  return Math.floor(total);
};
