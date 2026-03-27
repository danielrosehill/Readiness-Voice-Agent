#!/usr/bin/env python3
"""
Generate checklist readout audio using the MWP Modal TTS pipeline.
Uses Chatterbox TTS on Modal GPUs with Herman/Corn voices.

Dispatches to the existing mwp-recording-app Modal deployment.
Segments are chunked, generated in parallel on GPU, and concatenated.

Usage:
  python scripts/generate-audio-modal.py
  python scripts/generate-audio-modal.py --checklist braced
  python scripts/generate-audio-modal.py --voice corn --checklist mamad
"""

import argparse
import re
import subprocess
import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
ASSETS_DIR = PROJECT_DIR / "assets" / "audio"
MWP_REPO = Path.home() / "repos" / "github" / "My-Weird-Prompts"

# Add MWP to path so we can import the Modal app
sys.path.insert(0, str(MWP_REPO))

# ---------------------------------------------------------------------------
# Checklist definitions
# ---------------------------------------------------------------------------

CHECKLISTS = [
    {
        "id": "braced",
        "title": "Quick Smoke Test — BRACED",
        "voice": "herman",
        "items": [
            {"label": "B — Bag", "critical": True, "subs": ["Position by door and zipped", "Contents verified"]},
            {"label": "R — Route", "critical": True, "subs": ["Hallway clear", "Door unlockable quickly"]},
            {"label": "A — Alerts", "critical": True, "subs": ["Phone on and charged", "HFC app running", "Correct alert area set", "Wireless emergency alerts enabled"]},
            {"label": "C — Cover", "critical": True, "subs": ["Three shelter locations known", "Routes walkable"]},
            {"label": "E — Essentials", "critical": True, "subs": ["Water supply accessible, 72 hour minimum", "Not expired"]},
            {"label": "D — Dependents", "critical": True, "subs": ["Headcount verified, all present or accounted for", "All contactable"]},
        ],
    },
    {
        "id": "master",
        "title": "Master Checklist",
        "voice": "herman",
        "items": [
            {"label": "Smartphone", "critical": True, "subs": ["On person or location known", "Battery level OK or charging"]},
            {"label": "Smartphone Configuration", "critical": True, "subs": ["Powered on", "Location services enabled", "HFC app installed and running", "Correct alert area validated"]},
            {"label": "Computer", "subs": ["Red Alert browser app active", "Correct location set"]},
            {"label": "Water", "critical": True, "subs": ["72 hours supply ready", "Resupplied when necessary"]},
            {"label": "Food", "critical": True, "subs": ["Pantry goods stocked"]},
            {"label": "Torch", "subs": ["Accessible", "Hand crank or battery with reserve"]},
            {"label": "Hallway", "critical": True, "subs": ["Clear of obstructions", "Navigable in the dark"]},
            {"label": "Fire Safety", "subs": ["Fire extinguisher accessible", "Smoke detector tested"]},
            {"label": "Escape Routes", "subs": ["Primary exit identified", "Secondary exit identified"]},
            {"label": "Go Bag", "critical": True, "subs": ["By door", "Zipped or sealed"]},
            {"label": "Go Bag Contents", "critical": True, "subs": ["Phone charger", "Power bank", "Essential medications", "Torch", "N95 mask"]},
            {"label": "Travel Documents", "subs": ["Passports validated", "Cash on hand", "National IDs packed"]},
            {"label": "Dependents", "critical": True, "subs": ["All household members present or accounted for", "All contactable"]},
            {"label": "Baby Supplies", "critical": True, "subs": ["Diapers", "Wipes", "Formula", "Bottle"]},
            {"label": "Clothing Daytime", "critical": True, "subs": ["Fully dressed", "Appropriate for weather"]},
            {"label": "Clothing Nighttime", "critical": True, "subs": ["Full outfit by door or bed"]},
            {"label": "Footwear", "critical": True, "subs": ["Closed-toe shoes on or by bed"]},
            {"label": "Keys", "critical": True, "subs": ["On person or by door"]},
            {"label": "Medications", "subs": ["Taken on schedule", "Supply checked"]},
            {"label": "News Updates", "subs": ["Scanned every 1 to 3 hours", "Official sources prioritised"]},
            {"label": "Public Shelters", "subs": ["Nearest 3 shelters known", "Accessibility verified"]},
            {"label": "Supply Maintenance", "subs": ["Water and food replaced every 3 months", "Batteries checked every 6 months"]},
        ],
    },
    {
        "id": "sit-daytime",
        "title": "Daytime At-Home Posture",
        "voice": "herman",
        "items": [
            {"label": "Phone", "critical": True, "subs": ["On person or within arm's reach", "Charged or charging", "HFC app running"]},
            {"label": "Dressed", "critical": True, "subs": ["Fully clothed", "Closed-toe shoes on"]},
            {"label": "Keys", "critical": True, "subs": ["On person or by door"]},
            {"label": "Go Bag", "critical": True, "subs": ["By door", "Zipped"]},
            {"label": "Exit Route", "critical": True, "subs": ["Hallway clear", "Front door can be opened quickly"]},
            {"label": "Browser Alert", "subs": ["Red Alert extension active on computer"]},
        ],
    },
    {
        "id": "sit-wfh",
        "title": "Working From Home",
        "voice": "herman",
        "items": [
            {"label": "Dressed and Shoed", "critical": True, "subs": ["Fully clothed", "Closed-toe shoes on"]},
            {"label": "Go Bag", "critical": True, "subs": ["By door", "Zipped"]},
            {"label": "Headphones", "critical": True, "subs": ["Use one ear only, or keep volume low enough to hear a siren"]},
            {"label": "Phone", "critical": True, "subs": ["On person or within arm's reach", "HFC app running"]},
            {"label": "Save Work", "critical": True, "subs": ["Saving frequently", "Auto-save enabled"]},
            {"label": "Readiness Check", "critical": True, "subs": ["Not ignoring alerts"]},
        ],
    },
    {
        "id": "sit-reset",
        "title": "After Returning From Shelter",
        "voice": "herman",
        "items": [
            {"label": "Go Bag", "critical": True, "subs": ["Back by door", "Re-zipped", "Contents checked"]},
            {"label": "Phone", "critical": True, "subs": ["On charge if battery dropped", "HFC app still running"]},
            {"label": "Water", "subs": ["Emergency stock checked", "Resupplied if used"]},
            {"label": "Dependents", "critical": True, "subs": ["All accounted for", "All safe"]},
            {"label": "Self-Care", "critical": True, "subs": ["Drink water", "Eat if you can", "Use the toilet", "Rest when possible"]},
            {"label": "News Check", "subs": ["Official sources scanned"]},
        ],
    },
    {
        "id": "sit-shower",
        "title": "Before Showering",
        "voice": "herman",
        "items": [
            {"label": "News Check", "critical": True, "subs": ["No active alerts in your area"]},
            {"label": "Phone", "critical": True, "subs": ["Volume at maximum", "In bathroom or just outside door"]},
            {"label": "Clothes", "critical": True, "subs": ["Full outfit in bathroom", "Ready to throw on immediately"]},
            {"label": "Footwear", "critical": True, "subs": ["Closed-toe shoes by bathroom door"]},
            {"label": "Door", "subs": ["Bathroom door unlocked"]},
            {"label": "Keep It Short", "critical": True, "subs": ["Minimise shower time"]},
        ],
    },
    {
        "id": "sit-bedtime",
        "title": "Before Bed",
        "voice": "herman",
        "items": [
            {"label": "Phone", "critical": True, "subs": ["Charging or charged", "Not in airplane mode"]},
            {"label": "Clothes", "critical": True, "subs": ["Full outfit laid out by bed"]},
            {"label": "Footwear", "critical": True, "subs": ["Closed-toe shoes by bed"]},
            {"label": "Torch", "subs": ["Within arm's reach on nightstand"]},
            {"label": "Go Bag", "critical": True, "subs": ["By door", "Contents verified", "Power bank on charge"]},
            {"label": "Exit Route", "critical": True, "subs": ["Hallway clear in the dark", "Front door not double-locked"]},
            {"label": "Hearing", "critical": True, "subs": ["No earplugs in", "Can hear siren and phone alert"]},
            {"label": "Dependents", "critical": True, "subs": ["All accounted for"]},
        ],
    },
    {
        "id": "sit-leaving",
        "title": "Before Leaving Home",
        "voice": "herman",
        "items": [
            {"label": "Go Bag", "critical": True, "subs": ["Taking with you", "Zipped and ready"]},
            {"label": "News Check", "critical": True, "subs": ["Situation scanned", "HFC app checked for alerts along route"]},
            {"label": "Shelters", "critical": True, "subs": ["Nearest shelters identified at destination and along route"]},
            {"label": "Phone", "critical": True, "subs": ["Charged", "HFC app running"]},
            {"label": "Car Fuel", "subs": ["At least half a tank"]},
        ],
    },
    {
        "id": "shabbat",
        "title": "Shabbat and Hag",
        "voice": "herman",
        "items": [
            {"label": "Channel 14 or Gal Shaket", "critical": True, "subs": ["Playing on TV before Shabbat", "Volume tested and audible"]},
            {"label": "Emergency Radio", "critical": True, "subs": ["Frequency verified", "Volume at maximum"]},
            {"label": "Go Bag", "subs": ["By door", "Contents verified"]},
            {"label": "Shabbat Supplies", "subs": ["Siddur packed", "Kiddush cup packed", "Snacks for shelter"]},
            {"label": "Shoes", "critical": True, "subs": ["Closed-toe by bed", "Closed-toe by door"]},
            {"label": "Torch", "subs": ["Within arm's reach", "Pre-set on nightstand"]},
        ],
    },
    {
        "id": "hfc-app",
        "title": "HFC App Configuration",
        "voice": "corn",
        "items": [
            {"label": "Installed", "subs": ["App installed", "Installation verified"]},
            {"label": "Up To Date", "subs": ["No pending updates"]},
            {"label": "Alerting Area", "subs": ["Area set", "Area correct"]},
            {"label": "Permissions", "subs": ["DND exemption verified", "Battery optimisations disabled", "Background data access permitted"]},
        ],
    },
    {
        "id": "mamad",
        "title": "Mamad Protected Space Inspection",
        "voice": "corn",
        "items": [
            {"label": "Blast Door", "subs": ["Opens and closes easily", "Handle turns 90 degrees upward", "Double lock functions"]},
            {"label": "Door Seal", "subs": ["Rubber insulation present", "Not dried out or cracked"]},
            {"label": "Light Test", "subs": ["No light penetration when door is sealed"]},
            {"label": "Steel Outer Window", "subs": ["Opens easily", "Closes easily"]},
            {"label": "Ventilation Pipes", "subs": ["Rubber insulation intact", "Steel cover screws tighten fully"]},
            {"label": "Flammable Materials", "subs": ["None stored inside mamad"]},
            {"label": "Glass and Ceramics", "subs": ["No glass or ceramic items inside"]},
            {"label": "Heavy Items", "subs": ["Shelves fixed to walls", "Heavy items secured"]},
            {"label": "Supplies", "subs": ["Stored inside or immediately nearby"]},
        ],
    },
    {
        "id": "go-bag",
        "title": "Go Bag Check and Stockup",
        "voice": "herman",
        "items": [
            {"label": "Bag Condition", "critical": True, "subs": ["Zips working", "Straps intact", "No tears or damage"]},
            {"label": "Position", "critical": True, "subs": ["By front door", "Accessible in the dark"]},
            {"label": "Phone Charger and Cable", "critical": True, "subs": ["Correct cable type", "Working condition"]},
            {"label": "Power Bank", "critical": True, "subs": ["Packed", "Charge level checked", "Put on charge if below 80 percent"]},
            {"label": "Essential Medications", "critical": True, "subs": ["Packed", "Supply for 3 or more days", "Not expired"]},
            {"label": "Torch", "critical": True, "subs": ["Packed", "Working", "Batteries fresh"]},
            {"label": "N95 Masks", "critical": True, "subs": ["One per person packed", "Not damaged"]},
            {"label": "Emergency Whistle", "subs": ["Packed", "Accessible without digging"]},
            {"label": "First Aid Kit", "subs": ["Packed", "Bandages stocked", "Antiseptic not expired"]},
            {"label": "Water Bottles", "critical": True, "subs": ["Packed", "Sealed", "At least 1 litre per person"]},
            {"label": "Snacks and Energy Bars", "subs": ["Packed", "Not expired"]},
            {"label": "Cash", "subs": ["Packed", "Small denominations"]},
            {"label": "Documents", "subs": ["Passport copies", "National ID", "Waterproof bag"]},
            {"label": "Hygiene Basics", "subs": ["Wet wipes", "Toothbrush", "Hand sanitiser"]},
            {"label": "Emergency Blanket", "subs": ["Packed for extended shelter stays"]},
        ],
    },
    {
        "id": "home-safety",
        "title": "Pre-Emergency Home Safety",
        "voice": "corn",
        "items": [
            {"label": "Bookcases and Shelves", "subs": ["Secured to walls", "Heavy objects stored low"]},
            {"label": "Appliances", "subs": ["Wheeled appliances wheels locked", "Heavy appliances secured"]},
            {"label": "Gas Shutoff", "critical": True, "subs": ["Location known by all household members", "All know how to shut off"]},
            {"label": "Electricity Shutoff", "critical": True, "subs": ["Main breaker box location known", "All know how to shut off"]},
            {"label": "Fire Extinguisher", "subs": ["Accessible and not expired"]},
            {"label": "Smoke Detector", "subs": ["Installed", "Tested and working"]},
            {"label": "Water Heater", "subs": ["Strapped to wall"]},
            {"label": "Windows", "subs": ["No glass objects on windowsills"]},
        ],
    },
]


def build_script(title: str, items: list[dict]) -> str:
    """Build natural speech text for a checklist."""
    lines = [f"{title}. Here are the items to check."]
    for i, item in enumerate(items):
        line = f"Item {i + 1}: {item['label']}."
        if item.get("critical"):
            line += " This is a critical item."
        if item.get("subs"):
            line += " Check: " + ". ".join(item["subs"]) + "."
        lines.append(line)
    lines.append(f"That completes the {title}. {len(items)} items total.")
    return "\n".join(lines)


MAX_CHARS_PER_TTS = 250


def chunk_text(text: str) -> list[str]:
    """Split long text into TTS-friendly chunks (same logic as MWP pipeline)."""
    if len(text) <= MAX_CHARS_PER_TTS:
        return [text]
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""
    for s in sentences:
        if current and len(current) + len(s) + 1 > MAX_CHARS_PER_TTS:
            chunks.append(current.strip())
            current = s
        else:
            current = (current + " " + s).strip() if current else s
    if current:
        chunks.append(current.strip())
    return chunks


def generate_checklist_audio(cl: dict, voice_override: str = None):
    """Generate audio for one checklist via the MWP parallel TTS pipeline."""
    from modal_app.stages.tts_parallel import generate_dialogue_audio_parallel
    import shutil

    checklist_id = cl["id"]
    voice = voice_override or cl["voice"]
    script = build_script(cl["title"], cl["items"])

    # Build segments in the format expected by generate_dialogue_audio_parallel
    segments = []
    for chunk in chunk_text(script):
        segments.append({
            "speaker": voice,
            "text": chunk,
        })

    print(f"  {len(segments)} TTS segments ({voice})")

    # Use a temp episode dir for output
    episode_dir = Path(f"/tmp/rva_episode_{checklist_id}")
    episode_dir.mkdir(parents=True, exist_ok=True)

    # This dispatches to Modal or RunPod automatically
    dialogue_path, stats = generate_dialogue_audio_parallel(
        segments=segments,
        episode_dir=episode_dir,
        num_workers=1,  # single batch per checklist is fine
    )

    # Copy result to assets
    output_path = ASSETS_DIR / f"{checklist_id}.mp3"
    shutil.copy2(str(dialogue_path), str(output_path))

    size_mb = output_path.stat().st_size / 1024 / 1024
    print(f"  ✓ {output_path} ({size_mb:.1f} MB)")
    print(f"    Stats: {stats['segments_total']} segments, {stats['parallel_time_seconds']:.1f}s, ${stats['cost_usd']:.4f}")

    # Cleanup temp dir
    shutil.rmtree(episode_dir, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser(description="Generate checklist audio via Modal TTS")
    parser.add_argument("--checklist", help="Generate only this checklist ID")
    parser.add_argument("--voice", help="Override voice (herman or corn)")
    parser.add_argument("--list", action="store_true", help="List available checklists")
    args = parser.parse_args()

    if args.list:
        for cl in CHECKLISTS:
            print(f"  {cl['id']:20s} ({cl['voice']:8s}) {cl['title']}")
        return

    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    targets = CHECKLISTS
    if args.checklist:
        targets = [cl for cl in CHECKLISTS if cl["id"] == args.checklist]
        if not targets:
            print(f"Unknown checklist: {args.checklist}")
            return

    print(f"Generating audio for {len(targets)} checklists via Modal GPU...\n")

    for cl in targets:
        print(f"  {cl['id']} ({len(cl['items'])} items)...")
        try:
            generate_checklist_audio(cl, args.voice)
        except Exception as e:
            print(f"    ERROR: {e}")

    print("\nDone! Audio files in assets/audio/")
    print("Rebuild the APK to bundle them.")


if __name__ == "__main__":
    main()
