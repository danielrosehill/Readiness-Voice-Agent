/**
 * Map of checklist IDs to pre-generated audio assets bundled in the APK.
 * To regenerate: GEMINI_API_KEY=... node scripts/generate-audio.mjs
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const audioMap: Record<string, number> = {
  'braced': require('../../assets/audio/braced.mp3'),
  'master': require('../../assets/audio/master.mp3'),
  'sit-daytime': require('../../assets/audio/sit-daytime.mp3'),
  'sit-wfh': require('../../assets/audio/sit-wfh.mp3'),
  'sit-reset': require('../../assets/audio/sit-reset.mp3'),
  'sit-shower': require('../../assets/audio/sit-shower.mp3'),
  'sit-bedtime': require('../../assets/audio/sit-bedtime.mp3'),
  'sit-leaving': require('../../assets/audio/sit-leaving.mp3'),
  'shabbat': require('../../assets/audio/shabbat.mp3'),
  'hfc-app': require('../../assets/audio/hfc-app.mp3'),
  'mamad': require('../../assets/audio/mamad.mp3'),
  'home-safety': require('../../assets/audio/home-safety.mp3'),
};

export function getAudioAsset(checklistId: string): number | undefined {
  return audioMap[checklistId];
}
