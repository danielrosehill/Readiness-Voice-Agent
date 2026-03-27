"""
Generate RVA checklist audio using the existing MWP Modal TTS deployment.
Calls tts_worker.remote() on the already-deployed mwp-recording-app.

Run from the MWP repo dir:
  cd ~/repos/github/My-Weird-Prompts
  modal run ~/repos/github/Readiness-Voice-Agent/scripts/modal_tts_entrypoint.py
  modal run ~/repos/github/Readiness-Voice-Agent/scripts/modal_tts_entrypoint.py --checklist braced
  modal run ~/repos/github/Readiness-Voice-Agent/scripts/modal_tts_entrypoint.py --voice corn
"""

import re
import subprocess
import sys
from pathlib import Path

MWP_REPO = Path.home() / "repos" / "github" / "My-Weird-Prompts"
sys.path.insert(0, str(MWP_REPO))

# Import the EXISTING app and tts_worker — no new image needed
from modal_app.app_config import app, volume  # noqa: F401
from modal_app.stages.tts_parallel import tts_worker  # noqa: F401

ASSETS_DIR = Path.home() / "repos" / "github" / "Readiness-Voice-Agent" / "assets" / "audio"

CHECKLISTS = [
    {"id": "braced", "title": "Quick Smoke Test — BRACED", "voice": "herman", "items": [
        {"l": "B — Bag", "c": True, "s": ["Position by door and zipped", "Contents verified"]},
        {"l": "R — Route", "c": True, "s": ["Hallway clear", "Door unlockable quickly"]},
        {"l": "A — Alerts", "c": True, "s": ["Phone on and charged", "HFC app running", "Correct alert area set"]},
        {"l": "C — Cover", "c": True, "s": ["Three shelter locations known", "Routes walkable"]},
        {"l": "E — Essentials", "c": True, "s": ["Water supply accessible, 72 hour minimum", "Not expired"]},
        {"l": "D — Dependents", "c": True, "s": ["Headcount verified", "All contactable"]},
    ]},
    {"id": "master", "title": "Master Checklist", "voice": "herman", "items": [
        {"l": "Smartphone", "c": True, "s": ["On person", "Battery OK"]},
        {"l": "Smartphone Config", "c": True, "s": ["Powered on", "HFC app running", "Correct alert area"]},
        {"l": "Water", "c": True, "s": ["72 hours supply ready"]},
        {"l": "Food", "c": True, "s": ["Pantry stocked"]},
        {"l": "Hallway", "c": True, "s": ["Clear", "Navigable in dark"]},
        {"l": "Go Bag", "c": True, "s": ["By door", "Zipped"]},
        {"l": "Go Bag Contents", "c": True, "s": ["Charger", "Power bank", "Meds", "Torch", "N95 mask"]},
        {"l": "Documents", "s": ["Passports", "Cash", "IDs"]},
        {"l": "Dependents", "c": True, "s": ["All accounted for"]},
        {"l": "Clothing", "c": True, "s": ["Dressed or outfit laid out"]},
        {"l": "Footwear", "c": True, "s": ["Closed-toe shoes"]},
        {"l": "Keys", "c": True, "s": ["On person or by door"]},
        {"l": "Shelters", "s": ["Nearest 3 known"]},
        {"l": "News", "s": ["Scanned every few hours"]},
    ]},
    {"id": "sit-daytime", "title": "Daytime At-Home Posture", "voice": "herman", "items": [
        {"l": "Phone", "c": True, "s": ["On person", "Charged", "HFC running"]},
        {"l": "Dressed", "c": True, "s": ["Clothed", "Closed-toe shoes"]},
        {"l": "Keys", "c": True, "s": ["On person or by door"]},
        {"l": "Go Bag", "c": True, "s": ["By door", "Zipped"]},
        {"l": "Exit Route", "c": True, "s": ["Hallway clear", "Door opens quickly"]},
    ]},
    {"id": "sit-wfh", "title": "Working From Home", "voice": "herman", "items": [
        {"l": "Dressed and Shoed", "c": True, "s": ["Clothed", "Closed-toe shoes"]},
        {"l": "Go Bag", "c": True, "s": ["By door"]},
        {"l": "Headphones", "c": True, "s": ["One ear only or low volume"]},
        {"l": "Phone", "c": True, "s": ["On person", "HFC running"]},
        {"l": "Save Work", "c": True, "s": ["Saving frequently"]},
    ]},
    {"id": "sit-reset", "title": "After Returning From Shelter", "voice": "herman", "items": [
        {"l": "Go Bag", "c": True, "s": ["Back by door", "Re-zipped"]},
        {"l": "Phone", "c": True, "s": ["On charge", "HFC running"]},
        {"l": "Dependents", "c": True, "s": ["All accounted for"]},
        {"l": "Self-Care", "c": True, "s": ["Drink", "Eat", "Toilet", "Rest"]},
        {"l": "News", "s": ["Official sources scanned"]},
    ]},
    {"id": "sit-shower", "title": "Before Showering", "voice": "herman", "items": [
        {"l": "News Check", "c": True, "s": ["No active alerts"]},
        {"l": "Phone", "c": True, "s": ["Max volume", "Near bathroom"]},
        {"l": "Clothes", "c": True, "s": ["Full outfit in bathroom"]},
        {"l": "Footwear", "c": True, "s": ["Shoes by bathroom door"]},
        {"l": "Keep It Short", "c": True, "s": ["Minimise shower time"]},
    ]},
    {"id": "sit-bedtime", "title": "Before Bed", "voice": "herman", "items": [
        {"l": "Phone", "c": True, "s": ["Charging", "Not airplane mode"]},
        {"l": "Clothes", "c": True, "s": ["Outfit by bed"]},
        {"l": "Footwear", "c": True, "s": ["Shoes by bed"]},
        {"l": "Go Bag", "c": True, "s": ["By door", "Power bank charging"]},
        {"l": "Exit Route", "c": True, "s": ["Navigable in dark"]},
        {"l": "Hearing", "c": True, "s": ["No earplugs", "Can hear siren"]},
    ]},
    {"id": "sit-leaving", "title": "Before Leaving Home", "voice": "herman", "items": [
        {"l": "Go Bag", "c": True, "s": ["Taking with you"]},
        {"l": "News Check", "c": True, "s": ["Situation scanned"]},
        {"l": "Shelters", "c": True, "s": ["Identified at destination and route"]},
        {"l": "Phone", "c": True, "s": ["Charged", "HFC running"]},
    ]},
    {"id": "shabbat", "title": "Shabbat and Hag", "voice": "herman", "items": [
        {"l": "TV Alert Channel", "c": True, "s": ["Playing before Shabbat", "Volume audible"]},
        {"l": "Emergency Radio", "c": True, "s": ["Frequency set", "Volume maximum"]},
        {"l": "Go Bag", "s": ["By door"]},
        {"l": "Shoes", "c": True, "s": ["Closed-toe by bed and door"]},
        {"l": "Torch", "s": ["Within reach"]},
    ]},
    {"id": "hfc-app", "title": "HFC App Configuration", "voice": "corn", "items": [
        {"l": "Installed", "s": ["App installed and verified"]},
        {"l": "Up To Date", "s": ["No pending updates"]},
        {"l": "Alerting Area", "s": ["Area set and correct"]},
        {"l": "Permissions", "s": ["DND exemption", "Battery optimisations off", "Background data on"]},
    ]},
    {"id": "mamad", "title": "Mamad Protected Space Inspection", "voice": "corn", "items": [
        {"l": "Blast Door", "s": ["Opens and closes", "Handle turns", "Double lock works"]},
        {"l": "Door Seal", "s": ["Rubber insulation OK"]},
        {"l": "Light Test", "s": ["No light when sealed"]},
        {"l": "Windows", "s": ["Steel outer and glass inner work"]},
        {"l": "Ventilation", "s": ["Insulation intact"]},
        {"l": "Hazardous Materials", "s": ["None inside"]},
        {"l": "Heavy Items", "s": ["Fixed and secured"]},
        {"l": "Supplies", "s": ["Stored inside or nearby"]},
    ]},
    {"id": "go-bag", "title": "Go Bag Check and Stockup", "voice": "herman", "items": [
        {"l": "Bag Condition", "c": True, "s": ["Zips working", "No damage"]},
        {"l": "Position", "c": True, "s": ["By front door"]},
        {"l": "Phone Charger", "c": True, "s": ["Correct cable", "Working"]},
        {"l": "Power Bank", "c": True, "s": ["Packed", "Charge checked"]},
        {"l": "Medications", "c": True, "s": ["Packed", "3 day supply", "Not expired"]},
        {"l": "Torch", "c": True, "s": ["Packed", "Working"]},
        {"l": "N95 Masks", "c": True, "s": ["One per person"]},
        {"l": "First Aid", "s": ["Packed", "Stocked"]},
        {"l": "Water", "c": True, "s": ["1 litre per person", "Sealed"]},
        {"l": "Snacks", "s": ["Packed", "Not expired"]},
        {"l": "Documents", "s": ["IDs", "Waterproof bag"]},
        {"l": "Hygiene", "s": ["Wipes", "Toothbrush", "Sanitiser"]},
    ]},
    {"id": "home-safety", "title": "Pre-Emergency Home Safety", "voice": "corn", "items": [
        {"l": "Bookcases", "s": ["Secured to walls"]},
        {"l": "Gas Shutoff", "c": True, "s": ["Location known", "All can use it"]},
        {"l": "Electricity Shutoff", "c": True, "s": ["Breaker location known"]},
        {"l": "Fire Extinguisher", "s": ["Accessible", "Not expired"]},
        {"l": "Smoke Detector", "s": ["Installed", "Tested"]},
        {"l": "Water Heater", "s": ["Strapped to wall"]},
    ]},
]


def build_script(title, items):
    lines = [f"{title}. Here are the items to check."]
    for i, item in enumerate(items):
        line = f"Item {i + 1}: {item['l']}."
        if item.get("c"):
            line += " This is a critical item."
        if item.get("s"):
            line += " Check: " + ". ".join(item["s"]) + "."
        lines.append(line)
    lines.append(f"That completes the {title}. {len(items)} items total.")
    return "\n".join(lines)


MAX_CHARS = 250


def chunk_text(text):
    """Split text at sentence boundaries, max 250 chars per chunk."""
    if len(text) <= MAX_CHARS:
        return [text]
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current = [], ""
    for s in sentences:
        if current and len(current) + len(s) + 1 > MAX_CHARS:
            chunks.append(current.strip())
            current = s
        else:
            current = (current + " " + s).strip() if current else s
    if current:
        chunks.append(current.strip())
    return chunks


def generate_checklist(cl, voice_override=None):
    """Generate audio for one checklist using the deployed tts_worker."""
    voice = voice_override or cl["voice"]
    script = build_script(cl["title"], cl["items"])
    chunks = chunk_text(script)

    # Build segments in the format tts_worker expects
    segments = [
        {"segment_idx": i, "speaker": voice, "text": chunk}
        for i, chunk in enumerate(chunks)
    ]

    print(f"  {cl['id']} ({len(cl['items'])} items, {len(segments)} segments, voice={voice})")

    # Create output dir on the Modal volume
    output_dir = f"/working/rva_tts_{cl['id']}"

    # Call the existing tts_worker on Modal GPU
    results = tts_worker.remote(segments, output_dir)

    succeeded = [r for r in results if r["success"] and r.get("path")]
    failed = [r for r in results if not r["success"]]

    if failed:
        for r in failed[:3]:
            print(f"    WARN: segment {r['segment_idx']} failed: {r.get('error', '?')}")

    if not succeeded:
        raise RuntimeError(f"All segments failed for {cl['id']}")

    # Segments are m4a files on the Modal volume.
    # Concat them into an mp3 on the volume, then read it back.
    succeeded.sort(key=lambda r: r["segment_idx"])
    return succeeded, output_dir


@app.local_entrypoint()
def main(checklist: str = None, voice: str = None):
    """Generate checklist audio via Modal GPU and save to assets/audio/."""
    # Ensure /working exists locally for volume.reload()
    Path("/working").mkdir(exist_ok=True)

    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    targets = CHECKLISTS
    if checklist:
        targets = [cl for cl in CHECKLISTS if cl["id"] == checklist]
        if not targets:
            print(f"Unknown: {checklist}")
            return

    print(f"Generating audio for {len(targets)} checklists...\n")

    for cl in targets:
        try:
            results, output_dir = generate_checklist(cl, voice)

            # Reload volume to access generated files locally
            volume.reload()

            # Concat segments locally with ffmpeg
            segment_paths = [Path(r["path"]) for r in results]
            concat_file = Path(f"/tmp/rva_concat_{cl['id']}.txt")
            with open(concat_file, "w") as f:
                for p in segment_paths:
                    f.write(f"file '{p}'\n")

            output_path = ASSETS_DIR / f"{cl['id']}.mp3"
            proc = subprocess.run(
                ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_file),
                 "-codec:a", "libmp3lame", "-b:a", "192k", str(output_path)],
                capture_output=True, text=True,
            )

            if proc.returncode != 0:
                print(f"    ffmpeg error: {proc.stderr[-200:]}")
                raise RuntimeError("ffmpeg concat failed")

            size_mb = output_path.stat().st_size / 1024 / 1024
            print(f"    ✓ {output_path.name} ({size_mb:.1f} MB)")

        except Exception as e:
            print(f"    ERROR: {e}")

    print("\nDone! Rebuild APK to bundle new audio.")
