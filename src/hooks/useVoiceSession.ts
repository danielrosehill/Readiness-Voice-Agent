import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import LiveAudioStream from 'react-native-live-audio-stream';
import { ChecklistEntry, VoiceEngineEvent } from '../types';
import { GeminiLiveEngine } from '../voice/GeminiLiveEngine';
import { OfflineEngine } from '../voice/OfflineEngine';
import { buildSystemPrompt } from '../data/systemPrompt';
import { checklistTools } from '../data/tools';
import { useChecklistState } from './useChecklistState';
import { AUDIO_SAMPLE_RATE_INPUT, AUDIO_SAMPLE_RATE_OUTPUT } from '../utils/constants';
import { AudioChunkPlayer } from '../voice/AudioChunkPlayer';

export type AgentState = 'connecting' | 'listening' | 'speaking' | 'idle' | 'error' | 'disconnected';

export function useVoiceSession(checklist: ChecklistEntry, apiKey: string) {
  const checklistState = useChecklistState(checklist);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<GeminiLiveEngine | OfflineEngine | null>(null);
  const playerRef = useRef<AudioChunkPlayer | null>(null);
  const streamingRef = useRef(false);

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
          // Play audio chunks through the player
          setAgentState('speaking');
          playerRef.current?.enqueue(event.data);
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

      // Configure audio mode for simultaneous recording + playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create engine
      const useOnline = apiKey.length > 0;
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

      // Start mic streaming for online mode
      if (useOnline) {
        // Initialize audio chunk player for output
        playerRef.current = new AudioChunkPlayer(AUDIO_SAMPLE_RATE_OUTPUT);

        // Start live audio stream from mic
        LiveAudioStream.init({
          sampleRate: AUDIO_SAMPLE_RATE_INPUT,
          channels: 1,
          bitsPerSample: 16,
          audioSource: 6, // VOICE_RECOGNITION on Android
          bufferSize: 4096,
          wavFile: '', // empty = don't save to file, just stream
        });

        LiveAudioStream.on('data', (base64Chunk: string) => {
          engineRef.current?.sendAudio(base64Chunk);
        });

        LiveAudioStream.start();
        streamingRef.current = true;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start session');
      setAgentState('error');
    }
  }, [apiKey, checklist, checklistState, handleEvent]);

  const stopSession = useCallback(async () => {
    // Stop mic streaming
    if (streamingRef.current) {
      LiveAudioStream.stop();
      streamingRef.current = false;
    }

    // Stop audio player
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = null;
    }

    // Disconnect engine
    engineRef.current?.disconnect();
    engineRef.current = null;
    setAgentState('disconnected');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingRef.current) {
        LiveAudioStream.stop();
        streamingRef.current = false;
      }
      playerRef.current?.stop();
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
