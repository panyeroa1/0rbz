
export const BRAND_NAME = "Orbit";
export const GEMINI_MODEL = "gemini-2.5-flash-native-audio-preview-09-2025";

export const ORBIT_VOICES = [
  { id: 'Kore', alias: 'Persephone', metal: 'Gold', gender: 'Female' },
  { id: 'Puck', alias: 'Iris', metal: 'Silver', gender: 'Female' },
  { id: 'Zephyr', alias: 'Athena', metal: 'Platinum', gender: 'Female' },
  { id: 'Charon', alias: 'Hestia', metal: 'Palladium', gender: 'Female' },
  { id: 'Fenrir', alias: 'Artemis', metal: 'Iridium', gender: 'Female' }
];

export const LANGUAGES = [
  { 
    group: 'English', 
    options: [
      { code: 'en-US', name: 'English (United States)' },
      { code: 'en-GB', name: 'English (United Kingdom)' },
      { code: 'en-AU', name: 'English (Australia)' },
      { code: 'en-IN', name: 'English (India)' },
      { code: 'en-CA', name: 'English (Canada)' }
    ]
  },
  { 
    group: 'Spanish', 
    options: [
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-MX', name: 'Spanish (Mexico)' },
      { code: 'es-AR', name: 'Spanish (Argentina)' },
      { code: 'es-CO', name: 'Spanish (Colombia)' },
      { code: 'es-US', name: 'Spanish (United States)' }
    ]
  },
  { 
    group: 'French', 
    options: [
      { code: 'fr-FR', name: 'French (France)' },
      { code: 'fr-CA', name: 'French (Canada)' },
      { code: 'fr-BE', name: 'French (Belgium)' }
    ]
  },
  { 
    group: 'Portuguese', 
    options: [
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'pt-PT', name: 'Portuguese (Portugal)' }
    ]
  },
  { 
    group: 'Chinese', 
    options: [
      { code: 'zh-CN', name: 'Chinese (Mandarin Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Mandarin Traditional)' },
      { code: 'zh-HK', name: 'Chinese (Cantonese)' }
    ]
  },
  { 
    group: 'Arabic', 
    options: [
      { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
      { code: 'ar-EG', name: 'Arabic (Egypt)' },
      { code: 'ar-AE', name: 'Arabic (UAE)' }
    ]
  },
  { 
    group: 'Other Major', 
    options: [
      { code: 'de-DE', name: 'German' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'hi-IN', name: 'Hindi' },
      { code: 'ru-RU', name: 'Russian' },
      { code: 'tr-TR', name: 'Turkish' },
      { code: 'vi-VN', name: 'Vietnamese' }
    ]
  }
];

export const MEETING_TEMPLATES = [
  { id: 'scrum', name: 'Daily Standup', description: 'Brief updates and blockers' },
  { id: 'brainstorm', name: 'Creative Sprint', description: 'Free-form ideation session' },
  { id: 'client', name: 'Client Review', description: 'Polished presentation layout' },
  { id: 'workshop', name: 'Deep Work', description: 'Shared focus with quiet AI' }
];

export const APP_THEME = {
  primary: '#3B82F6',
  accent: '#10B981',
  background: '#050505',
  surface: '#121212',
  surfaceLight: '#1E1E1E'
};
