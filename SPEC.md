# Readiness Voice Agent — Specification

> **Status: WIP (Work In Progress)**

## Overview

An Android app that uses a voice agent to interactively walk users through emergency preparedness checklists. The app is a voice-first companion to the [Israel Emergency Readiness PWA](https://github.com/danielrosehill/Israel-Emergency-Readiness-PWA), enabling hands-free checklist completion during preparation or active emergency scenarios.

## Motivation

During emergencies or high-stress preparation moments, reading and tapping through a screen-based checklist is impractical. A voice agent allows users to:

- Complete checklists hands-free (e.g., while packing a go bag, inspecting a mamad, or getting dressed)
- Receive spoken guidance and context for each checklist item
- Confirm item completion verbally ("done", "yes", "skip", "next")
- Get prompted on critical items they might otherwise miss

## Core Concept

The app presents the user with a **checklist selection screen**, then launches a **conversational voice agent** that reads each item aloud, waits for verbal confirmation, and tracks progress. The agent provides contextual details when asked (e.g., "what should be in my go bag?") and flags critical items with extra emphasis.

## Checklists

All checklists are sourced from the existing PWA data model. The voice agent supports the following checklist categories:

### Quick Checks
- **BRACED Quick Smoke Test** — 6-item rapid readiness check (~2 minutes)

### Master Checklist (8 sections)
- Technical Systems & Alerts
- Home Environment
- Go Bag
- People & Dependents
- Babies & Young Children
- Person & Personal Effects
- Situational Awareness

### Situational Checklists
- **Daytime At-Home Posture** — Quick daytime status check
- **Working From Home** — WFH-specific readiness
- **After Returning From Shelter** — Post-all-clear reset
- **Before Showering** — Vulnerability-aware shower prep
- **Before Bed** — Nighttime readiness posture
- **Before Leaving Home** — Pre-departure safety check

### Special Checklists
- **Shabbat / Hag** — Pre-Shabbat/Yom Tov checks (pikuach nefesh aware)
- **HFC App Configuration** — Home Front Command app setup (Android)
- **Mamad (Protected Space) Inspection** — Based on HFC guidelines
- **Pre-Emergency Home Safety** — Semi-annual walkthrough
- **Emergency Pantry Staples** — Food/water supply audit

## Voice Agent Behavior

### Interaction Flow
1. User selects a checklist (voice or tap)
2. Agent introduces the checklist (name, purpose, estimated time)
3. Agent reads each item aloud with its label
4. User responds verbally: "done" / "yes" / "check" / "skip" / "next" / "tell me more"
5. On "tell me more" — agent reads the `details` and `subItems` for that item
6. Critical items (`critical: true`) are announced with emphasis ("This is a critical item...")
7. Sub-items are read as a nested list if the user wants detail
8. Agent announces progress periodically ("You're halfway through" / "3 items remaining")
9. On completion, agent gives a summary (items checked, items skipped, critical items missed)

### Voice Commands
| Command | Action |
|---------|--------|
| "Done" / "Yes" / "Check" | Mark current item complete, advance |
| "Skip" | Skip item without marking, advance |
| "Go back" | Return to previous item |
| "Tell me more" / "Details" | Read item details and sub-items |
| "Repeat" | Re-read current item |
| "How many left?" | Announce remaining count |
| "Stop" / "Pause" | Pause the session (resume later) |
| "Restart" | Start the current checklist over |

### Agent Personality
- Calm, clear, and direct — suited for emergency preparation context
- Uses short sentences optimized for spoken comprehension
- Adjusts pace based on checklist type (BRACED = quick/urgent, Mamad Inspection = methodical)
- Speaks in English by default with an option for Hebrew

## Technical Architecture

### Platform
- **Android** (native Kotlin or React Native — TBD)
- Minimum SDK: Android 8.0 (API 26)

### Distribution
- **Direct APK installation** (sideload) — no Play Store
- APK published as GitHub Release assets on this repository
- Users install via direct download link or QR code
- No signing key rotation concerns (self-signed / debug-upgradable key)
- Future: F-Droid listing if demand warrants

### Voice / AI Stack

**Primary mode — Gemini Live API (audio-to-audio):**
- The Live API handles STT, reasoning, and TTS in a single audio-to-audio stream
- No separate STT/TTS pipeline needed — the model listens and speaks natively
- WebSocket-based bidirectional streaming for real-time conversation
- Function calling used for checklist state management (mark item done, skip, go back, etc.)

**Offline fallback — Android on-device:**
- When no network is available, falls back to Android built-in `SpeechRecognizer` (STT) + `TextToSpeech` (TTS)
- Local keyword matching for core commands (done/skip/back/repeat/etc.)
- Static `details` and `subItems` text read aloud instead of generated responses
- Core checklist flow remains functional offline, just without conversational AI

**Voice AI Model:**
- **Model**: [`gemini-3.1-flash-live-preview`](https://ai.google.dev/gemini-api/docs/live-api) — Google's low-latency audio-to-audio model optimized for real-time dialogue
- **Key capabilities**: Native audio input/output, function calling, thinking, 131K input / 65K output tokens
- **Why this model**: Audio-to-audio eliminates the STT→LLM→TTS pipeline — the model handles the entire voice conversation natively with minimal latency
- **Authentication**: BYOK (Bring Your Own Key) — user provides their own Google AI API key in app settings
- **Thinking level**: `minimal` (default) for lowest latency during checklist walkthroughs
- See [`model-reference/gemini-3.1-flash-live-preview.md`](model-reference/gemini-3.1-flash-live-preview.md) for full model spec

### Data
- Checklist data embedded in app (synced from PWA `checklists.ts` at build time)
- Local storage for checklist progress / session state
- No account required — fully local-first

### Offline Considerations
- **Primary mode (Gemini Live API)** requires network connectivity for the audio-to-audio stream
- **Offline fallback** provides a degraded but functional experience using Android on-device STT/TTS + local keyword matching
- Checklist data is always bundled — no network needed for content
- Graceful degradation: if offline, "tell me more" reads the static `details` and `subItems` text instead of generating a conversational response

## UI (Minimal)

The app is voice-first, but needs a minimal visual interface:

- **Home screen**: List of checklist categories with tap or voice selection
- **Active session screen**: Current item displayed, progress bar, mic indicator, pause/stop buttons
- **Summary screen**: Completion report after finishing a checklist
- **Settings**: Language (EN/HE), speech rate, voice selection, theme (dark default)

## Future Considerations

- Hebrew language support (TTS + STT)
- Integration with the PWA (shared progress sync)
- Wear OS companion (wrist-based voice interaction)
- Widget for quick-launch of BRACED check
- Scheduled reminders ("Run your bedtime checklist")
- Multi-user household support

## Related Projects

- [Israel Emergency Readiness PWA](https://github.com/danielrosehill/Israel-Emergency-Readiness-PWA) — Source of all checklist data and logic
