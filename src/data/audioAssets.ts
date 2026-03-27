/**
 * Map of checklist IDs to pre-generated audio assets bundled in the APK.
 *
 * To regenerate with Gemini TTS:
 *   GEMINI_API_KEY=... node scripts/generate-audio.mjs
 *
 * To regenerate with Chatterbox (Herman/Corn voices) via Modal:
 *   python scripts/generate-audio-modal.py
 */

/* eslint-disable @typescript-eslint/no-var-requires */

function tryRequire(path: string): number | null {
  try {
    return require(path);
  } catch {
    return null;
  }
}

const audioMap: Record<string, number | null> = {
  'braced': tryRequire('../../assets/audio/braced.mp3'),
  'master': tryRequire('../../assets/audio/master.mp3'),
  'sit-daytime': tryRequire('../../assets/audio/sit-daytime.mp3'),
  'sit-wfh': tryRequire('../../assets/audio/sit-wfh.mp3'),
  'sit-reset': tryRequire('../../assets/audio/sit-reset.mp3'),
  'sit-shower': tryRequire('../../assets/audio/sit-shower.mp3'),
  'sit-bedtime': tryRequire('../../assets/audio/sit-bedtime.mp3'),
  'sit-leaving': tryRequire('../../assets/audio/sit-leaving.mp3'),
  'shabbat': tryRequire('../../assets/audio/shabbat.mp3'),
  'hfc-app': tryRequire('../../assets/audio/hfc-app.mp3'),
  'mamad': tryRequire('../../assets/audio/mamad.mp3'),
  'go-bag': tryRequire('../../assets/audio/go-bag.mp3'),
  'home-safety': tryRequire('../../assets/audio/home-safety.mp3'),
};

export function getAudioAsset(checklistId: string): number | undefined {
  const asset = audioMap[checklistId];
  return asset ?? undefined;
}
