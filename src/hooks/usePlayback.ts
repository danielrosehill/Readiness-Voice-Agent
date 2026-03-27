import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { ChecklistEntry } from '../types';
import { getAudioAsset } from '../data/audioAssets';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'done' | 'error';

export function usePlayback(checklist: ChecklistEntry) {
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

  const play = useCallback(async () => {
    abortRef.current = false;
    setError(null);
    setCurrentItemIndex(0);

    const asset = getAudioAsset(checklist.id);
    if (asset) {
      setStatus('playing');
      await playBundledAudio(asset);
    } else {
      // Fallback: device TTS
      setStatus('playing');
      await playWithExpoSpeech();
    }
  }, [checklist]);

  const playBundledAudio = async (asset: number) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(asset);
      soundRef.current = sound;

      // Get duration to estimate item progress
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
      // Fallback to device TTS
      console.warn('Bundled audio playback failed, using device TTS:', e);
      await playWithExpoSpeech();
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
      // Re-estimate timing from current position
      const s = await soundRef.current.getStatusAsync();
      if (s.isLoaded) {
        const durationMs = s.durationMillis ?? 0;
        const positionMs = s.positionMillis ?? 0;
        const msPerItem = durationMs > 0 ? durationMs / totalItems : 3000;
        playStartTimeRef.current = Date.now() - positionMs;
        itemTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - playStartTimeRef.current;
          const idx = Math.min(Math.floor(elapsed / msPerItem), totalItems - 1);
          setCurrentItemIndex(idx);
        }, 500);
      }
      await soundRef.current.playAsync();
      setStatus('playing');
    }
  }, [totalItems]);

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
    play,
    stop,
    pause,
    resume,
  };
}
