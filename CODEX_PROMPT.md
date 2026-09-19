# Namma Metro — browser FP game (Codex + gpt-6-astra)

Build a complete playable v1 at `/workspace/namma-metro`. Do NOT create GitHub remotes or push (operator handles that). Do NOT touch `/workspace/bengaluru-auto`.

## Stack (locked)
- Vite + TypeScript
- React + React Three Fiber + @react-three/drei + three
- No backend
- `npm run build` must succeed
- Optional: `npm test` if you add a tiny unit test for route data

## Route bible (LOCKED — real names only)
Source: Notion Namma Metro lines/stations/distances (19 Sep 2026). NO fake stand-in station names.

### Colors
- Purple Line: purple identity on signs/HUD/map strip
- Green Line: green identity
- Yellow optional stretch only if time; Pink/Blue = U/C signage only if spare

### Spacing / timing
- Avg spacing ~1.2 km Purple / ~1.1 km Green — ride timing between stops should feel like ~1.1–1.3 km hops, not toy-map instant pops.

### Layout cues
- Elevated vs underground platforms/windows where it helps
- Purple underground stretch: Cubbon Park → Vidhana Soudha → Central College → Majestic → KSR Railway (MG Road↔Magadi corridor)
- Green underground: Majestic, Chickpete, KR Market

### v1 playable hops (consecutive real stations — ship BOTH flavors)
**Purple (elevated → underground):** Indiranagar → Halasuru → Trinity → Mahatma Gandhi Road → Cubbon Park
**Green (underground → elevated):** Nadaprabhu Kempegowda Stn., Majestic → Chickpete → Krishna Rajendra Market → National College

Interchange note: Majestic = Purple↔Green. RV Road = Green↔Yellow (signage OK).

Terminals for map strip context (not full ride): Purple Whitefield (Kadugodi)↔Challaghatta; Green Madavara↔Silk Institute.

## Product feel
- FP POV: primary **inside metro coach** + short **platform walk** at stops (strong for v1)
- Stylized compact world — NOT OSM
- Coach: grab poles, seats, route map strip, doors
- Stations: yellow platform edge, signage, pillars, escalator hint; bilingual-ish boards (English + Kannada *look*)
- Warm evening light through elevated windows; cooler fluorescent underground
- Train accel/coast/brake between stops; doors open; look around in coach
- Audio: light rumble + door chime + PA stub; mute toggle
- Optional objective toast using real station names from hops above

## Core loop
1. Load → FP in coach or platform → click pointer-lock
2. Ride at least one Purple hop AND one Green hop (line switch at Majestic or menu)
3. Arrive → doors open → brief platform (walk or look)
4. Optional next hop
5. No combat/MP/accounts/real GTFS

## Controls (README)
Mouse look / pointer-lock · WASD platform walk · coach look (+ optional lean) · E/click enter-exit open doors · M mute · Esc release/pause · first-load hints

## Acceptance
- Metro FP (coach/platform), not auto/car
- Purple/Green readable; real consecutive station sequences
- Train motion depart→travel→stop without freeze
- HUD: line, station, next stop or progress, mute
- README: controls, stack, local run, Live: _pending_
- `npm run build` green

## Out of scope
Full network fidelity, mobile polish, photoreal, multiplayer, monetization, inventing stations

## Deliverable in final message
Tree summary, how to run, model used (gpt-6-astra), build result, which station hops shipped.
