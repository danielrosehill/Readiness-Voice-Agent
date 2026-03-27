#!/usr/bin/env node
/**
 * Pre-generate TTS audio for all checklists using Gemini TTS API.
 * Outputs MP3/WAV files to assets/audio/ for bundling into the APK.
 *
 * Usage:
 *   GEMINI_API_KEY=AIza... node scripts/generate-audio.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = resolve(__dirname, '..', 'assets', 'audio');
const MODEL = 'gemini-2.5-flash-preview-tts';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('ERROR: Set GEMINI_API_KEY environment variable');
  process.exit(1);
}

mkdirSync(AUDIO_DIR, { recursive: true });

// ─── Checklist definitions (mirrors src/data/checklists.ts) ───

const checklists = [
  {
    id: 'braced',
    title: 'Quick Smoke Test — BRACED',
    items: [
      { label: 'B — Bag', critical: true, subItems: ['Position by door & zipped', 'Contents verified'] },
      { label: 'R — Route', critical: true, subItems: ['Hallway clear', 'Door unlockable quickly'] },
      { label: 'A — Alerts', critical: true, subItems: ['Phone on and charged', 'HFC app running', 'Correct alert area set', 'Wireless emergency alerts enabled', 'DND override verified'] },
      { label: 'C — Cover', critical: true, subItems: ['Three shelter locations known', 'Routes walkable'] },
      { label: 'E — Essentials', critical: true, subItems: ['Water supply accessible (72-hour minimum)', 'Not expired'] },
      { label: 'D — Dependents', critical: true, subItems: ['Headcount verified — all present or accounted for', 'All contactable'] },
    ],
  },
  {
    id: 'master',
    title: 'Master Checklist',
    items: [
      { label: 'Smartphone', critical: true, subItems: ['On person or location known', 'Battery level OK or charging'] },
      { label: 'Smartphone Configuration', critical: true, subItems: ['Powered on', 'Location services enabled', 'HFC app installed and configured', 'HFC app running', 'Correct alert area validated', 'Emergency wireless alerts activated'] },
      { label: 'Computer', subItems: ['Red Alert app for browser is active', 'Correct location set'] },
      { label: 'Water', critical: true, subItems: ['72 hours supply ready and accessible', 'Resupplied when necessary'] },
      { label: 'Food', critical: true, subItems: ['Pantry goods stocked', 'Resupplied when necessary'] },
      { label: 'Torch', subItems: ['Accessible', 'Hand crank or battery with reserve'] },
      { label: 'Hallway', critical: true, subItems: ['Clear of obstructions', 'Navigable in the dark'] },
      { label: 'Fire Safety', subItems: ['Fire extinguisher accessible', 'Smoke detector installed and tested'] },
      { label: 'Escape Routes', subItems: ['Primary exit identified', 'Secondary exit identified', 'Routes clear of obstacles'] },
      { label: 'Baby Carry', subItems: ['By front door', 'Ready to use'] },
      { label: 'Mamad', subItems: ['Prepared', 'Inspected'] },
      { label: 'Go Bag — Prepared', critical: true, subItems: ['By door', 'Zipped or sealed'] },
      { label: 'Go Bag — Contents Basic', critical: true, subItems: ['Phone charger and cable', 'Power bank', 'Essential medications', 'Torch', 'N95 mask'] },
      { label: 'Go Bag — Contents Additional', subItems: ['Emergency whistle', 'AM/FM radio', 'First aid kit', 'Travel router', 'Caffeine pills'] },
      { label: 'Go Bag — Overnight', subItems: ['Religious effects', 'Food and drink', 'Eye mask and earplugs', 'Water bottles', 'Tent or blanket'] },
      { label: 'Travel Documents', subItems: ['Passports packed and validated', 'Cash on hand', 'National IDs packed'] },
      { label: 'Dependents', critical: true, subItems: ['All household members present or accounted for', 'All contactable'] },
      { label: 'Baby Essential Supplies', critical: true, subItems: ['Diapers', 'Wipes', 'Pacifier', 'Formula', 'Bottle', 'Changing mat'] },
      { label: 'Baby Ready To Go', critical: true, subItems: ['Clothed or clothes by bed', 'Babywear by door', 'Fed', 'Cleaned'] },
      { label: 'Clothing Daytime', critical: true, subItems: ['Fully dressed', 'Appropriate for weather'] },
      { label: 'Clothing Nighttime', critical: true, subItems: ['Full outfit by door or by bed', 'Or sleeping in clothes'] },
      { label: 'Footwear Daytime', critical: true, subItems: ['Wearing closed-toe shoes', 'Not slippers or barefoot'] },
      { label: 'Footwear Nighttime', critical: true, subItems: ['Closed-toe shoes by bed', 'Or by door'] },
      { label: 'Keys', critical: true, subItems: ['On person or by door', 'Location known'] },
      { label: 'Wallet', subItems: ['On person or accessible', 'Contains ID'] },
      { label: 'Medications', subItems: ['Taken on schedule', 'Supply checked'] },
      { label: 'Rest', subItems: ['Rested when possible', 'Not sleep-deprived'] },
      { label: 'Hygiene', subItems: ['Shower', 'Brush teeth'] },
      { label: 'Toilet Visits', subItems: ['Taken as soon as possible', 'Do not delay'] },
      { label: 'News Updates', subItems: ['Scanned every 1-3 hours', 'Official sources prioritised'] },
      { label: 'Alerting Area', subItems: ['Your area is known', 'Time to shelter is known'] },
      { label: 'Public Shelters', subItems: ['Nearest 3 shelters known', 'Accessibility verified', 'Shelter is open'] },
      { label: 'HFC App Check', subItems: ['Checked today', 'Current advice reviewed'] },
      { label: 'Supply Maintenance', subItems: ['Water and food replaced every 3 months', 'Batteries and electronics checked every 6 months'] },
    ],
  },
  {
    id: 'sit-daytime',
    title: 'Daytime At-Home Posture',
    items: [
      { label: 'Phone', critical: true, subItems: ["On person or within arm's reach", 'Charged or charging', 'HFC app running'] },
      { label: 'Dressed', critical: true, subItems: ['Fully clothed', 'Closed-toe shoes on'] },
      { label: 'Keys', critical: true, subItems: ['On person or by door'] },
      { label: 'Go Bag', critical: true, subItems: ['By door', 'Zipped'] },
      { label: 'Exit Route', critical: true, subItems: ['Hallway clear', 'Front door can be opened quickly'] },
      { label: 'Browser Alert', subItems: ['Red Alert extension active on computer'] },
    ],
  },
  {
    id: 'sit-wfh',
    title: 'Working From Home',
    items: [
      { label: 'Dressed & Shoed', critical: true, subItems: ['Fully clothed', 'Closed-toe shoes on'] },
      { label: 'Go Bag', critical: true, subItems: ['By door', 'Zipped'] },
      { label: 'Headphones', critical: true, subItems: ['Use one ear only, or keep volume low enough to hear a siren'] },
      { label: 'Phone', critical: true, subItems: ["On person or within arm's reach", 'HFC app running'] },
      { label: 'Browser Alert', subItems: ['Red Alert extension active'] },
      { label: 'Video Calls', subItems: ['Warn you may need to leave abruptly'] },
      { label: 'Notify Team', subItems: ['Team or manager notified'] },
      { label: 'Save Work', critical: true, subItems: ['Saving frequently', 'Auto-save enabled'] },
      { label: 'Readiness Check', critical: true, subItems: ['Not ignoring alerts', 'Readiness not compromised by work'] },
    ],
  },
  {
    id: 'sit-reset',
    title: 'After Returning From Shelter',
    items: [
      { label: 'Go Bag', critical: true, subItems: ['Back by door', 'Re-zipped', 'Contents checked'] },
      { label: 'Phone', critical: true, subItems: ['On charge if battery dropped', 'HFC app still running'] },
      { label: 'Power Bank', subItems: ['Put on charge', 'Level checked'] },
      { label: 'Water', subItems: ['Emergency stock checked', 'Resupplied if used'] },
      { label: 'Clothes & Shoes', subItems: ['Back in position'] },
      { label: 'Torch', subItems: ['Back in position'] },
      { label: 'Dependents', critical: true, subItems: ['All accounted for', 'All safe'] },
      { label: 'Self-Care (You)', critical: true, subItems: ['Drink water', 'Eat if you can', 'Use the toilet', 'Rest when possible'] },
      { label: 'Self-Care (Children)', critical: true, subItems: ['Fed', 'Watered', 'Toileted or changed', 'Rested'] },
      { label: 'News Check', subItems: ['Official sources scanned', 'Situation status assessed'] },
    ],
  },
  {
    id: 'sit-shower',
    title: 'Before Showering',
    items: [
      { label: 'News Check', critical: true, subItems: ['No active alerts in your area'] },
      { label: 'Phone', critical: true, subItems: ['Volume at maximum', 'In bathroom or just outside door'] },
      { label: 'Clothes', critical: true, subItems: ['Full outfit in bathroom', 'Ready to throw on immediately'] },
      { label: 'Footwear', critical: true, subItems: ['Closed-toe shoes by bathroom door'] },
      { label: 'Towel', subItems: ['Within reach for rapid dry-off'] },
      { label: 'Door', subItems: ['Bathroom door unlocked'] },
      { label: 'Keep It Short', critical: true, subItems: ['Minimise shower time'] },
    ],
  },
  {
    id: 'sit-bedtime',
    title: 'Before Bed',
    items: [
      { label: 'News Check', subItems: ['Situation scanned', 'Safe to sleep at home tonight'] },
      { label: 'Phone', critical: true, subItems: ['Charging or charged', 'Not in airplane mode', 'HFC app permissions enabled'] },
      { label: 'Clothes', critical: true, subItems: ['Full outfit laid out by bed'] },
      { label: 'Footwear', critical: true, subItems: ['Closed-toe shoes by bed'] },
      { label: 'Torch', subItems: ["Within arm's reach on nightstand"] },
      { label: 'Glasses', subItems: ['By bed if needed'] },
      { label: 'Keys', subItems: ['Accessible'] },
      { label: 'Go Bag', critical: true, subItems: ['By door', 'Contents verified', 'Power bank on charge'] },
      { label: 'Exit Route', critical: true, subItems: ['Hallway clear and navigable in the dark', 'Front door not double-locked'] },
      { label: 'Hearing', critical: true, subItems: ['No earplugs in', 'Can hear siren and phone alert'] },
      { label: 'Dependents', critical: true, subItems: ['All accounted for', 'Baby clothed or clothes by bed'] },
    ],
  },
  {
    id: 'sit-leaving',
    title: 'Before Leaving Home',
    items: [
      { label: 'Go Bag', critical: true, subItems: ['Taking with you', 'Zipped and ready'] },
      { label: 'News Check', critical: true, subItems: ['Situation scanned', 'HFC app checked for alerts along route'] },
      { label: 'Shelters', critical: true, subItems: ['Nearest shelters identified at destination', 'Shelters identified along route'] },
      { label: 'Time To Shelter', subItems: ['Known for destination area'] },
      { label: 'Phone', critical: true, subItems: ['Charged', 'HFC app running'] },
      { label: 'Car Fuel', subItems: ['At least half a tank'] },
      { label: 'Household Notified', subItems: ['Destination communicated'] },
    ],
  },
  {
    id: 'shabbat',
    title: 'Shabbat / Hag',
    items: [
      { label: 'Channel 14 / Gal Shaket', critical: true, subItems: ['Playing on TV before Shabbat', 'Volume tested and audible from bedrooms'] },
      { label: 'Emergency Radio', critical: true, subItems: ['Frequency verified', 'Volume at maximum', 'AC connected or batteries OK'] },
      { label: 'Go Bag', subItems: ['By door', 'Contents verified'] },
      { label: 'Shabbat Supplies', subItems: ['Siddur packed', 'Kiddush cup packed', 'Snacks for shelter'] },
      { label: 'Shoes', critical: true, subItems: ['Closed-toe by bed', 'Closed-toe by door'] },
      { label: 'Clothes', subItems: ['Full outfit laid out by bed'] },
      { label: 'Keys', subItems: ['By front door'] },
      { label: 'Torch', subItems: ["Within arm's reach", 'Pre-set on nightstand'] },
    ],
  },
  {
    id: 'hfc-app',
    title: 'HFC App Configuration',
    items: [
      { label: 'Installed', subItems: ['App installed', 'Installation verified'] },
      { label: 'Up To Date', subItems: ['No pending updates'] },
      { label: 'Alerting Area', subItems: ['Area set', 'Area correct'] },
      { label: 'Permissions', subItems: ['DND exemption verified', 'Remove permissions if unused disabled', 'Battery optimisations disabled', 'Background data access permitted', 'Display over other apps granted'] },
    ],
  },
  {
    id: 'mamad',
    title: 'Mamad (Protected Space) Inspection',
    items: [
      { label: 'Blast Door', subItems: ['Opens and closes easily', 'Handle turns 90 degrees upward', 'Double lock functions'] },
      { label: 'Door Seal', subItems: ['Rubber insulation present', 'Not dried out or cracked'] },
      { label: 'Light Test', subItems: ['No light penetration when door is sealed'] },
      { label: 'Steel Outer Window', subItems: ['Opens easily', 'Closes easily'] },
      { label: 'Glass Inner Window', subItems: ['Functions correctly', 'Locks engage'] },
      { label: 'Ventilation Pipes', subItems: ['Rubber insulation intact', 'Steel cover screws tighten fully'] },
      { label: 'Flammable / Hazardous Materials', subItems: ['None stored inside mamad'] },
      { label: 'Glass / Ceramics', subItems: ['No glass items inside', 'No ceramic items inside'] },
      { label: 'Heavy Items', subItems: ['Shelves fixed to walls', 'Heavy items secured'] },
      { label: 'Gas Tanks', subItems: ['3 or more metres from protected room walls'] },
      { label: 'Supplies', subItems: ['Stored inside or immediately nearby'] },
      { label: 'Ceiling Fan', subItems: ['No ceiling fan installed'] },
      { label: 'Ventilation', subItems: ['Room is ventilated if used as bedroom'] },
    ],
  },
  {
    id: 'home-safety',
    title: 'Pre-Emergency Home Safety',
    items: [
      { label: 'Bookcases & Shelves', subItems: ['Secured to walls with L-brackets or straps', 'Heavy objects stored low'] },
      { label: 'Appliances', subItems: ['Wheeled appliances wheels locked', 'Heavy appliances stable and secured'] },
      { label: 'Gas Shutoff', critical: true, subItems: ['Location known by all household members', 'All members know how to shut off'] },
      { label: 'Electricity Shutoff', critical: true, subItems: ['Location known — main breaker box', 'All members know how to shut off'] },
      { label: 'Fire Extinguisher', subItems: ['Accessible and not expired', 'All members know how to use'] },
      { label: 'Smoke Detector', subItems: ['Installed', 'Tested and working', 'Batteries replaced annually'] },
      { label: 'Water Heater', subItems: ['Strapped to wall', 'Cannot topple'] },
      { label: 'Windows', subItems: ['No glass objects on windowsills', 'Blinds or shutters functional'] },
    ],
  },
];

// ─── Script builder ───

function buildScript(title, items) {
  const lines = [`${title}. Here are the items to check.\n`];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let line = `Item ${i + 1}: ${item.label}.`;
    if (item.critical) line += ' This is a critical item.';
    if (item.subItems?.length) line += ' Check: ' + item.subItems.join('. ') + '.';
    lines.push(line);
  }
  lines.push(`\nThat completes the ${title}. ${items.length} items total.`);
  return lines.join('\n');
}

// ─── Gemini TTS call ───

async function generateTTS(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini TTS ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts;
  if (!parts?.length) throw new Error('No audio in response');

  for (const part of parts) {
    if (part.inlineData) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }
  }
  throw new Error('No inlineData in response');
}

// ─── Main ───

async function main() {
  console.log(`Generating audio for ${checklists.length} checklists...\n`);

  for (const cl of checklists) {
    const script = buildScript(cl.title, cl.items);
    const wordCount = script.split(/\s+/).length;
    console.log(`  ${cl.id} (${cl.items.length} items, ~${wordCount} words)...`);

    try {
      const { base64, mimeType } = await generateTTS(script);
      const ext = mimeType?.includes('wav') ? 'wav' : 'mp3';
      const outPath = resolve(AUDIO_DIR, `${cl.id}.${ext}`);
      const buf = Buffer.from(base64, 'base64');
      writeFileSync(outPath, buf);
      console.log(`    ✓ ${outPath} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
    } catch (e) {
      console.error(`    ✗ ${cl.id}: ${e.message}`);
    }

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log('\nDone! Audio files are in assets/audio/');
  console.log('Run a build to bundle them into the APK.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
