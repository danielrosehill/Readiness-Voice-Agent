import { Audio } from 'expo-av';
import { File, Paths } from 'expo-file-system';

/**
 * Plays streaming base64 PCM audio chunks from Gemini Live.
 * Buffers chunks and plays them sequentially through expo-av.
 *
 * Strategy: accumulate PCM chunks into a buffer, periodically flush
 * to a WAV file and play it. This provides near-real-time playback
 * while working within expo-av's file-based API.
 */
export class AudioChunkPlayer {
  private sampleRate: number;
  private buffer: Uint8Array[] = [];
  private bufferBytes = 0;
  private playing = false;
  private stopped = false;
  private currentSound: Audio.Sound | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private fileCounter = 0;

  // Flush every ~200ms of audio (sampleRate * 2 bytes * 0.2s)
  private readonly FLUSH_THRESHOLD_BYTES: number;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
    this.FLUSH_THRESHOLD_BYTES = sampleRate * 2 * 0.3; // 300ms of 16-bit mono audio

    // Periodic flush in case chunks come slowly
    this.flushTimer = setInterval(() => {
      if (this.bufferBytes > 0 && !this.playing) {
        this.flush();
      }
    }, 400);
  }

  /** Add a base64-encoded PCM chunk to the playback buffer. */
  enqueue(base64Pcm: string): void {
    if (this.stopped) return;

    const bytes = Uint8Array.from(atob(base64Pcm), (c) => c.charCodeAt(0));
    this.buffer.push(bytes);
    this.bufferBytes += bytes.length;

    // Flush when we have enough buffered
    if (this.bufferBytes >= this.FLUSH_THRESHOLD_BYTES && !this.playing) {
      this.flush();
    }
  }

  /** Stop playback and clear buffers. */
  stop(): void {
    this.stopped = true;
    this.buffer = [];
    this.bufferBytes = 0;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.currentSound) {
      this.currentSound.stopAsync().catch(() => {});
      this.currentSound.unloadAsync().catch(() => {});
      this.currentSound = null;
    }
  }

  /** Flush buffered PCM to a WAV file and play it. */
  private async flush(): Promise<void> {
    if (this.bufferBytes === 0 || this.stopped) return;

    // Grab current buffer
    const chunks = this.buffer;
    const totalBytes = this.bufferBytes;
    this.buffer = [];
    this.bufferBytes = 0;

    // Combine chunks
    const pcm = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      pcm.set(chunk, offset);
      offset += chunk.length;
    }

    // Create WAV with header
    const wav = this.createWav(pcm);

    // Write to temp file
    this.fileCounter++;
    const file = new File(Paths.cache, `gemini_audio_${this.fileCounter}.wav`);
    file.write(wav);

    // Play
    this.playing = true;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: file.uri });
      this.currentSound = sound;

      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            resolve();
          }
        });
        sound.playAsync();
      });

      await sound.unloadAsync();
    } catch (e) {
      // Playback error — skip this chunk
      console.warn('Audio playback error:', e);
    } finally {
      this.playing = false;
      this.currentSound = null;

      // If more data accumulated while playing, flush again
      if (this.bufferBytes > 0 && !this.stopped) {
        this.flush();
      }
    }
  }

  /** Create a WAV file buffer from raw PCM data. */
  private createWav(pcm: Uint8Array): Uint8Array {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = this.sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcm.length;
    const headerSize = 44;

    const wav = new Uint8Array(headerSize + dataSize);
    const view = new DataView(wav.buffer);

    // RIFF header
    this.writeString(wav, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(wav, 8, 'WAVE');

    // fmt chunk
    this.writeString(wav, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true);  // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(wav, 36, 'data');
    view.setUint32(40, dataSize, true);
    wav.set(pcm, headerSize);

    return wav;
  }

  private writeString(buf: Uint8Array, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      buf[offset + i] = str.charCodeAt(i);
    }
  }
}
