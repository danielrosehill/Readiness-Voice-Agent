import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { File, Paths } from 'expo-file-system';
import { ChecklistEntry } from '../types';
import { generateChecklistAudio, buildReadoutScript } from '../voice/GeminiTTS';

export type PlaybackStatus = 'idle' | 'generating' | 'playing' | 'paused' | 'done' | 'error';

export function usePlayback(checklist: ChecklistEntry, apiKey: string) {
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(-1);
  const soundRef = useRef<Audio.Sound | null>(null);
  const abortRef = useRef(false);

  const itemTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playStartTimeRef = useRef(0);
  const totalItems = checklist.items.length;

  const cleanup = useCallback(async () => {
    if (itemTimerRef.current) {
      clearInterval(itemTimerRef.current);
      itemTimerRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // already cleaned up
      }
      soundRef.current = null;
    }
    Speech.stop();
  }, []);

  const generateAndPlay = useCallback(async () => {
    abortRef.current = false;
    setError(null);
    setCurrentItemIndex(0);

    if (!apiKey) {
      setStatus('playing');
      await playWithExpoSpeech();
      return;
    }

    try {
      setStatus('generating');
      const script = buildReadoutScript(checklist.title, checklist.items);
      const result = await generateChecklistAudio(apiKey, script);

      if (abortRef.current) return;

      if (!result) {
        throw new Error('No audio returned from Gemini');
      }

      setStatus('playing');
      await playAudioBase64(result.audioBase64, result.mimeType);
    } catch (e) {
      if (abortRef.current) return;
      console.warn('Gemini TTS failed, falling back to device TTS:', e);
      setStatus('playing');
      await playWithExpoSpeech();
    }
  }, [apiKey, checklist]);

  const playAudioBase64 = async (base64: string, mimeType: string) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      // Write base64 audio to a temp file using expo-file-system/next
      const isWav = mimeType.includes('wav');
      const ext = isWav ? 'wav' : 'mp3';
      const file = new File(Paths.cache, `checklist-readout.${ext}`);
      // Decode base64 to bytes and write
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      file.write(bytes);

      const { sound } = await Audio.Sound.createAsync({ uri: file.uri });
      soundRef.current = sound;

      const statusResult = await sound.getStatusAsync();
      const durationMs = statusResult.isLoaded ? statusResult.durationMillis ?? 0 : 0;
      const msPerItem = durationMs > 0 ? durationMs / totalItems : 3000;

      playStartTimeRef.current = Date.now();
      itemTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - playStartTimeRef.current;
        const idx = Math.min(Math.floor(elapsed / msPerItem), totalItems - 1);
        setCurrentItemIndex(idx);
      }, 500);

      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) {
          if (itemTimerRef.current) clearInterval(itemTimerRef.current);
          setCurrentItemIndex(totalItems - 1);
          setStatus('done');
        }
      });

      await sound.playAsync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Playback failed');
      setStatus('error');
    }
  };

  const playWithExpoSpeech = async () => {
    for (let i = 0; i < checklist.items.length; i++) {
      if (abortRef.current) return;

      setCurrentItemIndex(i);
      const item = checklist.items[i];
      let text = `Item ${i + 1}: ${item.label}.`;
      if (item.critical) text += ' Critical item.';
      if (item.subItems?.length) {
        text += ' ' + item.subItems.join('. ') + '.';
      }

      await new Promise<void>((resolve) => {
        Speech.speak(text, {
          language: 'en-US',
          rate: 0.95,
          onDone: resolve,
          onError: () => resolve(),
          onStopped: () => resolve(),
        });
      });
    }

    if (!abortRef.current) {
      setStatus('done');
    }
  };

  const stop = useCallback(async () => {
    abortRef.current = true;
    await cleanup();
    setStatus('idle');
    setCurrentItemIndex(-1);
  }, [cleanup]);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      if (itemTimerRef.current) clearInterval(itemTimerRef.current);
      setStatus('paused');
    }
  }, []);

  const resume = useCallback(async () => {
    if (soundRef.current) {
      playStartTimeRef.current = Date.now() - (currentItemIndex * 3000);
      itemTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - playStartTimeRef.current;
        const idx = Math.min(Math.floor(elapsed / 3000), totalItems - 1);
        setCurrentItemIndex(idx);
      }, 500);
      await soundRef.current.playAsync();
      setStatus('playing');
    }
  }, [currentItemIndex, totalItems]);

  useEffect(() => {
    return () => {
      abortRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    error,
    currentItemIndex,
    generateAndPlay,
    stop,
    pause,
    resume,
  };
}
