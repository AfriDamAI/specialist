const API_URL = 'https://afridam-backend-prod-107032494605.us-central1.run.app/api';

/**
 * 🏛️ Rule #6: Centralized Backend Handshake
 * Synced with NestJS Auth Guards and Local Storage Keys
 */

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiClient(endpoint: string, options: FetchOptions = {}) {
  // 🛡️ Rule #6: Unified Token Key
  const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  /**
   * 🛡️ Rule #3: High-Precision Token Sanitation
   * Aggressively stripping quotes and whitespace to ensure the Bearer header 
   * is 100% clean for Tobi's NestJS JWT Strategy.
   */
  const token = rawToken?.replace(/['"]+/g, '').trim();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config = {
    ...options,
    headers,
  };

  // 🏛️ Rule #6: Dynamic Endpoint Resolution
  let url = `${API_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, config);

    // 🛡️ Rule #3: Graceful Identity Handshake Fail
    if (response.status === 401) {
      console.warn("🛡️ Auth Handshake Failed. Redirecting to Login...");
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token'); 
        window.location.href = '/login';
      }
      return null;
    }

    // 🛡️ Rule #1: Content-Type Validation (No Assumptions)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      
      if (!response.ok) {
        // Rule #3: Throwing structured errors for the UI to catch
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      /**
       * 🏛️ Rule #6: Result Normalization
       * Since we verified the backend uses 'resultData', we return the full 
       * object so components can handle their own unwrapping.
       */
      return data;
    }
    
    return response.ok ? { success: true } : null; 
  } catch (error) {
    console.error("🏛️ Handshake Error:", error);
    throw error;
  }
}