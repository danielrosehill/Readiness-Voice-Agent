import * as Speech from 'expo-speech';
import { VoiceEngineInterface, VoiceEngineConfig, VoiceEngineEvent, ChecklistItem } from '../types';

type EventHandler = (event: VoiceEngineEvent) => void;

/** Keywords mapped to tool calls for offline command recognition */
const COMMAND_MAP: Record<string, string> = {
  done: 'markItemDone',
  yes: 'markItemDone',
  check: 'markItemDone',
  checked: 'markItemDone',
  next: 'markItemDone',
  skip: 'skipItem',
  back: 'goBack',
  'go back': 'goBack',
  previous: 'goBack',
  repeat: '__repeat',
  'say again': '__repeat',
  'tell me more': '__details',
  details: '__details',
  more: '__details',
  'how many': 'getProgress',
  'how many left': 'getProgress',
  progress: 'getProgress',
  stop: '__stop',
  pause: '__stop',
  restart: '__restart',
};

/**
 * Offline fallback voice engine using Android on-device STT/TTS.
 * Uses expo-speech for TTS and keyword matching for commands.
 * Note: STT requires @react-native-voice/voice which needs native module.
 * For MVP, this engine works in a tap-to-speak mode with TTS output.
 */
export class OfflineEngine implements VoiceEngineInterface {
  private handlers: Set<EventHandler> = new Set();
  private _connected = false;
  private currentItemIndex = 0;
  private items: ChecklistItem[] = [];
  private speechRate = 1.0;

  async connect(config: VoiceEngineConfig): Promise<void> {
    this._connected = true;
    this.emit({ type: 'connected' });
  }

  disconnect(): void {
    Speech.stop();
    this._connected = false;
    this.emit({ type: 'disconnected' });
  }

  /** Not used in offline mode — commands come via sendText */
  sendAudio(_base64Pcm: string): void {}

  sendText(text: string): void {
    const lower = text.toLowerCase().trim();

    // Try to match a command
    for (const [keyword, action] of Object.entries(COMMAND_MAP)) {
      if (lower.includes(keyword)) {
        this.handleCommand(action);
        return;
      }
    }

    // Unrecognized — treat as confirmation
    this.emit({
      type: 'functionCall',
      name: 'markItemDone',
      args: { itemIndex: this.currentItemIndex },
      callId: `offline-${Date.now()}`,
    });
  }

  sendToolResponse(_callId: string, result: Record<string, unknown>): void {
    // In offline mode, we handle responses internally
    if (typeof result.nextItemIndex === 'number') {
      this.currentItemIndex = result.nextItemIndex as number;
    }
  }

  onEvent(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  isConnected(): boolean {
    return this._connected;
  }

  /** Set the checklist items for this session */
  setItems(items: ChecklistItem[]): void {
    this.items = items;
  }

  setSpeechRate(rate: number): void {
    this.speechRate = rate;
  }

  /** Speak an item aloud using TTS */
  speakItem(index: number): void {
    if (index >= this.items.length) return;
    const item = this.items[index];
    this.currentItemIndex = index;

    let text = item.label;
    if (item.critical) text = `Critical item. ${text}`;

    this.emit({ type: 'turnStart' });
    Speech.speak(text, {
      rate: this.speechRate,
      onDone: () => this.emit({ type: 'turnEnd' }),
    });
  }

  /** Speak item details aloud */
  speakDetails(index: number): void {
    if (index >= this.items.length) return;
    const item = this.items[index];
    const parts: string[] = [];

    if (item.details) parts.push(item.details);
    if (item.subItems?.length) {
      parts.push('Sub items: ' + item.subItems.join('. '));
    }

    if (parts.length === 0) {
      parts.push('No additional details for this item.');
    }

    this.emit({ type: 'turnStart' });
    Speech.speak(parts.join('. '), {
      rate: this.speechRate,
      onDone: () => this.emit({ type: 'turnEnd' }),
    });
  }

  private handleCommand(action: string): void {
    switch (action) {
      case '__repeat':
        this.speakItem(this.currentItemIndex);
        break;
      case '__details':
        this.speakDetails(this.currentItemIndex);
        break;
      case '__stop':
        Speech.stop();
        this.disconnect();
        break;
      case '__restart':
        this.currentItemIndex = 0;
        this.speakItem(0);
        break;
      default:
        this.emit({
          type: 'functionCall',
          name: action,
          args: action === 'markItemDone' || action === 'skipItem'
            ? { itemIndex: this.currentItemIndex }
            : {},
          callId: `offline-${Date.now()}`,
        });
    }
  }

  private emit(event: VoiceEngineEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
