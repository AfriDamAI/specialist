export interface Patient {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'session-ended';
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  sessionActive: boolean;
}

export interface Message {
  id: string;
  sender: 'doctor' | 'patient';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatState {
  selectedPatientId: string | null;
  messages: Message[];
  isLoading: boolean;
  inputValue: string;
}
