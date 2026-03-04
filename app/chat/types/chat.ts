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

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'audio';
  size: number;
}

export interface Message {
  id: string;
  sender: 'doctor' | 'patient';
  text: string;
  timestamp: string;
  read: boolean;
  attachment?: FileAttachment;
}

export interface ChatState {
  selectedPatientId: string | null;
  messages: Message[];
  isLoading: boolean;
  inputValue: string;
}

export type CallType = 'video' | 'voice' | null;

export interface CallState {
  type: CallType;
  isActive: boolean;
  patientId: string | null;
}
