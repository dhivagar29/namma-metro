# Namma Metro — Driver Simulator V2

Live: https://namma-metro-1a93.vercel.app

A Bengaluru metro cab driving sim, built with **Vite + TypeScript + React Three Fiber**. Drive **all 37 consecutive Purple Line stations**, Whitefield (Kadugodi) → Challaghatta. The exact existing English station strings and order are locked in tests; no stations were renamed or skipped.

## Run

Node.js 22.12+ (or 20.19+).

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

## Controls and duty

| Control | Action |
| --- | --- |
| W / Up (hold) | Apply power; release to coast |
| S / Down (hold) | Service brake; release to coast |
| Space (hold) | Emergency brake |
| D | Open doors when stopped and within ±8 m; close after boarding |
| M | Mute/unmute effects, ambience, and PA |
| Esc | Pause/resume |
| Drag windscreen | Limited seated head movement |
| Double-click windscreen | Centre view down the rails |
| Dashboard buttons | Latched Power / Coast / Brake; emergency button toggles |
| All 37 stops | Inspect the complete route without changing position |

1. **Select Purple · Begin duty.** Start at Whitefield with the doors open.
2. Wait **5 seconds** for passenger exchange. Boarding ticks and the progress bar track the dwell.
3. Press **D**. A **2.5-second closing warning** and motor sound play. Traction stays inhibited until the doors lock and the departure tone sounds.
4. Hold **W** to accelerate. Release to coast. Brake using **S**, the distance display, and the brake guide. The speed limit is **80 km/h**.
5. Stop within **±8 m** of the yellow S marker. Only a fully stationary, aligned train can open its doors.
6. Board once at every station. Boarding at Challaghatta completes the duty and displays stops, passengers, and time.

Manual traction and service braking ramp smoothly; coasting preserves momentum. Stylized ATP follows a conservative braking envelope and aims about 3 m before the marker. It protects mandatory stops through continuous deceleration, with no arrival teleport, position snapping, station selection, or auto-departure. Repeated door presses cannot skip stops, bypass closing, or farm passengers. Losing focus or switching tabs pauses the duty, clears traction, and silences audio.

## Cab and Bengaluru world

- Next-station, traction/distance, westbound route, and PA HUD cards live in the cab dashboard, keeping the forward windscreen clear.
- Seated, forward-facing windscreen view; molded cab pillars, glass, parked wiper, desk ventilation, Purple trim, physical master-controller lever, and reactive lamps.
- Legible speed dial, English/Kannada destination, door-lock lamps, ATP/trip status, duty clock, passengers, and boarding/stop-marker guidance.
- Twin standard-gauge tracks, dense concrete sleepers, metallic rail heads, overhead contact wires and masts, concrete viaduct beams, and two supporting piers per 80 m chunk.
- Raised platforms with yellow tactile edges, repeating canopy supports, benches, bilingual Purple station boards, waiting passengers, exit signs, and Majestic Green interchange signage.
- Faceted circular tunnel segments, radial joints, cable troughs, cool lighting, and wider underground station boxes across the Cubbon Park–Majestic–KSR stretch. Terrain rises at Baiyappanahalli.
- Dusk sky, rain-tree silhouettes, rooftop tanks, shopfronts, Kannada Bengaluru/darshini boards, moving auto-rickshaw-like traffic below the viaduct, and a passing silver/Purple six-car metro.

Procedural scene geometry and canvas-painted signs are original work. The supplied Wikimedia diagrams informed Purple/Green wayfinding and the compact route strip; source images are not loaded into the game. The English station names remain the supplied route contract. Distances, terrain transitions, architecture, and ATP are illustrative, not surveyed operating infrastructure or a training tool.

## Soundscape

Nine original, deterministic **22,050 Hz PCM WAVs** live in `public/audio/`. Regenerate them with **`npm run audio:generate`**; Node alone is sufficient.

| Sound | Trigger / mix |
| --- | --- |
| Door open / close motors | Valid door opening; final 1.2 seconds of closing |
| Closing warning | Five pulses across the closing interlock |
| Departure beep | Doors physically lock; next consecutive station becomes active |
| Traction hum | Speed-dependent playback rate and level; quieter when coasting |
| Soft brake hiss | Moving under service/emergency brake or ATP |
| PA chime + speech | Once per approach, **560 m before the next marker**, ahead of the braking zone |
| Platform murmur | Indistinct synthesized crowd formants while doors are open |
| Passenger ticks | Boarding progress and completed passenger exchange |

PA says **“Next station: <exact English name>”**, then Kannada with an installed `kn-IN` voice, or **“Mundina nildaana: <name>”** through the available English voice. English and Kannada captions remain visible during approach, including when muted. Web Speech voices are supplied by the browser/OS; if speech is unavailable the PA chime and captions still work. These are synthesized announcements, not official BMRCL recordings.

A master Web Audio bus handles all loops and effects; PA ducks the other sounds. M cancels pending/current speech and mutes the bus. Pause cancels one-shots and PA, and silences loops; resume reschedules interrupted PA. Restart clears the old station announcement and reuses the existing loop sources. Asset failures fall back to synthesized tones and traction without stopping the sim.

Kannada uses system fonts plus an optional, non-blocking **Noto Sans Kannada** stylesheet from Google Fonts. Canvas signs repaint when the font loads. No game geometry or sound depends on that network request; without a Kannada system font or the optional download, glyph quality is browser-dependent.

## Shipped Purple Line

1. Whitefield (Kadugodi)
2. Hopefarm Channasandra
3. Kadugodi Tree Park
4. Pattandur Agrahara
5. Sri Sathya Sai Hospital
6. Nallurhalli
7. Kundalahalli
8. Seetharamapalya
9. Hoodi
10. Garudacharpalya
11. Singayyanapalya
12. Krishnarajapura (KR Pura)
13. Benniganahalli
14. Baiyappanahalli — at-grade
15. Swami Vivekananda Road
16. Indiranagar
17. Halasuru
18. Trinity
19. Mahatma Gandhi Road
20. Cubbon Park — underground
21. Dr. B.R. Ambedkar Stn., Vidhana Soudha — underground
22. Sir M. Visvesvaraya Stn., Central College — underground
23. Nadaprabhu Kempegowda Stn., Majestic — underground; Green interchange signage
24. Krantivira Sangolli Rayanna Railway Station — underground
25. Magadi Road
26. Sri Balagangadharanatha Swamiji Stn., Hosahalli
27. Vijayanagara
28. Attiguppe
29. Deepanjali Nagar
30. Mysuru Road
31. Pantharapalya–Nayandahalli
32. Rajarajeshwari Nagar
33. Jnanabharathi
34. Pattanagere
35. Kengeri Bus Terminal
36. Kengeri
37. Challaghatta

All other stations are elevated. Station order follows the supplied brief; the 36 inter-station distances use the supplied Notion Purple Line bible / Vonter GTFS shapes metres, totaling 43.377 km. A duty takes approximately 50 minutes depending on driving. Green Line is not playable.

## Performance

Nine nearby 80 m scenery chunks and stations within 660 m are mounted. Repeated sleepers (about 1,500), tactile tiles, buildings, piers, and tunnel segments use instanced geometry. Station textures are disposed when streamed out. Traffic follows simulation time, so it freezes when paused. The world moves relative to a local cab camera; the complete route does not multiply the rendered scene. DPR is capped at **1.5**, and there are no shadow maps or postprocessing passes.

The target is desktop ~60 fps. **Frame rate has not been measured in this sandbox.** Vite emits its expected non-fatal warning for the Three.js renderer chunk (~1.06 MB uncompressed / ~292 KB gzip).

## Verification

`npm test` passes **14 tests** covering the exact 37-station contract, terrain, complete continuous duty, speed cap, inertia, stop tolerance, closing/boarding/traction interlocks, ATP capture across multiple speeds and time steps, all 36 pre-arrival announcements/departures, WAV integrity, mute/pause/resume/restart, and unavailable audio assets. Audio lifecycle tests use Web Audio/Speech mocks; they verify control flow, not audible quality.

`npm run build` passes TypeScript and Vite. Automated browser verification was **blocked by the environment**: Vite cannot listen (`EPERM`), and Chromium exits on a sandbox-denied socket operation. No screenshots, live interaction, audible playback, or measured fps are claimed as verified.

For operator verification on a machine with Playwright and Chromium:

```sh
npm run build
# Install/use Playwright in your local tooling first.
npm run verify:browser
# Optional tooling paths:
# PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROME_PATH=/path/to/chrome npm run verify:browser
```

The browser script intercepts requests to the built files (no HTTP listener), checks startup, boarding, closing, acceleration, moving-door interlock, keyboard emergency brake after clicking Power, mute, pause/resume, full route list, mobile overflow, loaded WAVs, and uncaught errors. It writes screenshots to `artifacts/`. Visually check an underground approach and listen to the audio on your target device as well.

## Credits

| URL / source | Author / license | What is used |
| --- | --- | --- |
| [`scripts/generate-audio.mjs`](scripts/generate-audio.mjs), [`public/audio/LICENSE.txt`](public/audio/LICENSE.txt) | Original procedural synthesis; [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) for generated WAVs | All nine sound assets; no recordings or third-party samples |
| `src/World.tsx`, `src/Cab.tsx`, `src/PassingMetro.tsx`, `src/geometry.tsx` | Original project work; no third-party model/texture assets | Cab, station/tunnel/viaduct kits, city, traffic, train, painted boards |
| [BMRCL Metro Map](https://commons.wikimedia.org/wiki/File:BMRCL_Metro_Map.png) | Sam2905 / [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Supplied reference in `refs/images/`; Purple/Green map conventions. Original image retained unmodified; no image pixels in the runtime |
| [Bengaluru Urban Rail Transit Diagram](https://commons.wikimedia.org/wiki/File:Bengaluru_Urban_Rail_Transit_Diagram.png) | Footy2000 / [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Supplied network reference; original retained unmodified, not bundled in the game |
| [NammaMetroSchematic](https://commons.wikimedia.org/wiki/File:NammaMetroSchematic.png) | Supplied reference; file license not independently verified here | Retained in `refs/images/`; not used in generated assets or shipped in `dist/` |
| [Noto Sans Kannada](https://fonts.google.com/noto/specimen/Noto+Sans+Kannada), [license](https://github.com/google/fonts/blob/main/ofl/notosanskannada/OFL.txt) | The Noto Project Authors / SIL Open Font License 1.1 | Optional Google Fonts stylesheet for Kannada UI and canvas labels; system-font fallback |
| Browser Web Speech API / device voices | Browser/OS-provided service; no voice files redistributed | English + Kannada or Kannada-style PA synthesis |
| `src/routes.ts`, original project route contract | User-supplied station names | All 37 exact English names, their order, and Kannada labels |

No commercial game rips, private CCTV, login-gated assets, downloaded official PA samples, or full-screen reference-photo backgrounds are used.

Model: **gpt-6-astra**. Updated in place. **No git push, remote changes, or deployment.** The operator handles publishing to the Live URL above.
