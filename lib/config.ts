/**
 * AfriDam AI - Global Configuration
 * Rule #3: Single Source of Truth for Environment Connectivity.
 */

// 🌍 Connectivity: Pointing to the Google Cloud Run Production Environment
// We use the /v1 prefix to match Tobi's versioned backend endpoints.
export const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'https://afridam-backend-prod-107032494605.us-central1.run.app/v1';

export const SOCKET_URL = 
  process.env.NEXT_PUBLIC_SOCKET_URL || 
  'https://afridam-backend-prod-107032494605.us-central1.run.app';

// 🏥 Specialist Identity
// Unique Identifier for the current clinical session
export const SPECIALIST_ID = "cmlezbj5n0001kv013cpupouo";

// 💰 Global Business Rules (Nigeria Region)
// These ensure financial consistency across the Specialist Board
export const REVENUE_CURRENCY = '₦';
export const CONSULTATION_FEE_BASE = 15000;