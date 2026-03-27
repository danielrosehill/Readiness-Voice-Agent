import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  API_KEY: 'settings:apiKey',
  LANGUAGE: 'settings:language',
  SPEECH_RATE: 'settings:speechRate',
} as const;

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.API_KEY);
}

export async function setApiKey(key: string): Promise<void> {
  return AsyncStorage.setItem(KEYS.API_KEY, key);
}

export async function getLanguage(): Promise<'en' | 'he'> {
  const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
  return (lang as 'en' | 'he') || 'en';
}

export async function setLanguage(lang: 'en' | 'he'): Promise<void> {
  return AsyncStorage.setItem(KEYS.LANGUAGE, lang);
}

export async function getSpeechRate(): Promise<number> {
  const rate = await AsyncStorage.getItem(KEYS.SPEECH_RATE);
  return rate ? parseFloat(rate) : 1.0;
}

export async function setSpeechRate(rate: number): Promise<void> {
  return AsyncStorage.setItem(KEYS.SPEECH_RATE, rate.toString());
}
