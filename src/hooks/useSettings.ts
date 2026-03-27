import { useCallback, useEffect, useState } from 'react';
import * as storage from '../utils/storage';

export interface Settings {
  apiKey: string;
  language: 'en' | 'he';
  speechRate: number;
  loaded: boolean;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    apiKey: '',
    language: 'en',
    speechRate: 1.0,
    loaded: false,
  });

  useEffect(() => {
    (async () => {
      const [apiKey, language, speechRate] = await Promise.all([
        storage.getApiKey(),
        storage.getLanguage(),
        storage.getSpeechRate(),
      ]);
      setSettings({
        apiKey: apiKey || '',
        language,
        speechRate,
        loaded: true,
      });
    })();
  }, []);

  const updateApiKey = useCallback(async (key: string) => {
    await storage.setApiKey(key);
    setSettings((s) => ({ ...s, apiKey: key }));
  }, []);

  const updateLanguage = useCallback(async (lang: 'en' | 'he') => {
    await storage.setLanguage(lang);
    setSettings((s) => ({ ...s, language: lang }));
  }, []);

  const updateSpeechRate = useCallback(async (rate: number) => {
    await storage.setSpeechRate(rate);
    setSettings((s) => ({ ...s, speechRate: rate }));
  }, []);

  return { settings, updateApiKey, updateLanguage, updateSpeechRate };
}
