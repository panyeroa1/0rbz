
export type AppState = 'auth' | 'dashboard' | 'meeting';
export type Theme = 'dark' | 'light' | 'cosmic';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferredLanguage?: string;
  theme?: Theme;
}

export interface MeetingConfig {
  roomId: string;
  isHost: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  targetLanguage: string;
  template?: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
  };
}

export interface RecentSession {
  id: string;
  title: string;
  date: string;
  participants: number;
  summary: string;
}

export interface TranscriptionEntry {
  id: string;
  text: string;
  sender: 'user' | 'model';
  timestamp: number;
}

export type SidebarTab = 'ai' | 'tasks' | 'whiteboard' | 'polls' | 'participants' | 'settings' | 'search';

export interface Task {
  id: string;
  text: string;
  assignee: string;
  completed: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  isOpen: boolean;
}

export interface HandRaise {
  userId: string;
  userName: string;
  timestamp: number;
}
