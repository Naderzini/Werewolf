// API Configuration
// Update this URL to point to your backend server

// For local development:
// - iOS Simulator: use 'localhost' or '127.0.0.1'
// - Android Emulator: use '10.0.2.2'
// - Physical device: use your computer's IP address (e.g., '192.168.1.19')

// For production: use your deployed server URL

const API_CONFIG = {
  // Development
  SOCKET_URL_LOCAL: 'http://localhost:3000',
  SOCKET_URL_LAN: 'http://192.168.1.19:3000', // Update with your computer's IP
  
  // Productions
  SOCKET_URL_PROD: 'https://your-production-server.com',
};

// Automatically select the appropriate URL based on environment
const getSocketUrl = () => {
  // For development, you can manually switch between LOCAL and LAN
  // Use LAN when testing on a physical device
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    // Change this to SOCKET_URL_LAN when testing on physical device
    return API_CONFIG.SOCKET_URL_LAN;
  }
  
  return API_CONFIG.SOCKET_URL_PROD;
};

export const SOCKET_URL = getSocketUrl();
export default API_CONFIG;
