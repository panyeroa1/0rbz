
export type AppState = 'auth' | 'dashboard' | 'meeting';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface MeetingConfig {
  roomId: string;
  isHost: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  targetLanguage: string;
}

export interface TranscriptionEntry {
  id: string;
  text: string;
  sender: 'user' | 'model';
  timestamp: number;
}
