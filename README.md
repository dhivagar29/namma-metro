# Namma Metro

A playable first-person evening commute through a compact, stylized Bengaluru. Ride inside a metro coach, watch the city become a tunnel, and step onto station platforms. No backend, accounts, or remote game assets.

Live: _pending_

## Run locally

Node.js 20.19+ (or 22.12+).

```sh
npm install
npm run dev
```

Open the Vite URL (normally http://localhost:5173).

```sh
npm run build
npm run preview
```

## Play & controls

- Click **Step into the evening / Look around** to capture the mouse. Mouse looks around the coach or platform.
- **Esc** releases the mouse and pauses the ride. Click **Resume & look around** to resume.
- **WASD** walks on the platform while the mouse is captured. Platform movement is bounded away from the tracks.
- **E**, or the **Explore platform / Board the coach** button, exits or enters while doors are open. This is an assisted transfer to/from the door, so you do not need to locate the doorway with the camera.
- **Depart for next stop** starts a hop. Board first if you are on the platform. Doors close, the train accelerates, coasts, brakes, and opens its doors at arrival.
- **M** or the sound button toggles audio. Audio starts after an interaction. Rumble and chimes use Web Audio; the PA stub uses browser speech synthesis when available.
- Use **Purple Line / Green Line** in the menu to switch at any time. Switching restarts that line at its first playable station. Completed-hop discovery is retained for this session.
- Ride one hop on each line to complete the small discovery objective. Continue to the end of either sequence, then choose the other line or restart using its tab.
- Leaving the browser tab pauses the journey.

## Shipped routes

**Purple:** Indiranagar → Halasuru → Trinity → Mahatma Gandhi Road → Cubbon Park. Elevated until the approach to underground Cubbon Park. Map context: Whitefield (Kadugodi) ↔ Challaghatta.

**Green:** Nadaprabhu Kempegowda Stn., Majestic → Chickpete → Krishna Rajendra Market → National College. Underground until the approach to elevated National College. Map context: Madavara ↔ Silk Institute. Majestic signage identifies the Purple/Green interchange.

Names and sequences follow the supplied route bible (19 September 2026). Distances are illustrative 1.1–1.3 km hops, not surveyed operational distances. Trips take 66–78 seconds per hop, including 12-second acceleration and braking phases. Doors remain open until you choose to depart. The setting is deliberately compact, not a map-accurate recreation. Kannada boards depend on installed system glyph support. Desktop keyboard/mouse and WebGL are required; mobile polish is out of scope.

## Stack & files

Vite + TypeScript + React + React Three Fiber + drei + three. Procedural geometry and canvas signage; synthesized audio. Optional Google Fonts enhance the interface, with system fallbacks.

- `src/main.tsx` — journey state, controls, HUD, line selection, discovery objective
- `src/World.tsx` — first-person camera, coach, sliding door, station, city/tunnel scenery
- `src/routes.ts` — locked routes and acceleration/coast/braking calculation
- `src/audio.ts` — rumble, chime, spoken PA stub
- `src/style.css` — responsive interface
- `vite.config.ts`, `tsconfig.json`, `package.json` — build configuration

Model: gpt-6-astra. No GitHub remote or deployment is created by this project.

## Validation

`npm test` checks the exact station sequences, underground transitions, and continuous acceleration/coast/braking progress across all seven hops. `npm run build` passes TypeScript and produces the static `dist/` bundle. Three.js produces a non-fatal large-chunk warning.

The implementation environment prohibits listening/browser sockets (`EPERM`), so a browser playthrough and screenshot could not be completed there. Run locally to verify pointer lock, WebGL visuals, and audio on your browser. Node 22.12+ is recommended to satisfy all transitive package engine declarations (the build also passed on Node 20.19.2).
