export const GEMINI_MODEL = 'gemini-3.1-flash-live-preview';

export const GEMINI_WS_URL = (apiKey: string) =>
  `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

export const AUDIO_SAMPLE_RATE_INPUT = 16000;
export const AUDIO_SAMPLE_RATE_OUTPUT = 24000;

export const Colors = {
  background: '#111111',
  surface: '#1a1a1a',
  surfaceLight: '#252525',
  text: '#e5e5e5',
  textSecondary: '#999999',
  accent: '#4a9eff',
  critical: '#e74c3c',
  success: '#2ecc71',
  warning: '#f39c12',
  border: '#333333',
} as const;
