export interface ChecklistItem {
  id: string;
  label: string;
  details?: string;
  critical?: boolean;
  subItems?: string[];
}

export interface ChecklistSection {
  id: string;
  title: string;
  description?: string;
  color: string;
  items: ChecklistItem[];
}

export interface PantryCategory {
  category: string;
  items: string;
  shelfLife: string;
}

/** A selectable checklist entry shown on the home screen */
export interface ChecklistEntry {
  id: string;
  title: string;
  description?: string;
  color: string;
  category: 'quick' | 'master' | 'situational' | 'special';
  /** Flat list of all items across all sections */
  items: ChecklistItem[];
}

/** Tracks progress through a single checklist session */
export interface SessionState {
  checklistId: string;
  currentIndex: number;
  checkedItems: Set<string>;
  skippedItems: Set<string>;
  status: 'idle' | 'active' | 'paused' | 'complete';
}

/** Events emitted by the voice engine */
export type VoiceEngineEvent =
  | { type: 'audio'; data: string; mimeType: string }
  | { type: 'transcript'; text: string; role: 'model' | 'user' }
  | { type: 'functionCall'; name: string; args: Record<string, unknown>; callId: string }
  | { type: 'turnStart' }
  | { type: 'turnEnd' }
  | { type: 'error'; message: string }
  | { type: 'connected' }
  | { type: 'disconnected' };

/** Common interface for both online (Gemini) and offline voice engines */
export interface VoiceEngineInterface {
  connect(config: VoiceEngineConfig): Promise<void>;
  disconnect(): void;
  sendAudio(base64Pcm: string): void;
  sendText(text: string): void;
  sendToolResponse(callId: string, result: Record<string, unknown>): void;
  onEvent(handler: (event: VoiceEngineEvent) => void): () => void;
  isConnected(): boolean;
}

export interface VoiceEngineConfig {
  apiKey: string;
  systemPrompt: string;
  tools: ToolDeclaration[];
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}
