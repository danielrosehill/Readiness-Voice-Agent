import { ChecklistItem, ChecklistSection, ChecklistEntry, PantryCategory } from '../types';

// ─── BRACED Quick Smoke Test ───

export const bracedChecklist: ChecklistSection = {
  id: 'braced',
  title: 'Quick Smoke Test — BRACED',
  description: 'Stay BRACED. Periodic rapid readiness check — under 2 minutes.',
  color: '#0e7c47',
  items: [
    { id: 'b', label: 'B — Bag', critical: true, subItems: ['Position by door & zipped', 'Contents verified'] },
    { id: 'r', label: 'R — Route', critical: true, subItems: ['Hallway clear', 'Door unlockable quickly'] },
    { id: 'a', label: 'A — Alerts', critical: true, subItems: ['Phone on and charged', 'HFC app running', 'Correct alert area set', 'Wireless emergency alerts enabled', 'DND override verified'] },
    { id: 'c', label: 'C — Cover', critical: true, subItems: ['Three shelter locations known', 'Routes walkable'] },
    { id: 'e', label: 'E — Essentials', critical: true, subItems: ['Water supply accessible (72-hour minimum)', 'Not expired'] },
    { id: 'd', label: 'D — Dependents', critical: true, subItems: ['Headcount verified — all present or accounted for', 'All contactable'] },
  ],
};

// ─── Master Checklist ───

export const masterChecklist: ChecklistSection[] = [
  {
    id: 'master-tech',
    title: 'Technical Systems & Alerts',
    color: '#c0392b',
    items: [
      { id: 'smartphone', label: 'Smartphone', critical: true, subItems: ['On person or location known', 'Battery level OK or charging'] },
      { id: 'smartphone-config', label: 'Smartphone Configuration', critical: true, subItems: ['Powered on (DND okay; airplane mode NOT okay)', 'Location services enabled', 'HFC app installed', 'HFC app configured', 'HFC app running', 'Correct alert area validated', "Emergency wireless alerts activated — 'Extreme' threats alerting"] },
      { id: 'computer', label: 'Computer', subItems: ['Red Alert app for browser is active', 'Correct location set', 'Tested and validated working'] },
    ],
  },
  {
    id: 'master-home',
    title: 'Home Environment',
    color: '#c0392b',
    items: [
      { id: 'water', label: 'Water', critical: true, subItems: ['72 hours supply ready and accessible', 'Resupplied when necessary'], details: '3L per person per day' },
      { id: 'food', label: 'Food', critical: true, subItems: ['Pantry goods stocked', 'Resupplied when necessary'] },
      { id: 'torch', label: 'Torch', subItems: ['Accessible', 'Hand crank or battery with reserve'] },
      { id: 'hallway', label: 'Hallway', critical: true, subItems: ['Clear of obstructions', 'Navigable in the dark'] },
      { id: 'fire-ext', label: 'Fire Safety', subItems: ['Fire extinguisher accessible', 'Smoke detector installed and tested'] },
      { id: 'escape', label: 'Escape Routes', subItems: ['Primary exit identified', 'Secondary exit identified', 'Routes clear of obstacles'], details: 'Back door, porch, or emergency stairs as secondary' },
      { id: 'baby-carry', label: 'Baby Carry', subItems: ['By front door', 'Ready to use'] },
      { id: 'mamad', label: 'Mamad', subItems: ['Prepared', 'Inspected'], details: 'See Mamad Inspection checklist for details' },
    ],
  },
  {
    id: 'master-gobag',
    title: 'Go Bag',
    color: '#c0392b',
    items: [
      { id: 'prepared', label: 'Prepared', critical: true, subItems: ['By door', 'Zipped or sealed'] },
      { id: 'contents-basic', label: 'Contents (Basic)', critical: true, subItems: ['Phone charger and cable packed', 'Power bank packed and level verified or charging', 'Essential medications packed and supply checked', 'Torch inside and charged', 'N95 mask packed'], details: 'One mask per person' },
      { id: 'contents-additional', label: 'Contents (Additional)', subItems: ['Emergency whistle', 'AM/FM radio with battery or charge OK', 'First aid kit supplied', 'Travel router', 'Caffeine pills'] },
      { id: 'contents-overnight', label: 'Contents (Overnight Shelter Stays)', subItems: ['Religious effects', 'Food and drink for longer stays', 'Eye mask and earplugs', 'Water bottles', 'Tent or blanket'] },
      { id: 'travel-docs', label: 'Travel Documents', subItems: ['Passports packed and validated', 'Cash on hand or packed', 'National IDs packed'] },
    ],
  },
  {
    id: 'master-people',
    title: 'People & Dependents',
    color: '#c0392b',
    items: [
      { id: 'dependents', label: 'Dependents', critical: true, subItems: ['All household members present or accounted for', 'All contactable'] },
    ],
  },
  {
    id: 'master-babies',
    title: 'Babies & Young Children',
    color: '#c0392b',
    items: [
      { id: 'baby-supplies', label: 'Essential Supplies', critical: true, subItems: ['Diapers', 'Wipes', 'Pacifier', 'Formula', 'Bottle', 'Changing mat + privacy'] },
      { id: 'baby-ready', label: 'Ready To Go', critical: true, subItems: ['Clothed or clothes by bed', 'Babywear by door', 'Fed (if needed)', 'Cleaned (if needed)'] },
    ],
  },
  {
    id: 'master-person',
    title: 'Person & Personal Effects',
    color: '#c0392b',
    items: [
      { id: 'clothing-day', label: 'Clothing (Daytime)', critical: true, subItems: ['Fully dressed', 'Appropriate for weather'] },
      { id: 'clothing-night', label: 'Clothing (Nighttime)', critical: true, subItems: ['Full outfit by door or by bed', 'Or sleeping in clothes'] },
      { id: 'footwear-day', label: 'Footwear (Daytime)', critical: true, subItems: ['Wearing closed-toe shoes', 'Not slippers or barefoot'] },
      { id: 'footwear-night', label: 'Footwear (Nighttime)', critical: true, subItems: ['Closed-toe shoes by bed', 'Or closed-toe shoes by door'] },
      { id: 'keys', label: 'Keys', critical: true, subItems: ['On person or by door', 'Location known'] },
      { id: 'wallet', label: 'Wallet', subItems: ['On person or accessible', 'Contains ID'] },
      { id: 'meds', label: 'Medications', subItems: ['Taken on schedule', 'Supply checked'] },
      { id: 'rest', label: 'Rest', subItems: ['Rested when possible', 'Not sleep-deprived'] },
      { id: 'hygiene', label: 'Hygiene', subItems: ['Shower', 'Brush teeth'] },
      { id: 'toilet', label: 'Toilet Visits', subItems: ['Taken as soon as possible', 'Do not delay'], details: 'You may not get another chance for a while' },
    ],
  },
  {
    id: 'master-awareness',
    title: 'Situational Awareness',
    color: '#c0392b',
    items: [
      { id: 'news', label: 'News Updates', subItems: ['Scanned every 1-3 hours', 'Prioritising official/government sources'] },
      { id: 'alert-area', label: 'Alerting Area', subItems: ['Your area is known', 'Time to shelter is known'] },
      { id: 'shelters', label: 'Public Shelters', subItems: ['Nearest 3 shelters known', 'Accessibility verified', 'Shelter is open', 'Hours noted'] },
      { id: 'hfc-check', label: 'HFC App', subItems: ['Checked today', 'Current advice reviewed'] },
      { id: 'supply-maint', label: 'Supply Maintenance', subItems: ['Water and food replaced every 3 months', 'Batteries and electronics checked every 6 months'] },
    ],
  },
];

// ─── Situational Checklists ───

export const situationalChecklists: ChecklistSection[] = [
  {
    id: 'sit-daytime',
    title: 'Daytime At-Home Posture',
    description: 'Quick status check while at home during the day.',
    color: '#d35400',
    items: [
      { id: 'phone', label: 'Phone', critical: true, subItems: ["On person or within arm's reach", 'Charged or charging', 'HFC app running'] },
      { id: 'dressed', label: 'Dressed', critical: true, subItems: ['Fully clothed', 'Closed-toe shoes on'] },
      { id: 'keys', label: 'Keys', critical: true, subItems: ['On person or by door', 'Location known'] },
      { id: 'gobag', label: 'Go Bag', critical: true, subItems: ['By door', 'Zipped'] },
      { id: 'exit', label: 'Exit Route', critical: true, subItems: ['Hallway clear', 'Front door can be opened quickly'] },
      { id: 'browser', label: 'Browser Alert', subItems: ['Red Alert extension active on computer'] },
    ],
  },
  {
    id: 'sit-wfh',
    title: 'Working From Home',
    description: 'Keep one ear free. Save work frequently. You may need to abandon your desk mid-sentence.',
    color: '#d35400',
    items: [
      { id: 'dressed', label: 'Dressed & Shoed', critical: true, subItems: ['Fully clothed', 'Closed-toe shoes on'] },
      { id: 'gobag', label: 'Go Bag', critical: true, subItems: ['By door', 'Zipped'] },
      { id: 'headphones', label: 'Headphones', critical: true, subItems: ['Use one ear only, or keep volume low enough to hear a siren'] },
      { id: 'phone', label: 'Phone', critical: true, subItems: ["On person or within arm's reach", 'HFC app running'] },
      { id: 'browser', label: 'Browser Alert', subItems: ['Red Alert extension active'] },
      { id: 'video-calls', label: 'Video Calls', subItems: ['Warn you may need to leave abruptly'] },
      { id: 'notify', label: 'Notify Team', subItems: ['Team or manager notified'] },
      { id: 'save', label: 'Save Work', critical: true, subItems: ['Saving frequently', 'Auto-save enabled'] },
      { id: 'readiness', label: 'Readiness Check', critical: true, subItems: ['Not ignoring alerts', 'Readiness not compromised by work'] },
    ],
  },
  {
    id: 'sit-reset',
    title: 'After Returning From Shelter',
    description: 'Run immediately after the all-clear. Restore full readiness before the next alert.',
    color: '#d35400',
    items: [
      { id: 'gobag', label: 'Go Bag', critical: true, subItems: ['Back by door', 'Re-zipped', 'Contents checked'] },
      { id: 'phone', label: 'Phone', critical: true, subItems: ['On charge if battery dropped', 'HFC app still running'] },
      { id: 'powerbank', label: 'Power Bank', subItems: ['Put on charge', 'Level checked'] },
      { id: 'water', label: 'Water', subItems: ['Emergency stock checked', 'Resupplied if used'] },
      { id: 'clothes', label: 'Clothes & Shoes', subItems: ['Back in position'] },
      { id: 'torch', label: 'Torch', subItems: ['Back in position'] },
      { id: 'dependents', label: 'Dependents', critical: true, subItems: ['All accounted for', 'All safe'] },
      { id: 'selfcare', label: 'Self-Care (You)', critical: true, subItems: ['Drink water', 'Eat if you can', 'Use the toilet', 'Rest when possible'] },
      { id: 'selfcare-kids', label: 'Self-Care (Children)', critical: true, subItems: ['Fed', 'Watered', 'Toileted or changed', 'Rested'] },
      { id: 'news', label: 'News Check', subItems: ['Official sources scanned', 'Situation status assessed'] },
    ],
  },
  {
    id: 'sit-shower',
    title: 'Before Showering',
    description: 'You are at your most vulnerable during a shower. Be quick.',
    color: '#d35400',
    items: [
      { id: 'news', label: 'News Check', critical: true, subItems: ['No active alerts in your area'] },
      { id: 'phone', label: 'Phone', critical: true, subItems: ['Volume at maximum', 'In bathroom or just outside door'] },
      { id: 'clothes', label: 'Clothes', critical: true, subItems: ['Full outfit in bathroom', 'Ready to throw on immediately'] },
      { id: 'shoes', label: 'Footwear', critical: true, subItems: ['Closed-toe shoes by bathroom door'] },
      { id: 'towel', label: 'Towel', subItems: ['Within reach for rapid dry-off'] },
      { id: 'door', label: 'Door', subItems: ['Bathroom door unlocked'] },
      { id: 'quick', label: 'Keep It Short', critical: true, subItems: ['Minimise shower time'] },
    ],
  },
  {
    id: 'sit-bedtime',
    title: 'Before Bed',
    description: 'Nighttime readiness posture.',
    color: '#d35400',
    items: [
      { id: 'news', label: 'News Check', subItems: ['Situation scanned', 'Safe to sleep at home tonight'] },
      { id: 'phone', label: 'Phone', critical: true, subItems: ['Charging or charged', 'Not in airplane mode', 'HFC app permissions enabled'] },
      { id: 'clothes', label: 'Clothes', critical: true, subItems: ['Full outfit laid out by bed'] },
      { id: 'shoes', label: 'Footwear', critical: true, subItems: ['Closed-toe shoes by bed'] },
      { id: 'torch', label: 'Torch', subItems: ["Within arm's reach on nightstand"] },
      { id: 'glasses', label: 'Glasses', subItems: ['By bed if needed'] },
      { id: 'keys', label: 'Keys', subItems: ['Accessible'] },
      { id: 'gobag', label: 'Go Bag', critical: true, subItems: ['By door', 'Contents verified', 'Power bank on charge'] },
      { id: 'exit', label: 'Exit Route', critical: true, subItems: ['Hallway clear and navigable in the dark', 'Front door not double-locked'] },
      { id: 'hearing', label: 'Hearing', critical: true, subItems: ['No earplugs in', 'Can hear siren and phone alert'] },
      { id: 'dependents', label: 'Dependents', critical: true, subItems: ['All accounted for', 'Baby clothed or clothes by bed'] },
    ],
  },
  {
    id: 'sit-leaving',
    title: 'Before Leaving Home',
    description: 'Pre-departure safety check.',
    color: '#d35400',
    items: [
      { id: 'gobag', label: 'Go Bag', critical: true, subItems: ['Taking with you', 'Zipped and ready'] },
      { id: 'news', label: 'News Check', critical: true, subItems: ['Situation scanned', 'HFC app checked for alerts along route'] },
      { id: 'shelters', label: 'Shelters', critical: true, subItems: ['Nearest shelters identified at destination', 'Shelters identified along route'] },
      { id: 'time', label: 'Time To Shelter', subItems: ['Known for destination area'] },
      { id: 'phone', label: 'Phone', critical: true, subItems: ['Charged', 'HFC app running'] },
      { id: 'fuel', label: 'Car Fuel', subItems: ['At least half a tank'] },
      { id: 'notify', label: 'Household Notified', subItems: ['Destination communicated'] },
    ],
  },
];

// ─── Special Checklists ───

export const shabbatChecklist: ChecklistSection = {
  id: 'shabbat',
  title: 'Shabbat / Hag',
  description: 'Additional checks before Shabbat or Yom Tov. Pikuach nefesh overrides all Shabbat prohibitions.',
  color: '#8e44ad',
  items: [
    { id: 'tv', label: 'Channel 14 / Gal Shaket', critical: true, subItems: ['Playing on TV before Shabbat', 'Volume tested and audible from bedrooms'] },
    { id: 'radio', label: 'Emergency Radio', critical: true, subItems: ['Frequency verified', 'Volume at maximum', 'AC connected or batteries OK'] },
    { id: 'gobag', label: 'Go Bag', subItems: ['By door', 'Contents verified'] },
    { id: 'supplies', label: 'Shabbat Supplies', subItems: ['Siddur packed', 'Kiddush cup packed', 'Snacks for shelter'] },
    { id: 'shoes', label: 'Shoes', critical: true, subItems: ['Closed-toe by bed', 'Closed-toe by door'] },
    { id: 'clothes', label: 'Clothes', subItems: ['Full outfit laid out by bed'] },
    { id: 'keys', label: 'Keys', subItems: ['By front door'] },
    { id: 'torch', label: 'Torch', subItems: ["Within arm's reach", 'Pre-set on nightstand'] },
  ],
};

export const hfcAppChecklist: ChecklistSection = {
  id: 'hfc-app',
  title: 'HFC App Configuration (Android)',
  color: '#2563a0',
  items: [
    { id: 'installed', label: 'Installed', subItems: ['App installed', 'Installation verified'] },
    { id: 'updated', label: 'Up To Date', subItems: ['No pending updates'] },
    { id: 'area', label: 'Alerting Area', subItems: ['Area set', 'Area correct'] },
    { id: 'permissions', label: 'Permissions', subItems: ['DND exemption verified', '"Remove permissions if unused" disabled', 'Battery optimisations disabled', 'Background data access permitted', 'Display over other apps granted'] },
  ],
};

export const mamadChecklist: ChecklistSection = {
  id: 'mamad',
  title: 'Mamad (Protected Space) Inspection',
  description: 'Based on HFC guidelines for residential protected spaces.',
  color: '#2563a0',
  items: [
    { id: 'blast-door', label: 'Blast Door', subItems: ['Opens and closes easily', 'Handle turns 90° upward', 'Double lock functions'] },
    { id: 'door-seal', label: 'Door Seal', subItems: ['Rubber insulation present', 'Not dried out or cracked'] },
    { id: 'light-test', label: 'Light Test', subItems: ['No light penetration when door is sealed'], details: 'Light means inadequate seal' },
    { id: 'steel-window', label: 'Steel Outer Window', subItems: ['Opens easily', 'Closes easily'] },
    { id: 'glass-window', label: 'Glass Inner Window', subItems: ['Functions correctly', 'Locks engage'] },
    { id: 'ventilation', label: 'Ventilation Pipes', subItems: ['Rubber insulation intact', 'Steel cover screws tighten fully'] },
    { id: 'flammable', label: 'Flammable / Hazardous Materials', subItems: ['None stored inside mamad'] },
    { id: 'glass-items', label: 'Glass / Ceramics', subItems: ['No glass items inside', 'No ceramic items inside'], details: 'Could shatter into projectiles' },
    { id: 'heavy-items', label: 'Heavy Items', subItems: ['Shelves fixed to walls', 'Heavy items secured'] },
    { id: 'gas-tanks', label: 'Gas Tanks', subItems: ['3+ metres from protected room walls'] },
    { id: 'supplies', label: 'Emergency Supplies', subItems: ['Stored inside or immediately nearby'] },
    { id: 'ceiling-fan', label: 'Ceiling Fan', subItems: ['No ceiling fan installed'], details: 'Ceiling fans are prohibited in mamads' },
    { id: 'ventilation-use', label: 'Ventilation', subItems: ['Room is ventilated if used as bedroom'] },
  ],
};

export const homeSafetyChecklist: ChecklistSection = {
  id: 'home-safety',
  title: 'Pre-Emergency Home Safety',
  description: 'Walk-through every 6 months or after moving.',
  color: '#2563a0',
  items: [
    { id: 'bookcases', label: 'Bookcases & Shelves', subItems: ['Secured to walls with L-brackets or straps', 'Heavy objects stored low'] },
    { id: 'appliances', label: 'Appliances', subItems: ['Wheeled appliances — wheels locked', 'Heavy appliances — stable and secured'] },
    { id: 'gas-shutoff', label: 'Gas Shutoff', critical: true, subItems: ['Location known by all household members', 'All members know how to shut off'] },
    { id: 'elec-shutoff', label: 'Electricity Shutoff', critical: true, subItems: ['Location known — main breaker box', 'All members know how to shut off'] },
    { id: 'fire-ext', label: 'Fire Extinguisher', subItems: ['Accessible and not expired', 'All members know how to use'] },
    { id: 'smoke-det', label: 'Smoke Detector', subItems: ['Installed', 'Tested and working', 'Batteries replaced annually'] },
    { id: 'water-heater', label: 'Water Heater', subItems: ['Strapped to wall', 'Cannot topple'] },
    { id: 'windows', label: 'Windows', subItems: ['No glass objects on windowsills', 'Blinds or shutters functional'] },
  ],
};

export const pantryCategories: PantryCategory[] = [
  { category: 'Canned Goods', items: 'Tuna · Chickpeas · Corn · Beans · Tomatoes · Sardines', shelfLife: '2–5 years' },
  { category: 'Grains & Starches', items: 'Rice · Pasta · Couscous · Matza/crackers · Instant oatmeal', shelfLife: '1–2 years' },
  { category: 'Proteins', items: 'Canned tuna/sardines · Tahini · Halva · Peanut butter', shelfLife: '6–24 months' },
  { category: 'Dried Goods', items: 'Lentils · Dried fruits · Nuts · Seeds · Bamba', shelfLife: '6–12 months' },
  { category: 'Quick Energy', items: 'Energy bars · Chocolate · Honey · Dates', shelfLife: '6–24 months' },
  { category: 'Beverages', items: 'Instant coffee · Tea · Powdered milk · Juice boxes', shelfLife: '6–12 months' },
  { category: 'Cooking Aids', items: 'Salt · Oil · Soup mix · Spices', shelfLife: '1–2 years' },
  { category: 'Baby / Special', items: 'Formula · Baby food · Gluten-free alternatives', shelfLife: 'Check labels' },
];

// ─── Build flat list of all selectable checklists ───

function sectionToEntry(section: ChecklistSection, category: ChecklistEntry['category']): ChecklistEntry {
  return {
    id: section.id,
    title: section.title,
    description: section.description,
    color: section.color,
    category,
    items: section.items,
  };
}

/** Flatten the master checklist sections into one entry with all items */
function masterToEntry(): ChecklistEntry {
  const allItems = masterChecklist.flatMap((s) => s.items);
  return {
    id: 'master',
    title: 'Master Checklist',
    description: `Full preparedness audit — ${allItems.length} items across ${masterChecklist.length} sections.`,
    color: '#c0392b',
    category: 'master',
    items: allItems,
  };
}

export function getAllChecklists(): ChecklistEntry[] {
  return [
    // Quick
    sectionToEntry(bracedChecklist, 'quick'),
    // Master
    masterToEntry(),
    // Situational
    ...situationalChecklists.map((s) => sectionToEntry(s, 'situational')),
    // Special
    sectionToEntry(shabbatChecklist, 'special'),
    sectionToEntry(hfcAppChecklist, 'special'),
    sectionToEntry(mamadChecklist, 'special'),
    sectionToEntry(homeSafetyChecklist, 'special'),
  ];
}

export function getChecklistById(id: string): ChecklistEntry | undefined {
  return getAllChecklists().find((c) => c.id === id);
}
