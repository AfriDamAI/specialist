import { API_URL } from './config';

/**
 * 🏛️ Rule #6: Centralized Backend Handshake
 * Synced with NestJS Auth Guards and Local Storage Keys
 */

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export interface Chat {
  id: string;
  participant1Id: string;
  participant2Id: string;
  participants?: Array<{ id: string; name: string; avatar?: string; profile?: any }>;
  messages?: Message[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  message?: string;
  type: string;
  attachmentUrl?: string;
  mimeType?: string;
  fileSize?: number;
  duration?: number;
  read?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
        // Only redirect if we are not already on the login or landing page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
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

// ============ Chat API Functions ============

export const initiateChat = async (participant1Id: string, participant2Id: string): Promise<any> => {
  const response = await apiClient("/chats", {
    method: 'POST',
    body: JSON.stringify({ participant1Id, participant2Id }),
  });
  return response?.data || response;
};

export const getCurrentUserChats = async (): Promise<Chat[]> => {
  const response = await apiClient("/chats/me");
  return response?.resultData || response?.data || response || [];
};

export const getChatById = async (chatId: string): Promise<Chat> => {
  const response = await apiClient(`/chats/${chatId}`);
  return response?.resultData || response?.data || response;
};

export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  const response = await apiClient(`/chats/${chatId}/messages`);
  return response?.resultData || response?.data || response || [];
};

export const sendUserChatMessage = async (
  chatId: string, 
  senderId: string, 
  message?: string,
  type: string = 'TEXT',
  attachmentUrl?: string,
  mimeType?: string,
  fileSize?: number,
  duration?: number
): Promise<Message> => {
  const response = await apiClient("/chats/messages", {
    method: 'POST',
    body: JSON.stringify({ 
      chatId, 
      senderId, 
      message: message || '',
      type,
      attachmentUrl: attachmentUrl || '',
      mimeType: mimeType || '',
      fileSize: fileSize || 0,
      duration: duration || 0
    }),
  });
  return response?.resultData || response?.data || response;
};

export const uploadFile = async (file: File): Promise<{ url: string; mimeType: string; size: number }> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const rawToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const token = rawToken?.replace(/['"]+/g, '').trim();
  
  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  
  const data = await response.json();
  return data?.data || data;
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  const response = await apiClient(`/chats/messages/${messageId}/read`, {
    method: 'PATCH',
  });
  return response?.data || response;
};

// ============ Appointment API Functions ============

export const getAppointmentById = async (id: string): Promise<any> => {
  const response = await apiClient(`/appointments/${id}`);
  return response?.data || response;
};


export const startAppointmentSession = async (id: string): Promise<any> => {
  const response = await apiClient(`/appointments/${id}/start-session`, {
    method: 'POST',
  });
  return response?.data || response;
};

export const joinAppointmentSession = async (id: string): Promise<{ meetLink: string }> => {
  const response = await apiClient(`/appointments/${id}/join`);
  return response?.data || response;
};

export const endAppointmentSession = async (id: string): Promise<any> => {
  const response = await apiClient(`/appointments/${id}/end-session`, {
    method: 'POST',
  });
  return response?.data || response;
};

export const requestEndAppointmentSession = async (id: string): Promise<any> => {
  const response = await apiClient(`/appointments/${id}/request-end`, {
    method: 'POST',
  });
  return response?.data || response;
};

export const approveEndAppointmentSession = async (id: string): Promise<any> => {
  const response = await apiClient(`/appointments/${id}/approve-end`, {
    method: 'POST',
  });
  return response?.data || response;
};

export const declineEndAppointmentSession = async (id: string): Promise<any> => {
  const response = await apiClient(`/appointments/${id}/decline-end`, {
    method: 'POST',
  });
  return response?.data || response;
};

export const extendAppointmentSession = async (id: string): Promise<any> => {
  const response = await apiClient(`/appointments/${id}/extend-session`, {
    method: 'POST',
  });
  return response?.data || response;
};

export const updateAppointmentStatus = async (id: string, status: string): Promise<any> => {
  const response = await apiClient(`/appointments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  return response?.data || response;
};

export const completeAppointment = async (id: string): Promise<any> => {
  const response = await apiClient(`/appointments/${id}/complete`, {
    method: 'PUT',
  });
  return response?.data || response;
};

export const cancelAppointment = async (id: string): Promise<any> => {
  const response = await apiClient(`/appointments/${id}/cancel`, {
    method: 'PUT',
  });
  return response?.data || response;
};
export const getSpecialistAppointments = async (statuses?: string[]): Promise<any[]> => {
  const response = await apiClient('/appointments/specialist/me');
  const data: any[] = response?.data || response?.resultData || response || [];
  if (statuses && statuses.length > 0) {
    return data.filter((apt: any) => statuses.includes(apt.status));
  }
  return data;
};

// ============ Wallet & Withdrawal API Functions ============

export interface Wallet {
  id: string;
  ownerId: string;
  ownerType: 'USER' | 'VENDOR' | 'SPECIALIST';
  balance: number;
  totalIn: number;
  totalOut: number;
  createdAt: string;
  updatedAt: string;
  transactions?: WalletTransaction[];
  withdrawalRequests?: WithdrawalRequest[];
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  requestedById: string;
  requestedByType: string;
  approvedById?: string;
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
  adminNotes?: string;
}

export const getMyWallet = async (): Promise<Wallet> => {
  const response = await apiClient('/wallets/me');
  return response?.resultData || response?.data || response;
};

export const getWalletTransactions = async (): Promise<WalletTransaction[]> => {
  const response = await apiClient('/wallets/me/transactions');
  return response?.resultData || response?.data || response || [];
};

export const requestWithdrawal = async (amount: number): Promise<WithdrawalRequest> => {
  const response = await apiClient('/withdrawals/request', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
  return response?.resultData || response?.data || response;
};
