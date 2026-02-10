/**
 * AfriDam AI - Global Configuration
 * Rule #3: Single Source of Truth for Environment Connectivity.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://afridamai-backend.onrender.com/api';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://afridamai-backend.onrender.com';

// Specialist Unique Identifier (Static for this session)
export const SPECIALIST_ID = "cmlezbj5n0001kv013cpupouo";

// Global Business Rules
export const REVENUE_CURRENCY = '₦';
export const CONSULTATION_FEE_BASE = 15000;