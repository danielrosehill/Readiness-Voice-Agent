import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { ChecklistEntry, VoiceEngineEvent } from '../types';
import { GeminiLiveEngine } from '../voice/GeminiLiveEngine';
import { OfflineEngine } from '../voice/OfflineEngine';
import { buildSystemPrompt } from '../data/systemPrompt';
import { checklistTools } from '../data/tools';
import { useChecklistState } from './useChecklistState';
import { AUDIO_SAMPLE_RATE_INPUT } from '../utils/constants';

export type AgentState = 'connecting' | 'listening' | 'speaking' | 'idle' | 'error' | 'disconnected';

export function useVoiceSession(checklist: ChecklistEntry, apiKey: string) {
  const checklistState = useChecklistState(checklist);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<GeminiLiveEngine | OfflineEngine | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isOnline = useRef(true); // Simplified — could use NetInfo

  const addTranscript = useCallback((text: string, role: 'model' | 'user') => {
    setTranscript((prev) => [...prev.slice(-20), `${role === 'model' ? 'Agent' : 'You'}: ${text}`]);
  }, []);

  const handleToolCall = useCallback(
    (name: string, args: Record<string, unknown>, callId: string) => {
      let result: Record<string, unknown> = {};

      switch (name) {
        case 'markItemDone': {
          const idx = (args.itemIndex as number) ?? checklistState.stateRef.current.currentIndex;
          checklistState.markDone(idx);
          const progress = checklistState.getProgress();
          result = { success: true, nextItemIndex: idx + 1, ...progress };
          break;
        }
        case 'skipItem': {
          const idx = (args.itemIndex as number) ?? checklistState.stateRef.current.currentIndex;
          checklistState.skip(idx);
          const progress = checklistState.getProgress();
          result = { success: true, nextItemIndex: idx + 1, ...progress };
          break;
        }
        case 'goBack':
          checklistState.goBack();
          result = { success: true, currentIndex: Math.max(0, checklistState.stateRef.current.currentIndex - 1) };
          break;
        case 'getProgress':
          result = checklistState.getProgress();
          break;
        case 'completeSession':
          checklistState.complete();
          result = { success: true, ...checklistState.getProgress() };
          break;
        default:
          result = { error: `Unknown tool: ${name}` };
      }

      engineRef.current?.sendToolResponse(callId, result);
    },
    [checklistState]
  );

  const handleEvent = useCallback(
    (event: VoiceEngineEvent) => {
      switch (event.type) {
        case 'connected':
          setAgentState('listening');
          break;
        case 'disconnected':
          setAgentState('disconnected');
          break;
        case 'turnStart':
          setAgentState('speaking');
          break;
        case 'turnEnd':
          setAgentState('listening');
          break;
        case 'transcript':
          addTranscript(event.text, event.role);
          break;
        case 'functionCall':
          handleToolCall(event.name, event.args, event.callId);
          break;
        case 'audio':
          // Audio playback would be handled here.
          // For Gemini Live, audio plays through the WebSocket connection natively.
          // For a production app, we'd decode base64 PCM and play through expo-av.
          break;
        case 'error':
          setError(event.message);
          setAgentState('error');
          break;
      }
    },
    [addTranscript, handleToolCall]
  );

  const startSession = useCallback(async () => {
    try {
      setAgentState('connecting');
      setError(null);
      setTranscript([]);
      checklistState.start();

      // Request audio permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission is required');
        setAgentState('error');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create engine
      const useOnline = isOnline.current && apiKey.length > 0;
      const engine = useOnline ? new GeminiLiveEngine() : new OfflineEngine();
      engineRef.current = engine;

      // Subscribe to events
      engine.onEvent(handleEvent);

      // Connect
      const systemPrompt = buildSystemPrompt(checklist);
      await engine.connect({
        apiKey,
        systemPrompt,
        tools: checklistTools,
      });

      // If offline engine, set items and speak the first one
      if (engine instanceof OfflineEngine) {
        engine.setItems(checklist.items);
        engine.speakItem(0);
      }

      // Start recording for online mode
      if (useOnline) {
        await startRecording();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start session');
      setAgentState('error');
    }
  }, [apiKey, checklist, checklistState, handleEvent]);

  const stopSession = useCallback(async () => {
    await stopRecording();
    engineRef.current?.disconnect();
    engineRef.current = null;
    setAgentState('disconnected');
  }, []);

  const startRecording = async () => {
    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: AUDIO_SAMPLE_RATE_INPUT,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: AUDIO_SAMPLE_RATE_INPUT,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      await recording.startAsync();
      recordingRef.current = recording;

      // Poll for audio data and send to engine
      // In a production app, we'd use a streaming approach.
      // For MVP, we use short recording segments.
      pollAudio();
    } catch (e) {
      console.error('Failed to start recording:', e);
    }
  };

  const pollAudio = () => {
    const interval = setInterval(async () => {
      if (!recordingRef.current || !engineRef.current?.isConnected()) {
        clearInterval(interval);
        return;
      }

      try {
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording && status.metering != null) {
          // Audio is being captured — the Gemini Live API receives it through the WebSocket.
          // With expo-av, we need to periodically stop/start recording to get chunks.
          // This is a simplified approach — production would use a native audio streaming module.
        }
      } catch {
        clearInterval(interval);
      }
    }, 500);
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // Already stopped
      }
      recordingRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      engineRef.current?.disconnect();
    };
  }, []);

  return {
    checklistState,
    agentState,
    transcript,
    error,
    startSession,
    stopSession,
  };
}
