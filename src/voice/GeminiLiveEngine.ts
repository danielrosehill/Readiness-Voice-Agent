import { GoogleGenAI, Modality, Type, type Session, type LiveServerMessage } from '@google/genai';
import { VoiceEngineInterface, VoiceEngineConfig, VoiceEngineEvent } from '../types';
import { GEMINI_MODEL, AUDIO_SAMPLE_RATE_INPUT } from '../utils/constants';

type EventHandler = (event: VoiceEngineEvent) => void;

/**
 * Gemini Live voice engine using the @google/genai SDK.
 * Handles bidirectional audio streaming, transcription, and tool calling.
 */
export class GeminiLiveEngine implements VoiceEngineInterface {
  private session: Session | null = null;
  private handlers: Set<EventHandler> = new Set();
  private connected = false;

  async connect(config: VoiceEngineConfig): Promise<void> {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });

    this.session = await ai.live.connect({
      model: GEMINI_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: { parts: [{ text: config.systemPrompt }] },
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        tools: [
          {
            functionDeclarations: config.tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: {
                type: Type.OBJECT,
                properties: Object.fromEntries(
                  Object.entries(t.parameters.properties).map(([k, v]) => [
                    k,
                    { type: v.type.toUpperCase() as Type, description: v.description, enum: v.enum },
                  ])
                ),
                required: t.parameters.required,
              },
            })),
          },
        ],
      },
      callbacks: {
        onopen: () => {
          this.connected = true;
          this.emit({ type: 'connected' });
        },
        onmessage: (message: LiveServerMessage) => {
          this.handleMessage(message);
        },
        onerror: (e: ErrorEvent) => {
          this.emit({ type: 'error', message: e.message || 'Connection error' });
        },
        onclose: () => {
          this.connected = false;
          this.emit({ type: 'disconnected' });
        },
      },
    });
  }

  disconnect(): void {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
    this.connected = false;
  }

  sendAudio(base64Pcm: string): void {
    if (!this.session || !this.connected) return;
    this.session.sendRealtimeInput({
      audio: {
        data: base64Pcm,
        mimeType: `audio/pcm;rate=${AUDIO_SAMPLE_RATE_INPUT}`,
      },
    });
  }

  sendText(text: string): void {
    if (!this.session || !this.connected) return;
    this.session.sendClientContent({
      turns: [{ role: 'user', parts: [{ text }] }],
      turnComplete: true,
    });
  }

  sendToolResponse(callId: string, result: Record<string, unknown>): void {
    if (!this.session || !this.connected) return;
    this.session.sendToolResponse({
      functionResponses: [
        {
          id: callId,
          name: callId,
          response: result,
        },
      ],
    });
  }

  onEvent(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private emit(event: VoiceEngineEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  private handleMessage(message: LiveServerMessage): void {
    const sc = message.serverContent;

    if (sc) {
      // Audio and text from model turn
      if (sc.modelTurn?.parts) {
        for (const part of sc.modelTurn.parts) {
          if (part.inlineData) {
            this.emit({
              type: 'audio',
              data: part.inlineData.data!,
              mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
            });
          }
          if (typeof part.text === 'string') {
            this.emit({ type: 'transcript', text: part.text, role: 'model' });
          }
        }
      }

      // Transcriptions
      if (sc.inputTranscription?.text) {
        this.emit({ type: 'transcript', text: sc.inputTranscription.text, role: 'user' });
      }
      if (sc.outputTranscription?.text) {
        this.emit({ type: 'transcript', text: sc.outputTranscription.text, role: 'model' });
      }

      // Turn complete
      if (sc.turnComplete) {
        this.emit({ type: 'turnEnd' });
      }

      // Interruption — model was interrupted by user
      if (sc.interrupted) {
        this.emit({ type: 'turnEnd' });
      }
    }

    // Tool calls
    if (message.toolCall?.functionCalls) {
      for (const fc of message.toolCall.functionCalls) {
        this.emit({
          type: 'functionCall',
          name: fc.name!,
          args: (fc.args as Record<string, unknown>) || {},
          callId: fc.id || fc.name!,
        });
      }
    }
  }
}
