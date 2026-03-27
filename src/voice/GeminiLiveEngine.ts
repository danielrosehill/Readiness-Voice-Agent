import { VoiceEngineInterface, VoiceEngineConfig, VoiceEngineEvent } from '../types';
import { GEMINI_MODEL, GEMINI_WS_URL, AUDIO_SAMPLE_RATE_INPUT, AUDIO_SAMPLE_RATE_OUTPUT } from '../utils/constants';

type EventHandler = (event: VoiceEngineEvent) => void;

/**
 * WebSocket client for Gemini 3.1 Flash Live API.
 * Handles bidirectional audio streaming and function calling.
 */
export class GeminiLiveEngine implements VoiceEngineInterface {
  private ws: WebSocket | null = null;
  private handlers: Set<EventHandler> = new Set();
  private connected = false;

  async connect(config: VoiceEngineConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = GEMINI_WS_URL(config.apiKey);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        // Send setup message
        const setup = {
          setup: {
            model: `models/${GEMINI_MODEL}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Aoede',
                  },
                },
              },
              thinkingConfig: {
                thinkingLevel: 'MINIMAL',
              },
            },
            systemInstruction: {
              parts: [{ text: config.systemPrompt }],
            },
            tools: [
              {
                functionDeclarations: config.tools.map((t) => ({
                  name: t.name,
                  description: t.description,
                  parameters: t.parameters,
                })),
              },
            ],
          },
        };

        this.ws?.send(JSON.stringify(setup));
        this.connected = true;
        this.emit({ type: 'connected' });
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          this.handleServerMessage(data);
        } catch (e) {
          this.emit({ type: 'error', message: `Parse error: ${e}` });
        }
      };

      this.ws.onerror = (event) => {
        const msg = 'WebSocket error';
        this.emit({ type: 'error', message: msg });
        if (!this.connected) reject(new Error(msg));
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.emit({ type: 'disconnected' });
      };
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  sendAudio(base64Pcm: string): void {
    if (!this.ws || !this.connected) return;
    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: `audio/pcm;rate=${AUDIO_SAMPLE_RATE_INPUT}`,
              data: base64Pcm,
            },
          ],
        },
      })
    );
  }

  sendText(text: string): void {
    if (!this.ws || !this.connected) return;
    this.ws.send(
      JSON.stringify({
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'text/plain',
              data: btoa(text),
            },
          ],
        },
      })
    );
  }

  sendToolResponse(callId: string, result: Record<string, unknown>): void {
    if (!this.ws || !this.connected) return;
    this.ws.send(
      JSON.stringify({
        toolResponse: {
          functionResponses: [
            {
              id: callId,
              name: callId,
              response: result,
            },
          ],
        },
      })
    );
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

  private handleServerMessage(data: Record<string, unknown>): void {
    // Handle server content (audio, text, function calls)
    const serverContent = data.serverContent as Record<string, unknown> | undefined;
    if (serverContent) {
      const modelTurn = serverContent.modelTurn as { parts?: Array<Record<string, unknown>> } | undefined;
      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          // Audio output
          if (part.inlineData) {
            const inlineData = part.inlineData as { mimeType: string; data: string };
            this.emit({
              type: 'audio',
              data: inlineData.data,
              mimeType: inlineData.mimeType || `audio/pcm;rate=${AUDIO_SAMPLE_RATE_OUTPUT}`,
            });
          }
          // Text transcript from model
          if (typeof part.text === 'string') {
            this.emit({ type: 'transcript', text: part.text, role: 'model' });
          }
        }
      }

      // Turn complete
      if (serverContent.turnComplete) {
        this.emit({ type: 'turnEnd' });
      }
    }

    // Handle tool calls
    const toolCall = data.toolCall as { functionCalls?: Array<{ id: string; name: string; args: Record<string, unknown> }> } | undefined;
    if (toolCall?.functionCalls) {
      for (const fc of toolCall.functionCalls) {
        this.emit({
          type: 'functionCall',
          name: fc.name,
          args: fc.args || {},
          callId: fc.id || fc.name,
        });
      }
    }
  }
}
