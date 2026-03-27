import { AUDIO_SAMPLE_RATE_OUTPUT } from '../utils/constants';

const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const GEMINI_REST_URL = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${apiKey}`;

/**
 * Generate spoken audio for a checklist using Gemini TTS.
 * Returns base64-encoded PCM audio data.
 */
export async function generateChecklistAudio(
  apiKey: string,
  text: string,
): Promise<{ audioBase64: string; mimeType: string } | null> {
  const body = {
    contents: [
      {
        parts: [{ text }],
      },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Kore',
          },
        },
      },
    },
  };

  const res = await fetch(GEMINI_REST_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini TTS error ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts;
  if (!parts?.length) return null;

  for (const part of parts) {
    if (part.inlineData) {
      return {
        audioBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || `audio/L16;rate=${AUDIO_SAMPLE_RATE_OUTPUT}`,
      };
    }
  }

  return null;
}

/**
 * Build a natural script from a checklist for TTS readout.
 */
export function buildReadoutScript(
  title: string,
  items: Array<{ label: string; critical?: boolean; subItems?: string[]; details?: string }>,
): string {
  const lines: string[] = [];
  lines.push(`${title}. Here are the items to check.`);
  lines.push('');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const num = i + 1;
    let line = `Item ${num}: ${item.label}.`;
    if (item.critical) {
      line += ' This is a critical item.';
    }
    if (item.subItems?.length) {
      line += ' Check: ' + item.subItems.join('. ') + '.';
    }
    if (item.details) {
      line += ` Note: ${item.details}.`;
    }
    lines.push(line);
  }

  lines.push('');
  lines.push(`That completes the ${title}. ${items.length} items total.`);
  return lines.join('\n');
}
