/**
 * AfriDam AI - Global Configuration
 * Rule #3: Single Source of Truth for Environment Connectivity.
 */

// 🌍 Connectivity: Pointing to the Google Cloud Run Production Environment
// We use the /v1 prefix to match Tobi's versioned backend endpoints.
export const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://afridam-backend-prod-107032494605.us-central1.run.app/api';

export const SOCKET_URL = 
  process.env.NEXT_PUBLIC_SOCKET_URL || 
  'https://afridam-backend-prod-107032494605.us-central1.run.app';

/**
 * 🚀 SOCKET ENGINE CONFIG (Rule #6)
 * We enable both 'websocket' and 'polling' to ensure connection stability 
 * in Cloud Run/Production environments where pure WS can be flaky.
 */
export const SOCKET_OPTIONS = {
  transports: ['websocket'],
  secure: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  timeout: 20000,
};
