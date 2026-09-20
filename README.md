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
- Seated, forward-facing windscreen view; deep rubberized worktop with rounded wrist edge, inclined service panels, recessed speed/effort gauges, grouped pushbuttons and toggles, notched master-controller lever, Purple header trim, demister grille, and a parked sill wiper. Door-circuit, ATP/emergency, and traction lamps follow the existing simulation; the physical gauges show speed and acceleration. Mesh controls are visual counterparts to the keyboard/HTML controls.
- Legible speed dial, English/Kannada destination, door-lock lamps, ATP/trip status, duty clock, passengers, and boarding/stop-marker guidance.
- Twin standard-gauge tracks, dense concrete sleepers, metallic rail heads, overhead contact wires and masts, and concrete viaduct beams and piers above the streets.
- Raised platforms with yellow tactile edges, repeating canopy supports, benches, bilingual Purple station boards, waiting passengers, exit signs, and Majestic Green interchange signage.
- Bible-aligned twin oval tunnel tubes on hops 18–22 (MG Road → Cubbon Park → KSR), with lining joints, cable troughs, cool fluorescent strips, platform chambers and bulkheads. Surface landmarks appear only on orientation boards underground. KSR stays enclosed for the final 48 m of its platform before the Magadi Road portal.
- Warm dusk, layered rain-tree canopies, ribbon-window IT towers, mall crowns and fins, temple gopurams, church towers, lake edges, markets, residential balconies, campuses and the open Challaghatta fringe. Painted landmark plates identify ITPB, Phoenix Marketcity, VR Bengaluru, MG Road, RVCE and the other bible tags. Depot tracks and sheds lower the horizon on both Baiyappanahalli approaches; a silver/Purple six-car metro passes on the adjacent track.

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

## Per-hop corridor

[`src/corridor.ts`](src/corridor.ts) imports all **36 hops** directly from [`refs/notes/corridor-bible.json`](refs/notes/corridor-bible.json), validates their station names/order/metres against `routes.ts`, and exposes exact cumulative boundaries. The 29 elevated hops, two at-grade hops (12–13), and five underground hops (18–22) use the bible layouts, independently of the station type displayed by the existing HUD.

[`src/landmarks.ts`](src/landmarks.ts) maps every tag to a named procedural kit. Fixed seeds and hop-relative anchors vary massing, skyline height, facade rhythm, greenery, signage and street frontage. Phoenix has a warm stepped crown; VR has a dark facade and bronze fins; medical buildings have lit crosses; temples have tiered gopurams; RVCE sits in a leafy campus belt. Generic bible tags retain generic names rather than inventing specific businesses. These are stylized corridor cues, not surveyed replicas or exact real-world landmark placements.

## Performance

[`src/CorridorChunk.tsx`](src/CorridorChunk.tsx) streams a 160 m grid, split at exact hop boundaries: one cell behind and five ahead (at least 640 m ahead throughout a cell). At most nine slices mount across hop/portal edges. Stations mount within 850 m. Solid, glass, foliage, rounded forms and fluorescent fixtures use shared geometries/materials and instanced batches; each slice's signs share one painted texture atlas and draw call. Instance buffers and sign atlases are disposed on stream-out; shared resources live until the world unmounts. No full-route geometry cache accumulates.

A deterministic route sample every 640 m peaks at **5,773 scenery instances / 34 scenery batches**, excluding the existing cab, stations, track and passing train. These are geometry budgets, not measured GPU timings. The world moves relative to a local cab camera; DPR remains capped at **1.5**, with no shadow maps or postprocessing passes.

The target is desktop ~60 fps. **Frame rate has not been measured in this sandbox.** Vite emits its expected non-fatal warning for the Three.js renderer chunk (~1.06 MB uncompressed / ~292 KB gzip).

## Verification

`npm test` passes **31 individual tests across four files** (the sandbox runner summarizes files; running each file directly reports the individual cases). The original 18 tests cover the exact 37-station contract, terrain, complete continuous duty, speed cap, inertia, stop tolerance, closing/boarding/traction interlocks, ATP capture across multiple speeds and time steps, all 36 pre-arrival announcements/departures, WAV integrity, mute/pause/resume/restart, and unavailable audio assets. Audio lifecycle tests use Web Audio/Speech mocks; they verify control flow, not audible quality.

The 13 corridor tests cover bible alignment, exact boundaries, gap-free bounded streaming, deterministic placement, complete tag coverage, distinct elevated geometry, underground surface exclusion, the KSR exit, full platform chambers, radial raycasts against both tunnel linings, train clearance, smooth grade transitions, projected landmark readability through the existing cab windscreen, and the instance/batch budget.

`npm run build` passes TypeScript and Vite. Polish 6 browser verification was **blocked by the environment**: `agent-browser` is not installed/cached, and the existing Playwright browser script cannot launch Chromium (`setsockopt: Operation not permitted`). No browser screenshots, live interaction, audible playback, or measured fps are claimed as verified. The geometry tests do not validate final browser lighting or antialiasing.

Polish 5 cab checks: `npm test` and `npm run build` pass. A mounted Three.js scene check exercised the controller and door/closing/ATP/traction lamps; raycasts confirmed ten forward crowd heads and both rails at 25 m remain clear of opaque cab geometry. An offline software geometry preview checked the worktop against a bottom 20% HUD mask; it does not verify browser materials or lighting. `style.css`, `main.tsx`, the seated camera, routes, simulation, passengers, and audio are unchanged by this pass. Live browser verification remains blocked as above.

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

Mid-hop LEDs are fictional **ADVERTISE HERE** demo slots, with a procedural **SAMPLE LOOP** on alternating hops. Screens stream with the corridor; at most two animate at 10 fps. To swap content without remeshing, pass `source={{ kind: 'image', url: '/textures/demo.png' }}` to `Billboard`, or `source={{ kind: 'canvas', canvas, paint: seconds => drawFrame(seconds) }}` for animation (including decoded GIF frames). Keep sources stable and load any future GIF decoder only for mounted live slots; a GIF URL alone is a still image slot. Canvas producers own decoder cleanup; boards dispose their GPU textures/materials.

Station-wall demo uses fictional **KANAKA FILTERS** (geometric mark only) after Whitefield — not a real brand; no BMRCL/Namma marks on the ad panel.

| URL / source | Author / license | What is used |
| --- | --- | --- |
| [`scripts/generate-audio.mjs`](scripts/generate-audio.mjs), [`public/audio/LICENSE.txt`](public/audio/LICENSE.txt) | Original procedural synthesis; [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) for generated WAVs | All nine sound assets; no recordings or third-party samples |
| [Notion Purple corridor views](https://app.notion.com/p/3e13fc78756e81a8bba2df5e172dbff2), local [`corridor-bible.json`](refs/notes/corridor-bible.json) | User-supplied corridor bible | All 36 hop layouts and landmark tags; imported directly and checked against the existing route metres |
| [OpenStreetMap contributors / copyright](https://www.openstreetmap.org/copyright) | Geographic cross-check reference | No OSM tiles, imagery or geometry are bundled. Runtime placements are stylized from the supplied bible, not surveyed OSM coordinates |
| `src/World.tsx`, `src/corridor.ts`, `src/landmarks.ts`, `src/CorridorChunk.tsx`, `src/Cab.tsx`, `src/PassingMetro.tsx`, `src/geometry.tsx` | Original project work; no third-party model/texture assets | Cab, hop-specific landmark/station/tunnel/viaduct kits, city, traffic, train, painted boards |
| [Tyne and Wear Metro train cab 02](https://commons.wikimedia.org/wiki/File:Tyne_and_Wear_Metro_train_cab_02.jpg) | Chris McKenna (Thryduulf) / [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); photographed with the driver's permission | Reference in `refs/images/cab/` for the deep shelf, inclined instrument fascia, round bezels, and grouped switches. Original retained unmodified; inspiration only, no photo pixels shipped |
| [Tokyo-Metro Series05R Cab](https://commons.wikimedia.org/wiki/File:Tokyo-Metro_Series05R_Cab.jpg) | MaedaAkihiko / [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Reference in `refs/images/cab/` for the molded worktop, controller gate, train-status display, panel fasteners, and window framing. Original retained unmodified; recreated with meshes and original procedural markings |
| [BMRCL Metro Map](https://commons.wikimedia.org/wiki/File:BMRCL_Metro_Map.png) | Sam2905 / [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | Supplied reference in `refs/images/`; Purple/Green map conventions. Original image retained unmodified; no image pixels in the runtime |
| [Bengaluru Urban Rail Transit Diagram](https://commons.wikimedia.org/wiki/File:Bengaluru_Urban_Rail_Transit_Diagram.png) | Footy2000 / [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Supplied network reference; original retained unmodified, not bundled in the game |
| [NammaMetroSchematic](https://commons.wikimedia.org/wiki/File:NammaMetroSchematic.png) | Supplied reference; file license not independently verified here | Retained in `refs/images/`; not used in generated assets or shipped in `dist/` |
| [Noto Sans Kannada](https://fonts.google.com/noto/specimen/Noto+Sans+Kannada), [license](https://github.com/google/fonts/blob/main/ofl/notosanskannada/OFL.txt) | The Noto Project Authors / SIL Open Font License 1.1 | Optional Google Fonts stylesheet for Kannada UI and canvas labels; system-font fallback |
| Browser Web Speech API / device voices | Browser/OS-provided service; no voice files redistributed | English + Kannada or Kannada-style PA synthesis |
| `src/routes.ts`, original project route contract | User-supplied station names | All 37 exact English names, their order, and Kannada labels |

No commercial game rips, private CCTV, login-gated assets, downloaded official PA samples, or full-screen reference-photo backgrounds are used.

Model: **gpt-6-astra**. Updated in place. **No git push, remote changes, or deployment.** The operator handles publishing to the Live URL above.
